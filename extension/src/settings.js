/* Shared settings helpers for the background worker, popup and options page. */
;(function (root) {
  'use strict'

  const DEFAULTS = {
    apiUrl: 'https://offerflow-backend-u0eq.onrender.com',
    appUrl: 'https://offerflow-lleyton.vercel.app',
    token: '',
    autoCapture: true,
  }

  async function getSettings() {
    const stored = await chrome.storage.sync.get(Object.keys(DEFAULTS))
    return { ...DEFAULTS, ...stored }
  }

  function saveSettings(changes) {
    return chrome.storage.sync.set(changes)
  }

  function trimUrl(url) {
    return (url || '').trim().replace(/\/+$/, '')
  }

  root.OfferFlowSettings = { DEFAULTS, getSettings, saveSettings, trimUrl }
})(globalThis)
