const { getSettings, saveSettings, trimUrl } = globalThis.OfferFlowSettings

const $ = (id) => document.getElementById(id)

function chip(text, tone) {
  const node = document.createElement('span')
  node.className = `chip${tone ? ` ${tone}` : ''}`
  node.textContent = text
  return node
}

function timeAgo(timestamp) {
  const minutes = Math.round((Date.now() - timestamp) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`
}

async function extractFromTab(tab) {
  if (!tab || !/^https?:/.test(tab.url || '')) return null
  // The background worker may already hold a richer version from earlier in this tab.
  const remembered = await chrome.runtime.sendMessage({ type: 'tab-job', tabId: tab.id }).catch(() => null)
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/extract.js'] })
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => globalThis.OfferFlowExtract.extractJob(document, location.href),
    })
    if (result && result.confidence !== 'none') {
      if (remembered && remembered.confidence === 'high' && result.confidence !== 'high') return remembered
      return result
    }
  } catch {
    // Pages like the Chrome Web Store can't be scripted.
  }
  return remembered
}

function renderJob(job) {
  $('job').hidden = false
  $('job-role').textContent = job.role
  $('job-company').textContent = [job.company, job.location].filter(Boolean).join(' · ')
  const metaRow = $('job-meta')
  metaRow.replaceChildren()
  if (job.source && job.source !== 'web') metaRow.append(chip(job.source[0].toUpperCase() + job.source.slice(1), 'brand'))
  if (job.description) metaRow.append(chip('Description'))
  if (job.contacts && job.contacts.length) {
    metaRow.append(chip(`${job.contacts.length} contact${job.contacts.length === 1 ? '' : 's'}`))
  }
}

function renderRecent(recent) {
  const list = $('recent')
  list.replaceChildren()
  $('recent-wrap').hidden = recent.length === 0
  for (const item of recent.slice(0, 4)) {
    const li = document.createElement('li')
    const name = document.createElement('span')
    name.textContent = `${item.company} · ${item.role}`
    const when = document.createElement('span')
    when.className = 'muted'
    when.textContent = timeAgo(item.at)
    li.append(name, when)
    list.append(li)
  }
}

async function init() {
  const settings = await getSettings()
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  $('open-settings').addEventListener('click', () => chrome.runtime.openOptionsPage())
  $('connect').addEventListener('click', () => chrome.runtime.openOptionsPage())
  $('open-app').addEventListener('click', () => chrome.tabs.create({ url: `${trimUrl(settings.appUrl)}/dashboard` }))

  if (!settings.token) {
    $('disconnected').hidden = false
    return
  }

  $('prefs').hidden = false
  $('open-app').hidden = false
  $('auto-capture').checked = settings.autoCapture
  $('auto-capture').addEventListener('change', (e) => saveSettings({ autoCapture: e.target.checked }))
  const { recent = [] } = await chrome.storage.local.get('recent')
  renderRecent(recent)

  const job = await extractFromTab(tab)
  if (!job || !job.role || !job.company) {
    $('no-job').hidden = false
    return
  }
  renderJob(job)

  $('save').addEventListener('click', async () => {
    const button = $('save')
    const status = $('save-status')
    button.disabled = true
    button.textContent = 'Saving…'
    status.className = 'status'
    status.textContent = ''
    const result = await chrome.runtime.sendMessage({ type: 'capture', job })
    if (result && result.ok) {
      button.textContent = result.created ? 'Saved ✓' : 'Already saved ✓'
      status.className = 'status ok'
      status.textContent = result.contactsAdded
        ? `Added to your board with ${result.contactsAdded} new contact${result.contactsAdded === 1 ? '' : 's'}.`
        : 'Added to your board.'
      const { recent: updated = [] } = await chrome.storage.local.get('recent')
      renderRecent(updated)
    } else {
      button.disabled = false
      button.textContent = 'Save as applied'
      status.className = 'status error'
      status.textContent =
        result && result.error === 'unauthorized'
          ? 'Your access token was rejected. Reconnect in Settings.'
          : "Couldn't reach OfferFlow. Check your connection and try again."
    }
  })
}

init()
