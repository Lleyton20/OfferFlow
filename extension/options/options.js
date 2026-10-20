const { DEFAULTS, getSettings, saveSettings, trimUrl } = globalThis.OfferFlowSettings

const $ = (id) => document.getElementById(id)

function setStatus(message, tone) {
  const status = $('status')
  status.className = `status${tone ? ` ${tone}` : ''}`
  status.textContent = message
}

function updateSettingsLink(appUrl) {
  $('settings-link').href = `${trimUrl(appUrl)}/settings`
}

/** Custom API hosts outside the built-in host permissions need the user's consent. */
async function ensureHostPermission(apiUrl) {
  const origin = `${new URL(apiUrl).origin}/*`
  if (await chrome.permissions.contains({ origins: [origin] })) return true
  return chrome.permissions.request({ origins: [origin] })
}

async function testConnection(apiUrl, token) {
  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)
  if (!response) return { ok: false, message: "Couldn't reach the API. Check the API URL (a sleeping server can take a minute to wake)." }
  if (response.status === 401) return { ok: false, message: 'That token was rejected. Create a new one in OfferFlow settings.' }
  if (!response.ok) return { ok: false, message: `The API responded with an error (${response.status}).` }
  const user = await response.json()
  return { ok: true, message: `Connected as ${user.full_name || user.email}.` }
}

async function init() {
  const settings = await getSettings()
  $('token').value = settings.token
  $('api-url').value = settings.apiUrl
  $('app-url').value = settings.appUrl
  updateSettingsLink(settings.appUrl)
  $('app-url').addEventListener('input', (e) => updateSettingsLink(e.target.value || DEFAULTS.appUrl))
  if (settings.token) setStatus('Connected. Saving again re-tests the connection.', 'ok')

  $('form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const token = $('token').value.trim()
    const apiUrl = trimUrl($('api-url').value)
    const appUrl = trimUrl($('app-url').value)

    if (!(await ensureHostPermission(apiUrl))) {
      setStatus('OfferFlow needs permission to reach that API URL.', 'error')
      return
    }
    setStatus('Testing connection…')
    const result = await testConnection(apiUrl, token)
    if (!result.ok) {
      setStatus(result.message, 'error')
      return
    }
    await saveSettings({ token, apiUrl, appUrl })
    setStatus(result.message, 'ok')
  })

  $('disconnect').addEventListener('click', async () => {
    await saveSettings({ token: '' })
    $('token').value = ''
    setStatus('Disconnected. Captures are paused until you connect again.')
  })
}

init()
