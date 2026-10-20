/* Trait de vitesse effilé sous le nom, comme sur l'écran-titre de l'intro. */
export function TraitVitesse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 300 8" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="da-a-trait" x1="0" x2="1">
          <stop offset="0" stopColor="#8fb0ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9a4dff" />
        </linearGradient>
      </defs>
      <polygon points="0,6 290,0 300,0 288,8 0,8" fill="url(#da-a-trait)" />
    </svg>
  )
}
