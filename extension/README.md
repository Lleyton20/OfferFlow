# OfferFlow browser extension

Saves applications to OfferFlow the moment you submit them: role, company,
location, the full job description, and any recruiters or hiring managers the
posting lists.

Works in Chrome, Edge, Brave, Arc and other Chromium browsers, and in Firefox 121+.

## Install

Until it's published to the browser stores, load it directly from this folder:

**Chrome, Edge, Brave, Arc**

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose this `extension/` folder.

**Firefox**

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and choose `extension/manifest.json`.

The settings page opens on install. In OfferFlow, go to **Settings → Browser
extension**, create an access token, and paste it in.

## How capture works

1. **Reading the job.** On job pages the extension reads the posting's
   [schema.org JobPosting](https://schema.org/JobPosting) data, which most
   employers publish for Google Jobs. It falls back to page structure on
   Greenhouse, Lever, Ashby, Workday, LinkedIn, Indeed and SmartRecruiters, and
   to page metadata anywhere else.
2. **Knowing you applied.** It only saves when both happen in the same tab: you
   click a submit or apply control, and the page then shows an
   application-submitted confirmation ("Thank you for applying", "Your
   application was sent", …). Browsing a posting never saves anything.
3. **Saving.** The background worker posts to `POST /capture` with your access
   token. The API de-duplicates by job URL (ignoring tracking parameters) and by
   company and role, so applying twice or reloading the confirmation page won't
   create a second card. Contacts are added to your CRM and linked to the role.

You can also save any job by hand from the toolbar popup, and switch automatic
capture off there.

## Privacy

- The content script stays dormant on pages that aren't job-related, and never
  reads form fields you type into.
- Data goes only to the OfferFlow API you configure. Nothing is sent anywhere else.
- The access token is stored in the browser's extension storage and can be
  revoked at any time from OfferFlow settings.

## Development

```bash
npm install
npm test               # unit tests for the page extractor (Vitest + jsdom)
npm run package        # dist/offerflow-extension-<version>.zip for the stores
```

For local development, open the extension settings, expand **Advanced**, and set
the API URL to `http://localhost:8000` and the app URL to `http://localhost:5173`.
