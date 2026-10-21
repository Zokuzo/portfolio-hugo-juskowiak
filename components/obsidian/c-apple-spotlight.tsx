"use client"

import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronRight, SearchNormal } from "reicon-react"
import { cn } from "@/lib/utils"

/* Copié d'ObsidianUI (src/components/block/apple-spotlight.tsx), piste C.
   Ce qui change :
   - les icônes lucide-react (absent du dépôt) deviennent des Reicon ;
   - les raccourcis ne sortent plus au survol : au doigt ils sont
     toujours là tant que le champ est vide ;
   - les résultats viennent du parent et se FILTRENT sur la saisie
     (l'original affichait sa liste fixe quoi qu'on tape) ;
   - choisir un résultat appelle `choisir` au lieu d'ouvrir un lien ;
   - la boîte se pose en haut d'écran, sous l'encoche, comme sur iPhone. */

export type ResultatSpotlight = {
  id: string
  icone: ReactNode
  libelle: string
  description: string
  motsCles: string
}

export type RaccourciSpotlight = { id: string; icone: ReactNode; libelle: string }

type AppleSpotlightProps = {
  ouvert: boolean
  fermer: () => void
  resultats: ResultatSpotlight[]
  raccourcis: RaccourciSpotlight[]
  choisir: (id: string) => void
  invite?: string
}

const RESSORT = { stiffness: 550, damping: 50, type: "spring" } as const

export function AppleSpotlight({ ouvert, fermer, resultats, raccourcis, choisir, invite = "Rechercher" }: AppleSpotlightProps) {
  const [saisie, setSaisie] = useState("")
  const trouves = filtrer(resultats, saisie)

  const choisirEtFermer = (id: string) => {
    setSaisie("")
    choisir(id)
  }

  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          initial={{ opacity: 0, filter: "blur(20px)", scaleX: 1.3, scaleY: 1.1, y: -10 }}
          animate={{ opacity: 1, filter: "blur(0px)", scaleX: 1, scaleY: 1, y: 0 }}
          exit={{ opacity: 0, filter: "blur(20px)", scaleX: 1.3, scaleY: 1.1, y: 10 }}
          transition={RESSORT}
          className="fixed inset-0 z-50 flex flex-col items-center bg-[#f2f2f7]/70 px-4 backdrop-blur-xl"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
          onClick={fermer}
        >
          <div className="flex w-full max-w-xl flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-2">
              <motion.div
                layoutId="c-spotlight-boite"
                style={{ borderRadius: 22 }}
                className="flex-1 overflow-hidden border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              >
                <ChampSpotlight invite={invite} valeur={saisie} changer={setSaisie} />
                {saisie && <ListeResultats resultats={trouves} choisir={choisirEtFermer} />}
              </motion.div>
              <button type="button" onClick={fermer} className="h-[52px] px-2 text-[17px] text-[#e561d3]">
                Annuler
              </button>
            </div>

            {!saisie && (
              <div className="flex justify-between gap-2">
                {raccourcis.map((r, i) => (
                  <motion.button
                    key={r.id}
                    type="button"
                    onClick={() => choisirEtFermer(r.id)}
                    initial={{ scale: 0.7, opacity: 0, y: -8 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, type: "spring", bounce: 0.2, delay: i * 0.05 }}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1.5 py-1"
                  >
                    <span className="flex size-14 items-center justify-center rounded-full bg-white text-[#1c1c1e] shadow-sm">{r.icone}</span>
                    <span className="text-[12px] text-[#3a3a3c]">{r.libelle}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function filtrer(resultats: ResultatSpotlight[], saisie: string) {
  const cherche = sansAccents(saisie.trim())
  if (!cherche) return resultats
  return resultats.filter((r) => sansAccents(`${r.libelle} ${r.description} ${r.motsCles}`).includes(cherche))
}

function sansAccents(texte: string) {
  return texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

function ChampSpotlight({ invite, valeur, changer }: { invite: string; valeur: string; changer: (v: string) => void }) {
  const champ = useRef<HTMLInputElement>(null)
  useEffect(() => champ.current?.focus(), [])

  return (
    <label className="flex h-[52px] items-center gap-2 px-4">
      <SearchNormal size={22} color="#8e8e93" />
      <span className="relative flex-1 text-[17px]">
        <AnimatePresence mode="popLayout">
          {!valeur && (
            <motion.span
              key="invite"
              initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[#8e8e93]"
            >
              {invite}
            </motion.span>
          )}
        </AnimatePresence>
        <input
          ref={champ}
          type="text"
          enterKeyHint="search"
          aria-label={invite}
          value={valeur}
          onChange={(e) => changer(e.target.value)}
          className="w-full bg-transparent text-[17px] text-[#1c1c1e] outline-none"
        />
      </span>
    </label>
  )
}

function ListeResultats({ resultats, choisir }: { resultats: ResultatSpotlight[]; choisir: (id: string) => void }) {
  if (resultats.length === 0) {
    return <p className="border-t border-black/5 px-4 py-4 text-[15px] text-[#8e8e93]">Rien sur ce trajet.</p>
  }
  return (
    <motion.div layout className="flex max-h-[60svh] flex-col overflow-y-auto border-t border-black/5 bg-[#f9f9fb] p-1.5">
      {resultats.map((r, i) => (
        <motion.button
          key={r.id}
          type="button"
          onClick={() => choisir(r.id)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04, duration: 0.2, ease: "easeOut" }}
          className={cn("flex min-h-14 w-full items-center gap-3 rounded-[14px] px-2.5 py-2 text-left active:bg-white")}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#1c1c1e] shadow-sm">{r.icone}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[16px] font-medium text-[#1c1c1e]">{r.libelle}</span>
            <span className="truncate text-[13px] text-[#8e8e93]">{r.description}</span>
          </span>
          <ChevronRight size={18} color="#c7c7cc" />
        </motion.button>
      ))}
    </motion.div>
  )
}
