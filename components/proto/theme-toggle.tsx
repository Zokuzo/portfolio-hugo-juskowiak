"use client"

import { useEffect, useState } from "react"
import { t, type Lang } from "./dict"

/* L'interrupteur de thème (#13) — le jumeau du langtoggle : même
   gabarit, même CSS, deux boutons à état. L'état VIT sur <html>,
   posé avant React par le script anti-FOUC de layout.tsx : ce
   composant le LIT au montage — le serveur ne le connaît pas, d'où
   l'état null avant hydratation, qui rend les deux boutons éteints
   une frame plutôt qu'un mensonge d'hydratation. */
export function ThemeToggle({ lang }: { lang: Lang }) {
  const [clair, setClair] = useState<boolean | null>(null)
  useEffect(() => {
    setClair(document.documentElement.classList.contains("clair"))
    /* Décision (c) : tant que la main n'a pas choisi, l'OS décide —
       Y COMPRIS en cours de session. Dès qu'un choix est mémorisé,
       ce suiveur se tait. */
    const mq = window.matchMedia("(prefers-color-scheme: light)")
    const suit = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem("theme")) return
      } catch {}
      setClair(e.matches)
      document.documentElement.classList.toggle("clair", e.matches)
      window.dispatchEvent(new Event("themechange"))
    }
    mq.addEventListener("change", suit)
    return () => mq.removeEventListener("change", suit)
  }, [])
  const choisit = (v: boolean) => () => {
    /* re-cliquer le thème déjà actif ne fait RIEN : dispatcher quand
       même remonterait la voiture (refenêtrage ~660 Ko) pour un no-op */
    if (v === clair) return
    setClair(v)
    document.documentElement.classList.toggle("clair", v)
    /* localStorage et pas un cookie : le site est statique, seul le
       navigateur du visiteur connaît son choix. */
    try {
      localStorage.setItem("theme", v ? "clair" : "sombre")
    } catch {}
    /* la voiture remonte sa séquence sur cet événement (voiture.tsx) */
    window.dispatchEvent(new Event("themechange"))
  }
  return (
    <div className="langtoggle mono mono-sm" role="group" aria-label={t(lang, "themeLabel")}>
      <button type="button" data-on={clair === false} onClick={choisit(false)} aria-pressed={clair === false}>
        {t(lang, "themeSombre")}
      </button>
      <button type="button" data-on={clair === true} onClick={choisit(true)} aria-pressed={clair === true}>
        {t(lang, "themeClair")}
      </button>
    </div>
  )
}
