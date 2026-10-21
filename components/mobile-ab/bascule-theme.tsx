"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "reicon-react"
import s from "./ab.module.css"

const CLE_THEME = "theme"
const CLASSE_CLAIR = "clair"

/* Le thème réutilise celui du site : la classe `clair` sur <html>,
   posée avant la première peinture par le script de app/layout.tsx,
   et le même choix mémorisé ("clair" | "sombre"). Tant que la main
   n'a rien choisi, l'OS décide, même en cours de session.
   ?theme=light|dark force un thème sans le mémoriser (captures). */
export function BasculeTheme() {
  const [clair, setClair] = useState<boolean | null>(null)

  useEffect(() => {
    const force = new URLSearchParams(location.search).get("theme")
    if (force === "light" || force === "dark") poserClair(force === "light")
    poserClair(estClair())
    setClair(estClair())

    const os = matchMedia("(prefers-color-scheme: light)")
    const suivreOs = (e: MediaQueryListEvent) => {
      if (lireChoix()) return
      poserClair(e.matches)
      setClair(e.matches)
    }
    os.addEventListener("change", suivreOs)
    return () => os.removeEventListener("change", suivreOs)
  }, [])

  const basculer = () => {
    const suivant = !estClair()
    poserClair(suivant)
    memoriserChoix(suivant)
    setClair(suivant)
  }

  const libelle = clair ? "Passer en mode sombre" : "Passer en mode clair"
  return (
    <button type="button" className={s.bascule} onClick={basculer} aria-label={libelle} title={libelle}>
      {clair ? <Moon size={20} aria-hidden /> : <Sun size={20} aria-hidden />}
    </button>
  )
}

const estClair = () => document.documentElement.classList.contains(CLASSE_CLAIR)
/* le --fond de la palette par défaut (palettes.ts), comme le viewport de app/da/m/ab/page.tsx */
const BARRE_CLAIRE = "#dfe3e8"
const BARRE_SOMBRE = "#0f1114"

/* La barre du navigateur suit le thème choisi, pas celui de l'OS : les
   balises theme-color à media query de Next perdraient sinon contre la bascule. */
function poserClair(clair: boolean) {
  document.documentElement.classList.toggle(CLASSE_CLAIR, clair)
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = clair ? BARRE_CLAIRE : BARRE_SOMBRE
  })
}

// navigation privée ou stockage bloqué : le choix vaut pour la session, sans plus
function lireChoix() {
  try {
    return localStorage.getItem(CLE_THEME)
  } catch {
    return null
  }
}

function memoriserChoix(clair: boolean) {
  try {
    localStorage.setItem(CLE_THEME, clair ? "clair" : "sombre")
  } catch {
    /* stockage refusé : le thème est déjà posé sur la page, il ne survivra pas au rechargement */
  }
}
