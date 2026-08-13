"use client"

import { useEffect } from "react"

/* La barre flottante du prototype : flèches + ← → clavier, l'URL porte la
   variante (?variant=). Volontairement étrangère au design jugé. Pas de
   garde NODE_ENV : la route entière est jetable et Hugo juge sur la
   preview Vercel (build de production). */

export const VARIANTES = [
  { cle: "a", nom: "Aplat", detail: "dégradé shader + billboards", poids: "+0 ko d'asset ciel" },
  { cle: "b", nom: "Pellicule", detail: "HDRI de crépuscule", poids: "+1,2 Mo (HDR)" },
  { cle: "c", nom: "Mer de nuages", detail: "volumétrique léger", poids: "+0 ko, GPU plus sollicité" },
] as const

export default function Switcher({
  courante,
  choisir,
}: {
  courante: string
  choisir: (c: string) => void
}) {
  const i = Math.max(0, VARIANTES.findIndex((v) => v.cle === courante))
  const v = VARIANTES[i]
  const aller = (delta: number) =>
    choisir(VARIANTES[(i + delta + VARIANTES.length) % VARIANTES.length].cle)

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null
      if (cible?.closest("input, textarea, [contenteditable]")) return
      if (e.key === "ArrowLeft") aller(-1)
      if (e.key === "ArrowRight") aller(1)
    }
    window.addEventListener("keydown", surTouche)
    return () => window.removeEventListener("keydown", surTouche)
  })

  const bouton: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "inherit",
    font: "inherit",
    fontSize: 16,
    lineHeight: 1,
    padding: "6px 10px",
    cursor: "pointer",
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "8px 10px",
        borderRadius: 999,
        background: "rgba(12, 9, 24, 0.78)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        backdropFilter: "blur(10px)",
        color: "#f2ecff",
        fontFamily: "var(--f-mono)",
        fontSize: 12,
        whiteSpace: "nowrap",
        zIndex: 10,
      }}
    >
      <button type="button" style={bouton} onClick={() => aller(-1)} aria-label="variante précédente">
        ‹
      </button>
      <span style={{ minWidth: 340, textAlign: "center" }}>
        <strong>{v.cle.toUpperCase()} — {v.nom}</strong>
        <span style={{ opacity: 0.65 }}> · {v.detail} · {v.poids}</span>
      </span>
      <button type="button" style={bouton} onClick={() => aller(1)} aria-label="variante suivante">
        ›
      </button>
    </div>
  )
}
