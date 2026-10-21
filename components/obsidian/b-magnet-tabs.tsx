"use client"

import { useState, type ReactNode } from "react"
import { motion } from "motion/react"

/* Copie adaptée de ObsidianUI (src/components/block/magnet-tabs.tsx).
   Changements : des <button> plutôt que des <li> cliquables (clavier,
   lecteur d'écran), une icône par onglet, le liseré en rose de la piste
   et des cibles de 56 px pour le pouce. Le principe reste celui
   d'origine : le liseré et le surlignage « aimantés » glissent d'un
   onglet à l'autre par layoutId. */

export type OngletAimante = { id: string; libelle: string; icone: ReactNode }

type Props = {
  slug: string
  options: OngletAimante[]
  actif: string
  choisir: (id: string) => void
}

export function MagnetTabs({ slug, options, actif, choisir }: Props) {
  const [survole, setSurvole] = useState<string | undefined>(undefined)

  return (
    <ul className="flex w-full border border-b-0 border-white/10">
      {options.map((option) => {
        const estActif = actif === option.id
        const estSurligne = survole === option.id || (survole === undefined && estActif)
        return (
          <li key={slug + option.id} className="relative flex-1">
            <button
              type="button"
              onPointerEnter={() => setSurvole(option.id)}
              onPointerLeave={() => setSurvole(undefined)}
              onClick={() => choisir(option.id)}
              aria-current={estActif ? "page" : undefined}
              className={`relative z-10 flex h-[56px] w-full flex-col items-center justify-center gap-[3px] text-[10px] font-semibold uppercase tracking-[0.14em] transition-opacity ${estActif ? "opacity-100" : "opacity-50"}`}
            >
              {option.icone}
              {option.libelle}
            </button>
            {estActif && (
              <motion.div
                layout
                layoutId={slug + "aimant"}
                transition={{ duration: 0.2, type: "spring", bounce: 0.2 }}
                className="absolute bottom-full left-0 h-[3px] w-full rounded-sm bg-[#e561d3] shadow-[0_0_12px_#e561d3]"
              />
            )}
            {estSurligne && (
              <motion.div
                layout
                layoutId={slug + "surlignage"}
                transition={{ duration: 0.2, type: "spring", bounce: 0 }}
                className="absolute bottom-0 left-0 h-full w-full rounded-sm bg-white/10"
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
