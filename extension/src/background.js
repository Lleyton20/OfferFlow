/*
 * Background worker: owns the OfferFlow API connection.
 *
 * Content scripts report what they see on each tab; this worker decides whether a
 * confirmation really means "the user just applied" (it needs a recent submit click
 * in the same tab and a job seen in that tab), then posts the capture.
 */
if (typeof importScripts === 'function') importScripts('settings.js')

const { getSettings, trimUrl } = globalThis.OfferFlowSettings

const SUBMIT_WINDOW_MS = 30 * 60 * 1000
const JOB_MEMORY_MS = 2 * 60 * 60 * 1000
const RECENT_LIMIT = 8

function tabKey(tabId) {
  return `tab:${tabId}`
}

async function getTabState(tabId) {
  const key = tabKey(tabId)
  const stored = await chrome.storage.session.get(key)
  return stored[key] || {}
}

async function setTabState(tabId, patch) {
  const state = { ...(await getTabState(tabId)), ...patch }
  await chrome.storage.session.set({ [tabKey(tabId)]: state })
  return state
}

/** Keep the most informative version of a job seen in this tab. */
function betterJob(current, incoming) {
  if (!incoming || incoming.confidence === 'none') return current
  if (!current) return incoming
  if (incoming.confidence === 'high' && current.confidence !== 'high') return incoming
  if (incoming.confidence === current.confidence && incoming.description.length > current.description.length) {
    return { ...incoming, contacts: incoming.contacts.length ? incoming.contacts : current.contacts }
  }
  return current
}

function localDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

async function capture(job, { source } = {}) {
  const settings = await getSettings()
  if (!settings.token) return { ok: false, error: 'not-connected' }

  const response = await fetch(`${trimUrl(settings.apiUrl)}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.token}` },
    body: JSON.stringify({
      company: job.company,
      role: job.role,
      job_url: job.job_url,
      job_description: job.description || null,
      location: job.location || null,
      source: source || job.source || 'extension',
      date_applied: localDate(),
      contacts: job.contacts || [],
    }),
  }).catch((error) => ({ ok: false, status: 0, error }))

  if (!response.ok) {
    const error = response.status === 401 ? 'unauthorized' : response.status ? `http-${response.status}` : 'offline'
    return { ok: false, error }
  }
  const body = await response.json()
  const result = {
    ok: true,
    created: body.created,
    contactsAdded: body.contacts_added,
    company: body.application.company,
    role: body.application.role,
    applicationId: body.application.id,
    appUrl: trimUrl(settings.appUrl),
  }
  await rememberCapture(result)
  return result
}

async function rememberCapture(result) {
  const { recent = [] } = await chrome.storage.local.get('recent')
  const entry = { company: result.company, role: result.role, at: Date.now(), created: result.created }
  await chrome.storage.local.set({ recent: [entry, ...recent].slice(0, RECENT_LIMIT) })
}

async function flashBadge(tabId, ok) {
  await chrome.action.setBadgeBackgroundColor({ color: ok ? '#0f7a45' : '#b42318', tabId })
  await chrome.action.setBadgeText({ text: ok ? '✓' : '!', tabId })
  setTimeout(() => chrome.action.setBadgeText({ text: '', tabId }).catch(() => {}), 8000)
}

async function handleConfirmation(tabId, message) {
  const settings = await getSettings()
  if (!settings.autoCapture || !settings.token) return { ok: false, error: 'disabled' }

  const state = await getTabState(tabId)
  const now = Date.now()
  if (!state.submitAt || now - state.submitAt > SUBMIT_WINDOW_MS) return { ok: false, error: 'no-submit' }

  const remembered = state.job && now - (state.jobAt || 0) < JOB_MEMORY_MS ? state.job : null
  const job = betterJob(remembered, message.job)
  if (!job || !job.company || !job.role) return { ok: false, error: 'no-job' }

  const captureKey = `${job.company}|${job.role}`.toLowerCase()
  if (state.capturedKey === captureKey) return { ok: false, error: 'duplicate' }

  const result = await capture(job)
  await setTabState(tabId, { capturedKey: result.ok ? captureKey : state.capturedKey, submitAt: 0 })
  await flashBadge(tabId, result.ok)
  return result
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  const tabId = sender.tab && sender.tab.id
  const handle = async () => {
    switch (message && message.type) {
      case 'job-detected': {
        if (tabId == null) return null
        const state = await getTabState(tabId)
        const job = betterJob(state.job, message.job)
        if (job !== state.job) await setTabState(tabId, { job, jobAt: Date.now() })
        return null
      }
      case 'submit-intent':
        if (tabId != null) await setTabState(tabId, { submitAt: Date.now() })
        return null
      case 'application-confirmed':
        return tabId == null ? null : handleConfirmation(tabId, message)
      case 'capture':
        return capture(message.job, { source: message.job && message.job.source })
      case 'tab-job':
        return (await getTabState(message.tabId)).job || null
      default:
        return null
    }
  }
  handle().then(respond, (error) => respond({ ok: false, error: String(error) }))
  return true
})

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(tabKey(tabId)).catch(() => {})
})

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') chrome.runtime.openOptionsPage()
})
