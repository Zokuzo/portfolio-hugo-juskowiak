"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { BatteryFull, Briefcase, Call, Gps, Home, House, Wifi } from "reicon-react"
import type { Projet } from "@/components/proto/projets"
import { Accueil } from "./accueil"
import { VueContact, VueMaison, VueWork } from "./vues"
import { Fiche } from "./fiche"
import s from "./carplay.module.css"

export type Vue = "accueil" | "work" | "maison" | "contact"
export type Aller = (vue: Vue, onglet?: string) => void

const DOCK = [
  { vue: "accueil", nom: "Accueil", Icone: Home },
  { vue: "work", nom: "Work", Icone: Briefcase },
  { vue: "maison", nom: "Maison", Icone: House },
  { vue: "contact", nom: "Contact", Icone: Call },
] as const

const ONGLETS_PAR_DEFAUT = { work: "Projets", maison: "Atelier" }
const VUES: Vue[] = DOCK.map((d) => d.vue)

/* L'écran de bord tient dans un seul composant d'état : la vue,
   l'onglet de chaque vue, la fiche ouverte. Le hash garde la vue pour
   qu'un lien partagé (ou un rechargement) retombe au même endroit. */
export function CarplayPoche({ travail, maison }: { travail: Projet[]; maison: Projet[] }) {
  const [vue, setVue] = useState<Vue>("accueil")
  const [onglets, setOnglets] = useState(ONGLETS_PAR_DEFAUT)
  const [ouverte, setOuverte] = useState<Projet | null>(null)

  // le bouton retour du téléphone repasse par les vues au lieu de quitter le site
  useEffect(() => {
    const lireHash = () => {
      const depuisHash = location.hash.slice(1) as Vue
      setVue(VUES.includes(depuisHash) ? depuisHash : "accueil")
      setOuverte(null)
    }
    lireHash()
    addEventListener("popstate", lireHash)
    return () => removeEventListener("popstate", lireHash)
  }, [])

  const aller: Aller = (cible, onglet) => {
    if (cible !== vue) history.pushState(null, "", cible === "accueil" ? location.pathname : `#${cible}`)
    setVue(cible)
    if (onglet && (cible === "work" || cible === "maison")) setOnglets((o) => ({ ...o, [cible]: onglet }))
    window.scrollTo({ top: 0 })
  }
  const choisirOnglet = (cible: "work" | "maison") => (onglet: string) => setOnglets((o) => ({ ...o, [cible]: onglet }))

  return (
    <main className={s.racine}>
      <BarreEtat />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={vue} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
          {vue === "accueil" && <Accueil aller={aller} travail={travail} maison={maison} />}
          {vue === "work" && <VueWork projets={travail} onglet={onglets.work} choisir={choisirOnglet("work")} ouvrir={setOuverte} />}
          {vue === "maison" && <VueMaison projets={maison} onglet={onglets.maison} choisir={choisirOnglet("maison")} ouvrir={setOuverte} />}
          {vue === "contact" && <VueContact />}
        </motion.div>
      </AnimatePresence>
      <Dock actif={vue} aller={aller} />
      <Fiche projet={ouverte} fermer={() => setOuverte(null)} />
    </main>
  )
}

function BarreEtat() {
  const heure = useHeure()
  return (
    <header className={s.etat}>
      <span className={s.heure}>{heure}</span>
      <Plaque />
      <span className={s.etatIcones} aria-hidden>
        <Gps size={16} />
        <Wifi size={16} />
        <BatteryFull size={18} />
      </span>
    </header>
  )
}

export function Plaque() {
  return (
    <span className={s.plaque} aria-label="Plaque HUGOJSK">
      <i>GT86</i>HUGOJSK
    </span>
  )
}

// l'heure ne s'écrit qu'après l'hydratation : le serveur ne connaît pas le fuseau du visiteur
function useHeure() {
  const [heure, setHeure] = useState("")
  useEffect(() => {
    const ecrire = () => setHeure(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }))
    ecrire()
    const minuterie = setInterval(ecrire, 15_000)
    return () => clearInterval(minuterie)
  }, [])
  return heure
}

function Dock({ actif, aller }: { actif: Vue; aller: Aller }) {
  return (
    <nav className={s.dock} aria-label="Navigation">
      {DOCK.map(({ vue, nom, Icone }) => (
        <button key={vue} className={s.onglet} onClick={() => aller(vue)} aria-current={vue === actif ? "page" : undefined}>
          {vue === actif && <motion.span layoutId="dock-actif" className={s.ongletFond} transition={{ type: "spring", bounce: 0.25, duration: 0.4 }} />}
          <Icone size={24} weight={vue === actif ? "Filled" : "Outline"} />
          <span>{nom}</span>
        </button>
      ))}
    </nav>
  )
}
