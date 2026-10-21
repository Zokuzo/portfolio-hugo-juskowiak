"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

/* Copié d'ObsidianUI (src/components/block/folder-preview.tsx, variante
   « durga »), piste C. Ce qui change :
   - une seule variante, rethémée clair iOS (gris système, liseré rose) ;
   - l'ouverture n'attend plus le survol, qui n'existe pas au doigt :
     elle est pilotée par `ouvert` (le parent la lie au doigt posé) ;
   - les fichiers ne sortent plus dans une bulle à droite, qui débordait
     de l'écran : ce sont des fiches qui dépassent du dossier (la
     première au repos) et s'ouvrent en éventail. */

const DUREE_OUVERTURE = 0.3
const COURBE: [number, number, number, number] = [0.16, 1, 0.3, 1]
const FICHES_MAX = 3

function DosDossier() {
  return (
    <svg viewBox="0 0 20 16" className="h-full w-full fill-current" aria-hidden>
      <path d="M7.5,0C7.4,0,2,0,2,0C0.9,0,0,0.9,0,2l0,12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V4c0-1.1-0.9-2-2-2c0,0-7.5,0-8,0C9,2,9.9,0,7.5,0z" />
    </svg>
  )
}

function CouvertureDossier() {
  return (
    <svg viewBox="0 0 20 16" className="h-full w-full fill-current" aria-hidden>
      <path d="M2,2h16c1.1,0,2,0.9,2,2v10c0,1.1-0.9,2-2,2H2c-1.1,0-2-0.9-2-2V4C0,2.9,0.9,2,2,2z" />
    </svg>
  )
}

type FolderPreviewProps = {
  fichiers: string[]
  ouvert: boolean
  marque?: string
  className?: string
}

export function FolderPreview({ fichiers, ouvert, marque, className }: FolderPreviewProps) {
  return (
    <div className={cn("relative aspect-[20/16] w-full", className)} style={{ perspective: "800px" }}>
      <div className="absolute inset-0 text-[#c7c7cc]">
        <DosDossier />
      </div>

      {fichiers.slice(0, FICHES_MAX).map((nom, i) => (
        <motion.div
          key={nom}
          className="absolute right-[10%] left-[10%] h-[62%] rounded-[6px] border border-black/5 bg-white px-[8%] pt-[5%] text-[10px] leading-tight font-medium text-[#3a3a3c] shadow-sm"
          style={{ bottom: "6%", zIndex: FICHES_MAX - i }}
          initial={false}
          animate={{
            y: ouvert ? `-${90 + i * 8}%` : `-${58 - i * 6}%`,
            x: ouvert ? `${(i - 1) * 18}%` : `${i * 7}%`,
            rotate: ouvert ? (i - 1) * 9 : 0,
          }}
          transition={{ duration: DUREE_OUVERTURE + i * 0.05, ease: COURBE }}
        >
          <span className="block truncate">{nom}</span>
        </motion.div>
      ))}

      <motion.div
        className="relative z-10 text-[#ececf0]"
        style={{ transformOrigin: "50% 100%", transformStyle: "preserve-3d" }}
        initial={false}
        animate={{ rotateX: ouvert ? -30 : 0 }}
        transition={{ duration: DUREE_OUVERTURE, ease: COURBE }}
      >
        <CouvertureDossier />
        <span className="absolute right-[12%] bottom-[16%] left-[12%] h-[2px] rounded-full bg-[#e561d3]" />
        {marque && (
          <span className="absolute top-[22%] left-[12%] text-[12px] font-semibold tracking-wide text-[#48484a]">{marque}</span>
        )}
      </motion.div>
    </div>
  )
}
