"use client"

import { useEffect, type ReactNode } from "react"
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react"
import { ArrowRight, CloseCircle } from "reicon-react"
import type { Projet } from "@/components/proto/projets"
import { hrefFiche } from "@/components/proto/mondes"
import { t } from "@/components/proto/dict"
import { figureDe } from "./figures"
import s from "./carplay.module.css"

// au-delà de ce glissé (px) ou de cette vitesse (px/s), la feuille se range
const SEUIL_FERMETURE = 120
const VITESSE_FERMETURE = 600

/* La fiche s'ouvre en feuille, comme une app CarPlay qui monte du bas.
   ObsidianUI a un Drawer (shadcn) mais il exige vaul, absent ici : la
   feuille est donc écrite avec motion. On ne la tire que par sa
   poignée, sinon le glissé se battrait avec le défilement du contenu. */
export function Fiche({ projet, fermer }: { projet: Projet | null; fermer: () => void }) {
  const controles = useDragControls()
  useVerrouDefilement(projet !== null)

  const relacher = (_: unknown, info: PanInfo) => {
    if (info.offset.y > SEUIL_FERMETURE || info.velocity.y > VITESSE_FERMETURE) fermer()
  }

  return (
    <AnimatePresence>
      {projet && (
        <>
          <motion.div key="voile" className={s.voile} onClick={fermer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.section
            key="feuille"
            role="dialog"
            aria-modal="true"
            aria-label={projet.nom}
            className={s.feuille}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={controles}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={relacher}
          >
            <div className={s.poignee} onPointerDown={(e) => controles.start(e)}>
              <div className={s.poigneeLigne}>
                <span className={`${s.kicker} ${s.mono}`}>{t("fr", projet.genre === "formation" ? "fpFicheFormation" : "fpFiche")} · {projet.unite}</span>
                <button className={s.fermer} onClick={fermer} aria-label="Fermer la fiche"><CloseCircle size={24} /></button>
              </div>
            </div>
            <CorpsFiche projet={projet} />
          </motion.section>
        </>
      )}
    </AnimatePresence>
  )
}

function CorpsFiche({ projet: p }: { projet: Projet }) {
  const Figure = figureDe(p.slug)
  const formation = p.genre === "formation"
  return (
    <div className={s.feuilleCorps}>
      <div className={s.feuilleFigure}><Figure play intensity={0.8} label={`Figure ${p.nom}`} /></div>
      <header className={s.feuilleTitre}>
        <span className={`${s.jp} ${s.heroJp}`}>{p.jp}</span>
        <h2 className={s.vitesse}>{p.nom}</h2>
        <p>{p.sousTitre}</p>
        <div className={s.pastilles}>
          <span className={s.pastille} data-vivant={p.etat === "En service" ? "oui" : undefined}>{p.etat}</span>
          <span className={s.pastille}>{p.cadre}</span>
          <span className={`${s.pastille} ${s.mono}`}>{p.periode}</span>
        </div>
      </header>
      <Bloc titre={t("fr", "fpContexte")}><p>{p.contexte}</p></Bloc>
      {p.contraintes.length > 0 && (
        <Bloc titre={t("fr", formation ? "fpProgramme" : "fpContraintes")}>
          <ul>{p.contraintes.map((c) => <li key={c}>{c}</li>)}</ul>
        </Bloc>
      )}
      {p.decisions.length > 0 && (
        <Bloc titre={t("fr", formation ? "fpTravaux" : "fpDecisions")}>
          {p.decisions.map((d) => <div key={d.titre} className={s.decision}><b>{d.titre}</b><p>{d.texte}</p></div>)}
        </Bloc>
      )}
      {p.resultat && <Bloc titre={t("fr", "fpResultat")}><p>{p.resultat}</p></Bloc>}
      <Bloc titre={t("fr", formation ? "fpCompetences" : "fpParc")}>
        <div className={s.pastilles}>{p.parc.map((x) => <span key={x} className={s.pastille}>{x}</span>)}</div>
      </Bloc>
      <a className={s.bouton} href={hrefFiche(p.slug)}>Fiche complète <ArrowRight size={18} /></a>
    </div>
  )
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className={s.bloc}>
      <h4>{titre}</h4>
      {children}
    </section>
  )
}

// la page ne défile plus sous la feuille ouverte
function useVerrouDefilement(actif: boolean) {
  useEffect(() => {
    if (!actif) return
    const avant = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = avant
    }
  }, [actif])
}
