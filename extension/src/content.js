/*
 * Runs on every page. Stays dormant unless the page is a job posting or an
 * application flow, then:
 *   1. reports the job it sees to the background worker,
 *   2. notes when the user clicks a submit/apply control,
 *   3. watches for the "application submitted" confirmation and asks the
 *      background worker to capture the application.
 */
;(function () {
  'use strict'

  if (window.__offerflowContentLoaded) return
  window.__offerflowContentLoaded = true

  const { extractJob, looksLikeConfirmation, isSubmitControl, sourceFor } = globalThis.OfferFlowExtract
  const CHECK_INTERVAL_MS = 700
  const JOBBY_URL = /job|career|apply|application|position|opening|posting|greenhouse|lever|workday/i

  // Most pages a person visits have nothing to do with jobs; don't watch those at all.
  function isRelevantPage() {
    if (sourceFor(location.hostname) !== 'web') return true
    if (JOBBY_URL.test(location.href)) return true
    return document.querySelector('script[type="application/ld+json"]')?.textContent?.includes('JobPosting') ?? false
  }
  if (!isRelevantPage()) return

  let lastReportedKey = ''
  let confirmed = false
  let pendingCheck = null

  function send(message) {
    return chrome.runtime.sendMessage(message).catch(() => null)
  }

  function currentJob() {
    try {
      return extractJob(document, location.href)
    } catch {
      return null
    }
  }

  function reportJob() {
    const job = currentJob()
    if (!job || job.confidence === 'none') return
    const key = `${job.company}|${job.role}|${job.description.length}`
    if (key === lastReportedKey) return
    lastReportedKey = key
    send({ type: 'job-detected', job })
  }

  function checkForConfirmation() {
    pendingCheck = null
    reportJob()
    if (confirmed) return
    const text = document.body ? document.body.innerText.slice(0, 20000) : ''
    if (!looksLikeConfirmation(text)) return
    confirmed = true
    send({ type: 'application-confirmed', job: currentJob(), url: location.href }).then((result) => {
      if (result && result.ok) showToast(result)
    })
  }

  function scheduleCheck() {
    if (!pendingCheck) pendingCheck = setTimeout(checkForConfirmation, CHECK_INTERVAL_MS)
  }

  document.addEventListener(
    'click',
    (event) => {
      if (isSubmitControl(event.target)) send({ type: 'submit-intent', url: location.href })
    },
    true,
  )
  document.addEventListener('submit', () => send({ type: 'submit-intent', url: location.href }), true)

  // Single-page job sites (LinkedIn, Workday, Ashby) swap content without a page load.
  new MutationObserver(scheduleCheck).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  })
  let lastHref = location.href
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href
      confirmed = false
      lastReportedKey = ''
      scheduleCheck()
    }
  }, 1000)

  scheduleCheck()

  // --- In-page confirmation ---------------------------------------------------------

  function showToast(result) {
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647'
    const shadow = host.attachShadow({ mode: 'closed' })
    const style = document.createElement('style')
    style.textContent = `
      .toast { font: 500 13px/1.4 -apple-system, "Segoe UI", system-ui, sans-serif; color: #fff;
        background: #0c0f0d; border-radius: 12px; padding: 12px 14px; display: flex; gap: 10px;
        align-items: flex-start; max-width: 320px; box-shadow: 0 24px 48px -12px rgb(12 15 13 / .35);
        transform: translateY(12px); opacity: 0; transition: transform .25s cubic-bezier(.2,.8,.2,1), opacity .25s; }
      .toast.show { transform: none; opacity: 1; }
      .mark { flex: none; width: 18px; height: 18px; border-radius: 6px; background: #0f7a45;
        display: grid; place-items: center; font-size: 11px; margin-top: 1px; }
      .sub { color: #b3dec4; font-weight: 400; margin-top: 2px; }
      a { color: #7fc49c; text-decoration: none; font-weight: 600; }
      a:hover { text-decoration: underline; }
    `
    const toast = document.createElement('div')
    toast.className = 'toast'
    const mark = document.createElement('span')
    mark.className = 'mark'
    mark.textContent = '✓'
    const body = document.createElement('div')
    const title = document.createElement('div')
    title.textContent = result.created ? 'Saved to OfferFlow' : 'Already in OfferFlow'
    const sub = document.createElement('div')
    sub.className = 'sub'
    sub.textContent = `${result.company} · ${result.role}`
    body.append(title, sub)
    if (result.contactsAdded) {
      const contacts = document.createElement('div')
      contacts.className = 'sub'
      contacts.textContent = `+ ${result.contactsAdded} contact${result.contactsAdded === 1 ? '' : 's'}`
      body.append(contacts)
    }
    if (result.appUrl) {
      const link = document.createElement('a')
      link.href = `${result.appUrl}/dashboard`
      link.target = '_blank'
      link.rel = 'noopener'
      link.textContent = 'Open dashboard →'
      body.append(link)
    }
    toast.append(mark, body)
    shadow.append(style, toast)
    document.documentElement.append(host)
    requestAnimationFrame(() => toast.classList.add('show'))
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => host.remove(), 300)
    }, 6000)
  }
})()
