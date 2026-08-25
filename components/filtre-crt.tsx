"use client"

import { useEffect, useState } from "react"

/* LE FILTRE CRT GLOBAL — ticket #33, 14e retour de gate (« plus intense
   et sur l'ensemble du site, scènes 3D comprises ») : la surcouche vivait
   dans la scène GT86 — elle monte au layout RACINE, par-dessus toutes les
   routes et le canvas 3D (position fixed, zIndex au plafond). Gradients
   statiques composés par le GPU : zéro animation, le 100 fps tient.

   L'état vit dans localStorage (`gt86-crt`) ; la scène (badge global +
   bouton CRT peint du bandeau AMP) le bascule par l'événement `gt86-crt`.
   Rendu initial null : SSR-sûr, l'hydratation lit le stockage. */
export default function FiltreCrt() {
  const [actif, setActif] = useState(false)
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).has("crt")) {
        setActif(true)
        localStorage.setItem("gt86-crt", "1")
      } else {
        setActif(localStorage.getItem("gt86-crt") === "1")
      }
    } catch {
      /* stockage indisponible : le filtre reste éteint */
    }
    const surBascule = (e: Event) => setActif(Boolean((e as CustomEvent).detail))
    window.addEventListener("gt86-crt", surBascule)
    return () => window.removeEventListener("gt86-crt", surBascule)
  }, [])
  if (!actif) return null
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        backgroundImage: [
          /* la grille de sous-pixels RVB */
          "repeating-linear-gradient(90deg, rgba(255,60,90,0.13) 0px, rgba(255,60,90,0.13) 1px, rgba(60,255,140,0.10) 1px, rgba(60,255,140,0.10) 2px, rgba(80,120,255,0.13) 2px, rgba(80,120,255,0.13) 3px)",
          /* les lignes de balayage */
          "repeating-linear-gradient(0deg, rgba(6,4,12,0.34) 0px, rgba(6,4,12,0.34) 1px, transparent 1px, transparent 3px)",
          /* l'interférence diagonale — le moiré de la photo d'écran */
          "repeating-linear-gradient(55deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)",
          /* la vignette du tube */
          "radial-gradient(ellipse at center, transparent 52%, rgba(6,4,12,0.5) 100%)",
        ].join(", "),
      }}
    />
  )
}
