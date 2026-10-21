"use client"

import { useEffect, type ReactNode } from "react"
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react"
import { ArrowRight, X } from "reicon-react"
import type { Projet } from "@/components/proto/projets"
import { hrefFiche } from "@/components/proto/mondes"
import { t } from "@/components/proto/dict"
import { figureDe } from "@/components/mobile-a/figures"
import { insecable, Spec } from "./vues"
import s from "./ab.module.css"

// au-delà de ce glissé (px) ou de cette vitesse (px/s), la feuille se range
const SEUIL_FERMETURE = 120
const VITESSE_FERMETURE = 600

/* La feuille de la piste A (elle monte du bas, se tire par sa poignée,
   se range au retour du téléphone) avec le corps éditorial de la
   piste B. On ne la tire que par la poignée : sinon le glissé se
   battrait avec le défilement du contenu. */
export function Fiche({ projet, fermer }: { projet: Projet | null; fermer: () => void }) {
  const controles = useDragControls()
  useVerrouDefilement(projet !== null)
  useEchapFerme(projet !== null, fermer)

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
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
            drag="y"
            dragListener={false}
            dragControls={controles}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={relacher}
          >
            <div className={s.poignee} onPointerDown={(e) => controles.start(e)}>
              <span className={s.mono}>
                {projet.unite} · {t("fr", projet.genre === "formation" ? "fpFicheFormation" : "fpFiche")}
              </span>
              <button type="button" className={s.fermer} onClick={fermer} aria-label="Fermer la fiche">
                <X size={22} />
              </button>
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
      <div className={s.feuilleFigure}>
        <Figure play intensity={0.8} label={`Figure ${p.nom}`} />
        <span className={s.carteJp}>{p.jp}</span>
      </div>

      <h2 className={s.ficheNom}>{p.nom}</h2>
      <p className={s.ficheSous}>{insecable(p.sousTitre)}</p>

      <dl className={s.specs}>
        <Spec terme="Cadre" valeur={p.cadre} />
        <Spec terme="Période" valeur={p.periode} />
        <Spec terme="État" valeur={p.etat} />
      </dl>

      <Bloc titre={t("fr", "fpContexte")}>
        <p>{insecable(p.contexte)}</p>
      </Bloc>

      {p.contraintes.length > 0 && (
        <Bloc titre={t("fr", formation ? "fpProgramme" : "fpContraintes")}>
          <ul className={s.puces}>
            {p.contraintes.map((c) => (
              <li key={c}>{insecable(c)}</li>
            ))}
          </ul>
        </Bloc>
      )}

      {p.decisions.length > 0 && (
        <Bloc titre={t("fr", formation ? "fpTravaux" : "fpDecisions")}>
          <ol className={s.decisions}>
            {p.decisions.map((d, i) => (
              <li key={d.titre}>
                <span className={s.decisionNumero}>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <b>{d.titre}</b>
                  {insecable(d.texte)}
                </span>
              </li>
            ))}
          </ol>
        </Bloc>
      )}

      {p.resultat && (
        <Bloc titre={t("fr", "fpResultat")}>
          <p>{insecable(p.resultat)}</p>
        </Bloc>
      )}

      {p.parc.length > 0 && (
        <Bloc titre={t("fr", formation ? "fpCompetences" : "fpParc")}>
          <ul className={s.outils}>
            {p.parc.map((outil) => (
              <li key={outil}>{outil}</li>
            ))}
          </ul>
        </Bloc>
      )}

      <a className={s.bouton} href={hrefFiche(p.slug)}>
        Fiche complète <ArrowRight size={18} />
      </a>
    </div>
  )
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className={s.bloc}>
      <h3 className={s.blocTitre}>{titre}</h3>
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

function useEchapFerme(actif: boolean, fermer: () => void) {
  useEffect(() => {
    if (!actif) return
    const surTouche = (ev: KeyboardEvent) => ev.key === "Escape" && fermer()
    addEventListener("keydown", surTouche)
    return () => removeEventListener("keydown", surTouche)
  }, [actif, fermer])
}
