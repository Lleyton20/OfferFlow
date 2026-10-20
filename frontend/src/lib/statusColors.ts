// On the white surface, the five pipeline stages are a neutral ordinal ramp
// (monotone lightness, light → dark as an application progresses), so the only
// saturated colors on a status chart are the two outcomes: Offer uses the brand
// green and Rejected the danger red. Status is always paired with a text label —
// color is never the only signal.
export const STATUS_COLORS: Record<string, string> = {
  Applied: '#c9cdca',
  'Online Assessment': '#a7aca9',
  'Recruiter Screen': '#848a86',
  'Technical Interview': '#5f6562',
  'Final Round': '#3c413e',
  Offer: '#0f7a45',
  Rejected: '#b42318',
}

export const STATUS_COLOR_FALLBACK = '#dfe2df' // custom/free-text statuses
