// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import extract from '../src/extract.js'

const { extractJob, looksLikeConfirmation, isSubmitControl, sourceFor } = extract

function page(html, head = '') {
  return new DOMParser().parseFromString(`<html><head>${head}</head><body>${html}</body></html>`, 'text/html')
}

function ld(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

describe('extractJob', () => {
  it('prefers schema.org JobPosting data', () => {
    const doc = page(
      '<h1>Ignored heading</h1>',
      ld({
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: 'Software Engineer Intern',
        hiringOrganization: { '@type': 'Organization', name: 'Stripe' },
        description: '<p>Build payments.</p><ul><li>Python</li><li>Go</li></ul>',
        jobLocation: [{ address: { addressLocality: 'San Francisco', addressRegion: 'CA' } }],
      }),
    )
    const job = extractJob(doc, 'https://stripe.com/jobs/listing/swe-intern/123?src=li#apply')
    expect(job).toMatchObject({
      role: 'Software Engineer Intern',
      company: 'Stripe',
      location: 'San Francisco, CA',
      job_url: 'https://stripe.com/jobs/listing/swe-intern/123?src=li',
      source: 'web',
      confidence: 'high',
    })
    expect(job.description).toBe('Build payments.\n• Python\n• Go')
  })

  it('finds a JobPosting nested in an @graph and decodes double-escaped HTML', () => {
    const doc = page(
      '',
      ld({
        '@graph': [
          { '@type': 'WebPage' },
          { '@type': 'JobPosting', title: 'Data Intern', hiringOrganization: 'Ramp', description: '&lt;p&gt;SQL &amp;amp; Python&lt;/p&gt;', jobLocationType: 'TELECOMMUTE' },
        ],
      }),
    )
    const job = extractJob(doc, 'https://ramp.com/careers/1')
    expect(job.company).toBe('Ramp')
    expect(job.location).toBe('Remote')
    expect(job.description).toBe('SQL & Python')
  })

  it('reads Greenhouse job boards', () => {
    const doc = page(`
      <div class="job__title"><h1>Product Design Intern</h1></div>
      <div class="job__location">New York, NY</div>
      <div class="job__description"><p>Design the future of collaborative tools for millions of people.</p></div>`)
    const job = extractJob(doc, 'https://job-boards.greenhouse.io/figma/jobs/5551234')
    expect(job).toMatchObject({ role: 'Product Design Intern', company: 'Figma', location: 'New York, NY', source: 'greenhouse', confidence: 'high' })
  })

  it('reads the company from an embedded Greenhouse application form', () => {
    const doc = page('<div id="header"><h1 class="app-title">Backend Intern</h1><div class="company-name">at Duolingo</div></div>')
    const job = extractJob(doc, 'https://boards.greenhouse.io/embed/job_app?for=duolingo&token=42')
    expect(job.company).toBe('Duolingo')
    expect(job.role).toBe('Backend Intern')
  })

  it('reads Lever postings', () => {
    const doc = page(`
      <div class="main-header-logo"><img alt="Palantir"></div>
      <div class="posting-headline"><h2>Forward Deployed Engineer, Internship</h2>
        <div class="posting-categories"><div class="location">Denver, CO</div></div></div>
      <div data-qa="job-description"><p>Work with customers on hard problems across industries and sectors.</p></div>`)
    const job = extractJob(doc, 'https://jobs.lever.co/palantir/abc-123')
    expect(job).toMatchObject({ role: 'Forward Deployed Engineer, Internship', company: 'Palantir', location: 'Denver, CO', source: 'lever' })
  })

  it('reads LinkedIn job views and the hiring team', () => {
    const doc = page(`
      <h1 class="job-details-jobs-unified-top-card__job-title">Software Engineer, New Grad</h1>
      <div class="job-details-jobs-unified-top-card__company-name"><a>Datadog</a></div>
      <div id="job-details"><p>Join our observability platform team building systems at massive scale.</p></div>
      <div class="hirer-card__hirer-information">
        <a href="https://www.linkedin.com/in/jordan-lee-123?trk=x"><strong>Jordan Lee</strong></a>
        <div class="hirer-card__hirer-job-title">Technical Recruiter at Datadog</div>
      </div>`)
    const job = extractJob(doc, 'https://www.linkedin.com/jobs/view/4012345678/')
    expect(job).toMatchObject({ role: 'Software Engineer, New Grad', company: 'Datadog', source: 'linkedin' })
    expect(job.contacts).toEqual([
      { name: 'Jordan Lee', title: 'Technical Recruiter at Datadog', profile_url: 'https://www.linkedin.com/in/jordan-lee-123', email: null },
    ])
  })

  it('picks up recruiters named in the description, but not generic inboxes', () => {
    const doc = page(
      `<a href="mailto:careers@acme.com">careers@acme.com</a>
       <a href="mailto:sam.park@acme.com">Sam Park</a>`,
      ld({ '@type': 'JobPosting', title: 'Analyst Intern', hiringOrganization: { name: 'Acme' }, description: '<p>Recruiter: Alex Morgan</p>' }),
    )
    const names = extractJob(doc, 'https://acme.com/jobs/1').contacts.map((c) => c.name)
    expect(names).toEqual(['Alex Morgan', 'Sam Park'])
  })

  it('falls back to page metadata with low confidence', () => {
    const doc = page('', '<title>Marketing Intern at Notion | Careers</title>')
    const job = extractJob(doc, 'https://notion.so/careers/marketing-intern')
    expect(job).toMatchObject({ role: 'Marketing Intern', company: 'Notion', confidence: 'low' })
  })

  it('reports no job on ordinary pages', () => {
    const doc = page('<p>Hello</p>', '<title>Weather</title>')
    expect(extractJob(doc, 'https://weather.example/').confidence).toBe('none')
  })
})

describe('looksLikeConfirmation', () => {
  it.each([
    'Thank you for applying to Stripe!',
    'Thanks for your application. We will be in touch.',
    'Your application was sent to Datadog',
    'Application submitted',
    "We've received your application for Software Engineer Intern",
    'Your application has been successfully submitted.',
  ])('recognizes "%s"', (text) => {
    expect(looksLikeConfirmation(text)).toBe(true)
  })

  it.each(['Apply for this job', 'Submit your application below', 'Application deadline: Nov 1'])(
    'ignores "%s"',
    (text) => {
      expect(looksLikeConfirmation(text)).toBe(false)
    },
  )
})

describe('isSubmitControl', () => {
  it('matches submit and apply buttons, including their children', () => {
    const doc = page(`
      <button id="a"><span id="inner">Submit application</span></button>
      <input id="b" type="submit" value="Apply">
      <button id="c">Save draft</button>
      <a id="d">Read our very long policy about how we apply data retention rules</a>`)
    expect(isSubmitControl(doc.getElementById('inner'))).toBe(true)
    expect(isSubmitControl(doc.getElementById('b'))).toBe(true)
    expect(isSubmitControl(doc.getElementById('c'))).toBe(false)
    expect(isSubmitControl(doc.getElementById('d'))).toBe(false)
  })
})

describe('sourceFor', () => {
  it('maps hosts to platforms', () => {
    expect(sourceFor('boards.greenhouse.io')).toBe('greenhouse')
    expect(sourceFor('acme.wd5.myworkdayjobs.com')).toBe('workday')
    expect(sourceFor('jobs.ashbyhq.com')).toBe('ashby')
    expect(sourceFor('example.com')).toBe('web')
  })
})
