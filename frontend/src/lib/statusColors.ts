// Validated against the app's dark surface (#05060a) with scripts/validate_palette.js
// from the dataviz skill: the 5 pipeline stages pass --ordinal (monotone lightness,
// all adjacent-step gaps >= 0.06 OKLCH L); Offer/Rejected use the reserved
// good/critical status colors (never repurposed as "series"), always paired with a
// text label on the chart — status color is never the only signal.
export const STATUS_COLORS: Record<string, string> = {
  Applied: '#9ec5f4',
  'Online Assessment': '#6da7ec',
  'Recruiter Screen': '#3987e5',
  'Technical Interview': '#256abf',
  'Final Round': '#184f95',
  Offer: '#0ca30c',
  Rejected: '#d03b3b',
}

export const STATUS_COLOR_FALLBACK = '#64748b' // slate-500, for custom/free-text statuses
