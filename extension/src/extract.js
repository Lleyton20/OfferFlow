/*
 * Pulls a job posting out of the current page.
 *
 * Order of preference: schema.org JobPosting JSON-LD (most employers publish it so
 * Google Jobs can index them), then selectors for the big application platforms,
 * then generic page metadata. Pure DOM in, plain object out — no extension APIs —
 * so it runs the same in a content script and in unit tests.
 */
;(function (root) {
  'use strict'

  const DESCRIPTION_LIMIT = 50000

  const CONFIRMATION_PATTERN = new RegExp(
    [
      "thank(s| you) for (applying|your application|submitting)",
      'application (has been |was )?(successfully )?(submitted|received|sent|completed?)',
      "we('ve| have) received your application",
      'your application (has been|was) (successfully )?(submitted|sent|received)',
      'successfully (applied|submitted)',
      'your application was sent',
    ].join('|'),
    'i',
  )

  const SUBMIT_PATTERN = /\b(submit( application)?|send application|apply( now)?|complete application|finish)\b/i

  const PLATFORMS = [
    { source: 'greenhouse', test: (host) => host.endsWith('greenhouse.io') },
    { source: 'lever', test: (host) => host.endsWith('lever.co') },
    { source: 'ashby', test: (host) => host.endsWith('ashbyhq.com') },
    { source: 'workday', test: (host) => host.includes('myworkdayjobs.com') || host.includes('workday.com') },
    { source: 'linkedin', test: (host) => host.endsWith('linkedin.com') },
    { source: 'indeed', test: (host) => host.endsWith('indeed.com') },
    { source: 'smartrecruiters', test: (host) => host.endsWith('smartrecruiters.com') },
    { source: 'handshake', test: (host) => host.endsWith('joinhandshake.com') },
  ]

  function clean(text) {
    return (text || '').replace(/\s+/g, ' ').trim()
  }

  // DOMParser builds an inert document: unlike innerHTML on a live element, nothing in
  // the markup loads or runs.
  function parseHtml(html) {
    return new DOMParser().parseFromString(html, 'text/html').body
  }

  function htmlToText(html) {
    if (!html) return ''
    let body = parseHtml(html)
    // Some JSON-LD descriptions are double-escaped: the first parse yields markup as text.
    if (/<[a-z][\s\S]*>/i.test(body.textContent || '')) body = parseHtml(body.textContent)
    return blockText(body)
  }

  /** Text with paragraph and list breaks preserved, so descriptions stay readable. */
  function blockText(element) {
    const clone = element.cloneNode(true)
    clone.querySelectorAll('script, style, noscript, svg, button').forEach((n) => n.remove())
    clone.querySelectorAll('br').forEach((n) => n.replaceWith('\n'))
    clone.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, section, ul, ol').forEach((n) => {
      n.append('\n')
    })
    clone.querySelectorAll('li').forEach((n) => n.prepend('• '))
    return (clone.textContent || '')
      .split('\n')
      .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .slice(0, DESCRIPTION_LIMIT)
  }

  function text(doc, selectors) {
    for (const selector of selectors) {
      const node = doc.querySelector(selector)
      const value = node && clean(node.textContent)
      if (value) return value
    }
    return ''
  }

  function block(doc, selectors) {
    for (const selector of selectors) {
      const node = doc.querySelector(selector)
      if (node) {
        const value = blockText(node)
        if (value.length > 40) return value
      }
    }
    return ''
  }

  function meta(doc, name) {
    const node = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`)
    return clean(node && node.getAttribute('content'))
  }

  function titleCase(slug) {
    return clean(
      decodeURIComponent(slug || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    )
  }

  function sourceFor(host) {
    const platform = PLATFORMS.find((p) => p.test(host))
    return platform ? platform.source : 'web'
  }

  // --- JSON-LD ------------------------------------------------------------------

  function findJobPosting(node) {
    if (!node || typeof node !== 'object') return null
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = findJobPosting(item)
        if (found) return found
      }
      return null
    }
    const type = node['@type']
    if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return node
    return findJobPosting(node['@graph'])
  }

  function locationFromLd(posting) {
    const places = [].concat(posting.jobLocation || [])
    const names = places
      .map((place) => {
        const address = (place && place.address) || {}
        if (typeof address === 'string') return address
        return [address.addressLocality, address.addressRegion].filter(Boolean).join(', ')
      })
      .filter(Boolean)
    if (names.length) return names.slice(0, 3).join(' · ')
    if (posting.jobLocationType === 'TELECOMMUTE') return 'Remote'
    return ''
  }

  function fromJsonLd(doc) {
    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
      let data
      try {
        data = JSON.parse(script.textContent || '')
      } catch {
        continue
      }
      const posting = findJobPosting(data)
      if (!posting) continue
      const org = posting.hiringOrganization
      return {
        role: clean(posting.title),
        company: clean(typeof org === 'string' ? org : org && org.name),
        description: htmlToText(posting.description),
        location: locationFromLd(posting),
      }
    }
    return null
  }

  // --- Platform selectors ---------------------------------------------------------

  function pathSegment(url, index) {
    return url.pathname.split('/').filter(Boolean)[index] || ''
  }

  const SITE_EXTRACTORS = {
    greenhouse(doc, url) {
      const embedFor = url.searchParams.get('for')
      return {
        role: text(doc, ['.job__title h1', 'h1.app-title', '#header .app-title', 'h1']),
        company:
          text(doc, ['.company-name']).replace(/^at\s+/i, '') ||
          titleCase(embedFor || pathSegment(url, 0)),
        description: block(doc, ['.job__description', '#content', '.job-post-content']),
        location: text(doc, ['.job__location', '#header .location', '.location']),
      }
    },
    lever(doc, url) {
      return {
        role: text(doc, ['.posting-headline h2', '.posting-header h2', 'h2']),
        company:
          clean(doc.querySelector('.main-header-logo img')?.getAttribute('alt')) ||
          titleCase(pathSegment(url, 0)),
        description: block(doc, ['[data-qa="job-description"]', '.posting-page .content', '.section-wrapper.page-full-width']),
        location: text(doc, ['.posting-categories .location', '.sort-by-location', '.location']),
      }
    },
    ashby(doc, url) {
      return {
        role: text(doc, ['h1[class*="title"]', 'h1']),
        company: meta(doc, 'og:site_name') || titleCase(pathSegment(url, 0)),
        description: block(doc, ['[class*="descriptionText"]', '[class*="_description_"]', 'main']),
        location: text(doc, ['[class*="location"] p', '[class*="Location"]']),
      }
    },
    workday(doc, url) {
      return {
        role: text(doc, ['[data-automation-id="jobPostingHeader"]', 'h2[data-automation-id]', 'h1']),
        company: meta(doc, 'og:site_name') || titleCase(url.hostname.split('.')[0]),
        description: block(doc, ['[data-automation-id="jobPostingDescription"]']),
        location: text(doc, ['[data-automation-id="locations"] dd', '[data-automation-id="locations"]']),
      }
    },
    linkedin(doc) {
      return {
        role: text(doc, [
          '.job-details-jobs-unified-top-card__job-title',
          '.jobs-unified-top-card__job-title',
          '.top-card-layout__title',
          'h1',
        ]),
        company: text(doc, [
          '.job-details-jobs-unified-top-card__company-name',
          '.jobs-unified-top-card__company-name',
          '.topcard__org-name-link',
        ]),
        description: block(doc, ['#job-details', '.jobs-description__content', '.description__text']),
        location: text(doc, [
          '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
          '.jobs-unified-top-card__bullet',
          '.topcard__flavor--bullet',
        ]),
      }
    },
    indeed(doc) {
      return {
        role: text(doc, ['[data-testid="jobsearch-JobInfoHeader-title"]', 'h1']).replace(/\s*-\s*job post$/i, ''),
        company: text(doc, ['[data-testid="inlineHeader-companyName"]', '[data-company-name]']),
        description: block(doc, ['#jobDescriptionText']),
        location: text(doc, ['[data-testid="inlineHeader-companyLocation"]', '[data-testid="job-location"]']),
      }
    },
    smartrecruiters(doc) {
      return {
        role: text(doc, ['h1.job-title', 'h1']),
        company: text(doc, ['[itemprop="hiringOrganization"] [itemprop="name"]', '.company-name']),
        description: block(doc, ['[itemprop="description"]', '.job-sections']),
        location: text(doc, ['[itemprop="jobLocation"]', '.job-location']),
      }
    },
  }

  // --- Generic fallback ----------------------------------------------------------

  function fromMetadata(doc) {
    const title = meta(doc, 'og:title') || clean(doc.title)
    // Common title shapes: "Role at Company", "Role - Company", "Company | Role".
    let role = title
    let company = meta(doc, 'og:site_name')
    const at = title.match(/^(.+?)\s+at\s+(.+?)(\s*[|–—-].*)?$/i)
    if (at) {
      role = at[1]
      company = company || at[2]
    } else {
      const parts = title.split(/\s+[|–—-]\s+/)
      if (parts.length >= 2) {
        role = parts[0]
        company = company || parts[1]
      }
    }
    return { role: clean(role), company: clean(company), description: '', location: '' }
  }

  // --- Contacts ------------------------------------------------------------------

  function contactsFrom(doc, description) {
    const contacts = []
    const seen = new Set()
    function add(contact) {
      const key = contact.name.toLowerCase()
      if (!contact.name || seen.has(key) || contacts.length >= 5) return
      seen.add(key)
      contacts.push(contact)
    }

    // LinkedIn's "Meet the hiring team".
    doc.querySelectorAll('.hirer-card__hirer-information, .jobs-poster__container').forEach((card) => {
      const name = clean(card.querySelector('strong, .jobs-poster__name, .hirer-card__hirer-name')?.textContent)
      const title = clean(card.querySelector('.hirer-card__hirer-job-title, .jobs-poster__headline, .text-body-small')?.textContent)
      const link = card.querySelector('a[href*="/in/"]') || card.closest('a[href*="/in/"]')
      if (name) add({ name, title: title || null, profile_url: link ? link.href.split('?')[0] : null, email: null })
    })

    // Recruiters named in the posting itself: "Recruiter: Jane Doe" or a mailto link.
    const named = description.match(/\b(?:[Rr]ecruiter|[Hh]iring [Mm]anager|[Cc]ontact)\s*[:\-–]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z'-]+){1,2})/)
    if (named) add({ name: named[1], title: /hiring manager/i.test(named[0]) ? 'Hiring Manager' : 'Recruiter', profile_url: null, email: null })

    doc.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      const email = link.getAttribute('href').slice(7).split('?')[0]
      const label = clean(link.textContent)
      if (/^(jobs|careers|recruiting|talent|hr|privacy|accommodations?|support|info)@/i.test(email)) return
      const name = label && !label.includes('@') ? label : ''
      if (name) add({ name, title: 'Recruiter', profile_url: null, email })
    })
    return contacts
  }

  // --- Public API ----------------------------------------------------------------

  function extractJob(doc, href) {
    const url = new URL(href)
    const source = sourceFor(url.hostname)
    const ld = fromJsonLd(doc)
    const site = SITE_EXTRACTORS[source] ? SITE_EXTRACTORS[source](doc, url) : null
    const fallback = fromMetadata(doc)

    const pick = (field) => (ld && ld[field]) || (site && site[field]) || fallback[field] || ''
    const job = {
      role: pick('role').slice(0, 300),
      company: pick('company').replace(/^at\s+/i, '').slice(0, 200),
      description: (ld && ld.description) || (site && site.description) || '',
      location: pick('location').slice(0, 300),
      job_url: href.split('#')[0],
      source,
    }
    job.contacts = contactsFrom(doc, job.description)

    // A page is only a job page if we found real structure, not just a <title>.
    const structured = Boolean(ld || (site && site.role && site.company))
    job.confidence = structured ? 'high' : job.role && job.company ? 'low' : 'none'
    return job
  }

  function looksLikeConfirmation(pageText) {
    return CONFIRMATION_PATTERN.test(pageText || '')
  }

  function isSubmitControl(element) {
    if (!element || !element.closest) return false
    const control = element.closest('button, input[type="submit"], [role="button"], a')
    if (!control) return false
    const label = clean(control.textContent || control.value || control.getAttribute('aria-label') || '')
    return label.length <= 40 && SUBMIT_PATTERN.test(label)
  }

  const api = { extractJob, looksLikeConfirmation, isSubmitControl, sourceFor }
  root.OfferFlowExtract = api
  if (typeof module === 'object' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this)
