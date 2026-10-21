"use client"

import type { RefObject } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "motion/react"

/* Copie adaptée de ObsidianUI (src/components/block/glowing-scroll-indicator.tsx).
   Changements : le conteneur arrive par ref (plus de getElementById ni de
   MutationObserver sur tout le body), 24 barres au lieu de 40 pour tenir
   sur 358 px, et le curseur rouge passe au rose de la piste. */

const BARRES = 24

type Props = { conteneur: RefObject<HTMLElement | null> }

export function GlowingScrollIndicator({ conteneur }: Props) {
  const { scrollXProgress } = useScroll({ container: conteneur })
  const gauche = useTransform(scrollXProgress, [0, 1], ["0%", "100%"])

  return (
    <div className="relative flex h-[40px] w-fit items-end justify-center gap-[5px]" aria-hidden>
      {Array.from({ length: BARRES }).map((_, index) => (
        <Barre key={index} index={index} progression={scrollXProgress} />
      ))}
      <motion.div className="absolute bottom-0 h-[40px] w-[2px] -translate-x-1/2 bg-[#e561d3]" style={{ left: gauche }}>
        <div className="absolute top-0 left-1/2 h-[10px] w-[10px] -translate-x-1/2 rounded-full bg-[#e561d3] shadow-[0_0_10px_#e561d3]" />
      </motion.div>
    </div>
  )
}

function Barre({ index, progression }: { index: number; progression: MotionValue<number> }) {
  const position = index / (BARRES - 1)
  const avant = Math.max(0, position - 3 / BARRES)
  const apres = Math.min(1, position + 3 / BARRES)
  const paliers = [0, avant, position, apres, 1]
  const hauteur = useTransform(progression, paliers, [5, 12, 28, 12, 5])
  const opacite = useTransform(progression, paliers, [0.15, 0.4, 1, 0.4, 0.15])
  const largeur = useTransform(progression, [0, position, 1], [1.5, 4, 1.5])
  return <motion.div className="bg-white" style={{ height: hauteur, opacity: opacite, width: largeur }} />
}

