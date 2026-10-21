"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { Projet } from "@/components/proto/projets"
import { Accueil, Plaque, VueContact, VueMaison, VueWork } from "./vues"
import { Fiche } from "./fiche"
import { BasculeTheme } from "./bascule-theme"
import { FamilleIcones, IconeApp, type CleIcone } from "./icone-app"
import s from "./ab.module.css"

export type Vue = "accueil" | "work" | "maison" | "contact"
export type Aller = (vue: Vue, onglet?: string) => void
export type Ouvrir = (projet: Projet) => void

const DOCK: { vue: Vue; nom: string; jp: string; icone: CleIcone }[] = [
  { vue: "accueil", nom: "Accueil", jp: "ホーム", icone: "accueil" },
  { vue: "work", nom: "Work", jp: "仕事", icone: "work" },
  { vue: "maison", nom: "Maison", jp: "家", icone: "maison" },
  { vue: "contact", nom: "Contact", jp: "無線", icone: "contact" },
]

const TAILLE_ICONE_DOCK = 34
const ONGLETS_PAR_DEFAUT = { work: "Projets", maison: "Atelier" }
const VUES = DOCK.map((d) => d.vue)

const adresseDe = (vue: Vue) => (vue === "accueil" ? location.pathname : `#${vue}`)

/* La navigation de la piste A (dock, grille d'apps, feuille qui monte)
   habillée par la piste B. L'adresse porte l'écran : #work, et
   #work/reach-up pour une fiche ouverte. Ouvrir une fiche empile une
   entrée d'historique : le bouton retour du téléphone range la feuille
   au lieu de quitter la vue. */
export function Fusion({ travail, maison }: { travail: Projet[]; maison: Projet[] }) {
  const [vue, setVue] = useState<Vue>("accueil")
  const [onglets, setOnglets] = useState(ONGLETS_PAR_DEFAUT)
  const [ouverte, setOuverte] = useState<Projet | null>(null)

  useEffect(() => {
    const lireAdresse = () => {
      const [cible, slug] = location.hash.slice(1).split("/")
      setVue(VUES.includes(cible as Vue) ? (cible as Vue) : "accueil")
      setOuverte([...travail, ...maison].find((p) => p.slug === slug) ?? null)
    }
    lireAdresse()
    addEventListener("popstate", lireAdresse)
    return () => removeEventListener("popstate", lireAdresse)
  }, [travail, maison])

  const aller: Aller = (cible, onglet) => {
    if (cible !== vue) history.pushState(null, "", adresseDe(cible))
    setVue(cible)
    if (onglet && (cible === "work" || cible === "maison")) setOnglets((o) => ({ ...o, [cible]: onglet }))
    window.scrollTo({ top: 0 })
  }
  const choisirOnglet = (cible: "work" | "maison") => (onglet: string) => setOnglets((o) => ({ ...o, [cible]: onglet }))

  const ouvrir: Ouvrir = (projet) => {
    history.pushState({ fiche: true }, "", `#${vue}/${projet.slug}`)
    setOuverte(projet)
  }
  // arrivé par un lien direct sur une fiche, il n'y a pas d'entrée à dépiler : on remplace
  const fermer = () => {
    if (history.state?.fiche) return history.back()
    history.replaceState(null, "", adresseDe(vue))
    setOuverte(null)
  }

  return (
    <FamilleIcones>
      <main className={s.racine}>
        <BarreEtat vue={vue} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={vue} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2, ease: "easeOut" }}>
            {vue === "accueil" && <Accueil aller={aller} travail={travail} maison={maison} />}
            {vue === "work" && <VueWork projets={travail} onglet={onglets.work} choisir={choisirOnglet("work")} ouvrir={ouvrir} />}
            {vue === "maison" && <VueMaison projets={maison} onglet={onglets.maison} choisir={choisirOnglet("maison")} ouvrir={ouvrir} />}
            {vue === "contact" && <VueContact />}
          </motion.div>
        </AnimatePresence>
        <Dock actif={vue} aller={aller} />
        <Fiche projet={ouverte} fermer={fermer} />
      </main>
    </FamilleIcones>
  )
}

function BarreEtat({ vue }: { vue: Vue }) {
  const onglet = DOCK.find((d) => d.vue === vue)!
  return (
    <header className={s.etat}>
      <Plaque />
      <span className={s.mono}>
        {onglet.nom} · {onglet.jp}
      </span>
      <BasculeTheme />
    </header>
  )
}

function Dock({ actif, aller }: { actif: Vue; aller: Aller }) {
  return (
    <nav className={s.dock} aria-label="Navigation">
      {DOCK.map(({ vue, nom, icone }) => {
        const estActif = vue === actif
        return (
          <button key={vue} type="button" className={s.onglet} onClick={() => aller(vue)} aria-current={estActif ? "page" : undefined}>
            {estActif && <motion.span layoutId="ab-dock" className={s.ongletFond} transition={{ type: "spring", bounce: 0.2, duration: 0.38 }} />}
            <IconeApp cle={icone} taille={TAILLE_ICONE_DOCK} />
            <span>{nom}</span>
          </button>
        )
      })}
    </nav>
  )
}
