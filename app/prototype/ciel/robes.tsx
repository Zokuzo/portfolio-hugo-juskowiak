"use client"

import { ROBES } from "./voiture"

/* La rangée de pastilles des robes — en bas à gauche, à l'écart de la
   barre des variantes. L'URL porte le choix (?robe=). */
export default function Robes({
  courante,
  choisir,
}: {
  courante: string
  choisir: (c: string) => void
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 18,
        left: 18,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 12px",
        borderRadius: 999,
        background: "rgba(12, 9, 24, 0.78)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        backdropFilter: "blur(10px)",
        zIndex: 10,
      }}
    >
      {ROBES.map((r) => (
        <button
          key={r.cle}
          type="button"
          title={r.nom}
          aria-label={`robe ${r.nom}`}
          onClick={() => choisir(r.cle)}
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            cursor: "pointer",
            background: r.teinte,
            border:
              courante === r.cle
                ? "2px solid #ffffff"
                : "1px solid rgba(255, 255, 255, 0.35)",
            padding: 0,
          }}
        />
      ))}
    </div>
  )
}
