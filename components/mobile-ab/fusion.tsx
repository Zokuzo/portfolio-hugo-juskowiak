"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { usePathname } from "next/navigation"
import type { Projet } from "@/components/proto/projets"
import { hrefFiche } from "@/components/proto/mondes"
import { Accueil, Plaque, VueContact, VueMaison, VueWork } from "./vues"
import { Fiche } from "./fiche"
import { BasculeTheme } from "./bascule-theme"
import { FamilleIcones, IconeApp, type CleIcone } from "./icone-app"
import { useEcranLarge, useTelephone } from "./ecran"
import { PALETTES, PALETTE_PAR_DEFAUT, type Palette } from "./palettes"
import s from "./ab.module.css"

export type Vue = "accueil" | "work" | "maison" | "contact"
export type Aller = (vue: Vue, onglet?: string) => void
export type Ouvrir = (projet: Projet) => void

const DOCK: { vue: Vue; nom: string; icone: CleIcone }[] = [
  { vue: "accueil", nom: "Accueil", icone: "accueil" },
  { vue: "work", nom: "Work", icone: "work" },
  { vue: "maison", nom: "Maison", icone: "maison" },
  { vue: "contact", nom: "Contact", icone: "contact" },
]

const TAILLE_ICONE_DOCK = 34
const ONGLETS_PAR_DEFAUT = { work: "Projets", maison: "Atelier" }

/* L'ADRESSE PORTE L'ÉCRAN (#42), aux vraies URLs du site : /, /work,
   /home, et /work/<slug> ou /home/<slug> pour une fiche ouverte. Contact
   n'a pas de route : il vit sur /#contact. La recherche (?palette=) suit. */
type Adresse = { vue: Vue; slug: string | null }
const VUE_DU_SEGMENT: Record<string, Vue> = { work: "work", home: "maison" }
const CHEMIN_DE: Record<Vue, string> = { accueil: "/", work: "/work", maison: "/home", contact: "/" }

function lireAdresse(chemin: string, ancre = ""): Adresse {
  const [, segment, slug] = chemin.split("/")
  const vue = VUE_DU_SEGMENT[segment]
  if (vue) return { vue, slug: slug || null }
  return { vue: ancre === "#contact" ? "contact" : "accueil", slug: null }
}

const urlDeVue = (vue: Vue) => CHEMIN_DE[vue] + location.search + (vue === "contact" ? "#contact" : "")

/* Le titre d'onglet suit l'adresse : pushState ne recharge pas la
   metadata de Next. Les mêmes titres que les routes (app/layout.tsx,
   app/work, app/home et leurs [slug]), à tenir alignés. */
const TITRE_DE: Record<Vue, string> = {
  accueil: "Hugo Juskowiak | Portfolio",
  contact: "Hugo Juskowiak | Portfolio",
  work: "Travail | Hugo Juskowiak",
  maison: "Maison | Hugo Juskowiak",
}
const titreDe = (vue: Vue, fiche: Projet | null) => (fiche ? `${fiche.nom} | Hugo Juskowiak` : TITRE_DE[vue])

/* La navigation de la piste A (dock, grille d'apps, feuille qui monte)
   dans une seule DA (./DA.md). Chaque route du site la rend sous 768 px
   (deux-corps.tsx) : le serveur la sert déjà dans la vue de son URL.
   Changer d'écran ne recharge rien : `history.pushState` réécrit l'URL
   (Next l'accepte et garde l'arbre rendu), le retour du téléphone la
   relit. Ouvrir une fiche empile une entrée : le retour range la feuille
   au lieu de quitter la vue, et le lien partagé rouvre la fiche. */
export function Fusion({ travail, maison, pleineLargeur }: { travail: Projet[]; maison: Projet[]; pleineLargeur: boolean }) {
  const chemin = usePathname()
  const [adresse, setAdresse] = useState(() => lireAdresse(chemin))
  // une fiche de cursus ouverte par lien direct : la liste derrière la feuille est celle des cursus
  const [onglets, setOnglets] = useState(() =>
    maison.some((p) => p.slug === adresse.slug && p.genre === "formation") ? { ...ONGLETS_PAR_DEFAUT, maison: "Cursus" } : ONGLETS_PAR_DEFAUT,
  )
  const palette = usePalette()
  const affichee = useTelephone() || pleineLargeur
  const { vue } = adresse
  const masquee = useEcranLarge() && !pleineLargeur
  /* La feuille d'un lien direct est dans le HTML serveur (pas de liste
     qui clignote avant elle) ; sur desktop, masquée, elle se retire dès
     l'hydratation pour ne pas animer sa figure dans le vide. */
  const ouverte = masquee ? null : ([...travail, ...maison].find((p) => p.slug === adresse.slug) ?? null)

  useEffect(() => {
    if (affichee) document.title = titreDe(vue, ouverte)
  }, [affichee, vue, ouverte])

  useEffect(() => {
    const suivreAdresse = () => setAdresse(lireAdresse(location.pathname, location.hash))
    suivreAdresse()
    addEventListener("popstate", suivreAdresse)
    return () => removeEventListener("popstate", suivreAdresse)
  }, [])

  const aller: Aller = (cible, onglet) => {
    if (cible !== vue || adresse.slug) history.pushState(null, "", urlDeVue(cible))
    setAdresse({ vue: cible, slug: null })
    if (onglet && (cible === "work" || cible === "maison")) setOnglets((o) => ({ ...o, [cible]: onglet }))
    window.scrollTo({ top: 0 })
  }
  const choisirOnglet = (cible: "work" | "maison") => (onglet: string) => setOnglets((o) => ({ ...o, [cible]: onglet }))

  const ouvrir: Ouvrir = (projet) => {
    history.pushState({ fiche: true }, "", hrefFiche(projet.slug) + location.search)
    setAdresse({ vue, slug: projet.slug })
  }
  // arrivé par un lien direct sur une fiche, il n'y a pas d'entrée à dépiler : on remplace
  const fermer = () => {
    if (history.state?.fiche) return history.back()
    history.replaceState(null, "", urlDeVue(vue))
    setAdresse({ vue, slug: null })
  }

  return (
    <FamilleIcones>
      <main className={s.racine} data-palette={palette}>
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
        <Fiche projet={ouverte} fermer={fermer} affichee={affichee} />
      </main>
    </FamilleIcones>
  )
}

/* ?palette=<nom> choisit la palette (revue : /da/m/palettes) ; un nom inconnu garde la défaut */
function usePalette() {
  const [palette, setPalette] = useState<Palette>(PALETTE_PAR_DEFAUT)
  useEffect(() => {
    const demandee = new URLSearchParams(location.search).get("palette")
    if (PALETTES.includes(demandee as Palette)) setPalette(demandee as Palette)
  }, [])
  return palette
}

function BarreEtat({ vue }: { vue: Vue }) {
  const onglet = DOCK.find((d) => d.vue === vue)!
  return (
    <header className={s.etat}>
      <Plaque />
      <span className={s.mono}>{onglet.nom}</span>
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
