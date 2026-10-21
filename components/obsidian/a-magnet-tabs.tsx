"use client"

import { useState } from "react"
import { motion } from "motion/react"

/* Copie de ObsidianUI (src/components/block/magnet-tabs.tsx), piste A.
   Adaptée au pouce : boutons de 44 px, liseré rose au lieu du bleu,
   onglets étirés sur toute la largeur. */

type MagnetTabsProps = {
  slug: string
  options: string[]
  actif: string
  choisir: (option: string) => void
}

export function MagnetTabs({ slug, options, actif, choisir }: MagnetTabsProps) {
  const [survole, setSurvole] = useState<string | undefined>(undefined)

  return (
    <ul className="flex w-full rounded-[18px] border border-white/10 bg-white/[0.04] p-[4px]" role="tablist">
      {options.map((option) => {
        const estActif = actif === option
        return (
          <li key={slug + option} className="relative flex-1" onMouseEnter={() => setSurvole(option)} onMouseLeave={() => setSurvole(undefined)}>
            <button
              role="tab"
              aria-selected={estActif}
              onClick={() => choisir(option)}
              className={`relative z-10 h-[44px] w-full text-[14px] font-semibold tracking-wide transition-opacity ${estActif ? "opacity-100" : "opacity-50"}`}
            >
              {option}
            </button>
            {estActif && (
              <motion.div
                layoutId={slug + "aimant"}
                transition={{ duration: 0.2, type: "spring", bounce: 0.2 }}
                className="absolute bottom-0 left-1/2 h-[3px] w-[32px] -translate-x-1/2 rounded-full bg-[#e561d3] shadow-[0_0_12px_#e561d3]"
              />
            )}
            {(survole === option || (survole === undefined && estActif)) && (
              <motion.div
                layoutId={slug + "surbrillance"}
                transition={{ duration: 0.2, type: "spring", bounce: 0 }}
                className="absolute inset-0 rounded-[14px] bg-white/10"
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
