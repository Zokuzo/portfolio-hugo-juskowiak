"use client"

import { useState, type ReactNode } from "react"
import { Next, Pause, Play } from "reicon-react"

/* Copie de ObsidianUI (src/components/block/skeumorphic-music-card.tsx),
   piste A. Repeinte pour la nuit (le relief vient d'ombres violettes au
   lieu du bleu ciel), icônes Reicon au lieu de lucide, jaquette en CSS
   au lieu de next/image. La pression des boutons passe par :active,
   les quatre états React de l'original ne servaient qu'à ça. */

type MusicCardProps = {
  titre: string
  artiste: string
  jaquette: ReactNode
  enLecture: boolean
  basculer: () => void
}

export function MusicCard({ titre, artiste, jaquette, enLecture, basculer }: MusicCardProps) {
  return (
    <div
      className="rounded-[28px] border border-white/5 p-[12px]"
      style={{ background: "linear-gradient(135deg, #1a1530 0%, #0d0a1a 100%)", boxShadow: "inset -6px -6px 14px rgba(255,255,255,0.03), inset 6px 6px 14px rgba(0,0,0,0.5)" }}
    >
      <div
        className="flex items-center gap-[14px] rounded-[20px] border border-white/5 p-[12px]"
        style={{ background: "linear-gradient(135deg, #221b3d 0%, #151026 100%)", boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.06), 4px 4px 14px rgba(0,0,0,0.4)" }}
      >
        <div className="w-[64px] h-[64px] shrink-0 overflow-hidden rounded-[14px] bg-[#151026]" style={{ boxShadow: "-2px -2px 5px rgba(255,255,255,0.04), 4px 4px 12px rgba(0,0,0,0.5)" }}>
          {jaquette}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-white">{titre}</p>
          <p className="truncate text-[13px] text-white/55">{artiste}</p>
          <BarreProgression enLecture={enLecture} />
        </div>
        <div className="flex items-center gap-[4px]">
          <BoutonRelief etiquette={enLecture ? "Pause" : "Lecture"} surClic={basculer} grand>
            {enLecture ? <Pause size={20} weight="Filled" /> : <Play size={20} weight="Filled" />}
          </BoutonRelief>
          <BoutonRelief etiquette="Suivant"><Next size={18} weight="Filled" /></BoutonRelief>
        </div>
      </div>
    </div>
  )
}

function BarreProgression({ enLecture }: { enLecture: boolean }) {
  return (
    <div className="mt-[8px] h-[6px] overflow-hidden rounded-full" style={{ background: "#0b0816", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.6)" }}>
      <div
        className="h-full rounded-full transition-[width] duration-[8000ms] ease-linear"
        style={{ width: enLecture ? "92%" : "35%", background: "linear-gradient(90deg, #8b5cf6, #e561d3)" }}
      />
    </div>
  )
}

function BoutonRelief({ etiquette, surClic, grand, children }: { etiquette: string; surClic?: () => void; grand?: boolean; children: ReactNode }) {
  return (
    <button
      aria-label={etiquette}
      onClick={surClic}
      className={`grid place-items-center rounded-full text-white/85 transition-transform active:scale-95 ${grand ? "w-[48px] h-[48px]" : "w-[44px] h-[44px]"}`}
      style={{ background: "linear-gradient(135deg, #2a2248 0%, #1a1430 100%)", boxShadow: "-2px -2px 6px rgba(255,255,255,0.04), 3px 3px 8px rgba(0,0,0,0.55)" }}
    >
      {children}
    </button>
  )
}
