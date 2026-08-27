type Pose = 'laptop' | 'walking' | 'celebrating' | 'reading'

interface StudentFigureProps {
  pose: Pose
  skinTone: string
  outfit: string
  className?: string
}

/**
 * A small illustrated figure — not a photo (no legitimate source/consent for
 * real student photos) and not GSU's mascot (that's their trademark). Flat,
 * geometric, deliberately simple rather than photorealistic.
 */
export function StudentFigure({ pose, skinTone, outfit, className }: StudentFigureProps) {
  const body = (() => {
    switch (pose) {
      case 'laptop':
        return (
          <>
            <rect x="34" y="46" width="32" height="34" rx="10" fill={outfit} />
            <rect x="24" y="70" width="52" height="8" rx="4" fill="#1e293b" />
            <rect x="30" y="62" width="40" height="16" rx="3" fill="#0f172a" />
            <circle cx="50" cy="26" r="16" fill={skinTone} />
          </>
        )
      case 'walking':
        return (
          <>
            <rect x="36" y="44" width="28" height="30" rx="9" fill={outfit} />
            <rect x="26" y="72" width="10" height="20" rx="4" fill={outfit} transform="rotate(-12 31 72)" />
            <rect x="64" y="72" width="10" height="20" rx="4" fill={outfit} transform="rotate(14 69 72)" />
            <rect x="20" y="48" width="9" height="22" rx="4" fill={skinTone} transform="rotate(24 24 48)" />
            <rect x="70" y="48" width="9" height="22" rx="4" fill={skinTone} transform="rotate(-20 75 48)" />
            <rect x="30" y="50" width="18" height="14" rx="4" fill="#334155" />
            <circle cx="50" cy="26" r="16" fill={skinTone} />
          </>
        )
      case 'celebrating':
        return (
          <>
            <rect x="35" y="46" width="30" height="32" rx="10" fill={outfit} />
            <rect x="14" y="30" width="10" height="26" rx="5" fill={skinTone} transform="rotate(-28 19 30)" />
            <rect x="76" y="30" width="10" height="26" rx="5" fill={skinTone} transform="rotate(28 81 30)" />
            <rect x="38" y="76" width="10" height="18" rx="4" fill={skinTone} />
            <rect x="52" y="76" width="10" height="18" rx="4" fill={skinTone} />
            <circle cx="50" cy="26" r="16" fill={skinTone} />
          </>
        )
      case 'reading':
      default:
        return (
          <>
            <path d="M30 78 Q50 92 70 78 L70 50 Q50 40 30 50 Z" fill={outfit} />
            <rect x="38" y="54" width="24" height="18" rx="2" fill="#f1f5f9" />
            <rect x="49" y="54" width="2" height="18" fill="#cbd5e1" />
            <circle cx="50" cy="26" r="16" fill={skinTone} />
          </>
        )
    }
  })()

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {body}
    </svg>
  )
}
