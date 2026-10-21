"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { ArrowRight, ArrowUpRight } from "reicon-react"
import type { Projet } from "@/components/proto/projets"
import { CARRIERE, CONTACT, PILOTE } from "@/components/nfs/contenu"
import { figureDe } from "@/components/mobile-a/figures"
import { IconeApp, type CleIcone } from "./icone-app"
import type { Aller, Ouvrir } from "./fusion"
import s from "./ab.module.css"

const EN_POSTE = CARRIERE[0]
const lienContact = (role: string) => CONTACT.find((c) => c.role === role)?.href ?? "#"
const attributsLien = (href: string) => (href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})
const TAILLE_TUILE = 60
const TAILLE_TUILE_CONTACT = 48
const deuxChiffres = (n: number) => String(n).padStart(2, "0")

/* Typographie française : la ponctuation haute ne part pas seule à la ligne. */
export const insecable = (texte: string) => texte.replace(/ ([:;!?])/g, "\u00a0$1")

/* ---------- ACCUEIL : l'écran-titre de B, la grille d'apps de A ---------- */

type App = { nom: string; icone: CleIcone } & ({ vue: Parameters<Aller>; href?: never } | { href: string; vue?: never })

const APPS: App[] = [
  { nom: "Projets", icone: "projets", vue: ["work", "Projets"] },
  { nom: "Parcours", icone: "parcours", vue: ["work", "Parcours"] },
  { nom: "Atelier", icone: "atelier", vue: ["maison", "Atelier"] },
  { nom: "Cursus", icone: "cursus", vue: ["maison", "Cursus"] },
  { nom: "Contact", icone: "contact", vue: ["contact"] },
  { nom: "Mail", icone: "mail", href: lienContact("E-mail") },
  { nom: "LinkedIn", icone: "linkedin", href: lienContact("LinkedIn") },
  { nom: "CV", icone: "cv", href: lienContact("CV") },
]

export function Accueil({ aller, travail, maison }: { aller: Aller; travail: Projet[]; maison: Projet[] }) {
  return (
    <div className={s.page}>
      <section className={s.titre}>
        <span className={s.jp}>{PILOTE.jp}</span>
        <h1 className={s.nom}>
          Hugo
          <br />
          Juskowiak
        </h1>
        <p className={s.fonction}>{PILOTE.fonction}</p>
        <p className={s.chapo}>
          {insecable(`En poste chez ${EN_POSTE.nom} : ${EN_POSTE.texte}`)}
        </p>
      </section>

      <MenuJeu
        lignes={[
          { cle: "work", titre: "Work", texte: `${travail.length} projets pro, le parcours`, agir: () => aller("work") },
          { cle: "maison", titre: "Maison", texte: `${maison.length} fiches perso, l'atelier, les cursus`, agir: () => aller("maison") },
        ]}
      />

      <section>
        <h2 className={s.titreSection}>Apps</h2>
        <div className={s.apps}>
          {APPS.map((app) => (
            <TuileApp key={app.nom} app={app} aller={aller} />
          ))}
        </div>
      </section>

      <footer className={s.pied}>
        <span className={s.mono}>La chute de la GT86 en 3D se joue sur ordinateur</span>
      </footer>
    </div>
  )
}

function TuileApp({ app, aller }: { app: App; aller: Aller }) {
  const contenu = (
    <>
      <span className={s.tuile}>
        <IconeApp cle={app.icone} taille={TAILLE_TUILE} />
      </span>
      <span className={s.tuileNom}>{app.nom}</span>
    </>
  )
  if (app.href) {
    return (
      <a className={s.app} href={app.href} {...attributsLien(app.href)}>
        {contenu}
      </a>
    )
  }
  return (
    <button type="button" className={s.app} onClick={() => aller(...app.vue!)}>
      {contenu}
    </button>
  )
}

type LigneMenu = { cle: string; titre: string; texte: string; agir: () => void }

/* La sélection façon menu de jeu (piste B) : une seule ligne allumée,
   elle suit le doigt et le clavier. */
function MenuJeu({ lignes }: { lignes: LigneMenu[] }) {
  const [active, setActive] = useState(0)
  return (
    <ol className={s.menu}>
      {lignes.map((ligne, i) => (
        <li key={ligne.cle}>
          <button
            type="button"
            className={s.ligne}
            data-active={i === active || undefined}
            onPointerEnter={() => setActive(i)}
            onPointerDown={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={ligne.agir}
          >
            <span className={s.ligneNumero}>{deuxChiffres(i + 1)}</span>
            <span className={s.ligneCorps}>
              <span className={s.ligneTitre}>{ligne.titre}</span>
              <span className={s.ligneTexte}>{ligne.texte}</span>
            </span>
            <ArrowRight size={20} className={s.ligneFleche} />
          </button>
        </li>
      ))}
    </ol>
  )
}

/* ---------- WORK / MAISON ---------- */

type VueAOnglets = { projets: Projet[]; onglet: string; choisir: (onglet: string) => void; ouvrir: Ouvrir }

export function VueWork({ projets, onglet, choisir, ouvrir }: VueAOnglets) {
  return (
    <div className={s.page}>
      <Rubrique titre="Work" compte={`${projets.length} projets · en poste chez ${EN_POSTE.nom}`} />
      <Onglets nom="work" options={["Projets", "Parcours"]} actif={onglet} choisir={choisir} />
      {onglet === "Projets" ? <ListeProjets projets={projets} ouvrir={ouvrir} /> : <Classement />}
    </div>
  )
}

export function VueMaison({ projets, onglet, choisir, ouvrir }: VueAOnglets) {
  const filtres = projets.filter((p) => (onglet === "Cursus") === (p.genre === "formation"))
  return (
    <div className={s.page}>
      <Rubrique titre="Maison" compte="L'atelier du soir et les écoles" />
      <Onglets nom="maison" options={["Atelier", "Cursus"]} actif={onglet} choisir={choisir} />
      <ListeProjets projets={filtres} ouvrir={ouvrir} />
    </div>
  )
}

function Rubrique({ titre, compte }: { titre: string; compte: string }) {
  return (
    <header className={s.rubrique}>
      <h1 className={s.rubriqueTitre}>{titre}</h1>
      <span className={s.mono}>{compte}</span>
    </header>
  )
}

/* Deux onglets au pouce : 48 px de haut, le trait d'accent glisse de l'un à l'autre. */
function Onglets({ nom, options, actif, choisir }: { nom: string; options: string[]; actif: string; choisir: (option: string) => void }) {
  return (
    <div className={s.onglets} role="tablist">
      {options.map((option) => (
        <button key={option} type="button" role="tab" aria-selected={option === actif} className={s.ongletVue} onClick={() => choisir(option)}>
          {option}
          {option === actif && <motion.span layoutId={`${nom}-trait`} className={s.ongletTrait} transition={{ type: "spring", bounce: 0.15, duration: 0.3 }} />}
        </button>
      ))}
    </div>
  )
}

function ListeProjets({ projets, ouvrir }: { projets: Projet[]; ouvrir: Ouvrir }) {
  return (
    <ol className={s.liste}>
      {projets.map((p, i) => {
        const Figure = figureDe(p.slug)
        return (
          <li key={p.slug}>
            <button type="button" className={s.carte} onClick={() => ouvrir(p)}>
              <span className={s.carteFigure}>
                <Figure label={`Figure ${p.nom}`} />
              </span>
              <span className={s.carteCorps}>
                <span className={s.mono}>
                  {deuxChiffres(i + 1)} · {p.cadre}
                </span>
                <span className={s.carteNom}>{p.nom}</span>
                <span className={s.carteTexte}>{p.sousTitre}</span>
                <span className={s.pastille} data-vivant={p.etat === "En service" || undefined}>
                  {p.etat}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/* Le parcours en classement de course (piste B) : P1 est le poste actuel. */
function Classement() {
  return (
    <ol className={s.classement}>
      {CARRIERE.map((etape, i) => (
        <li key={etape.nom + etape.periode} className={s.tour} data-courant={i === 0 || undefined}>
          <span className={s.position}>P{i + 1}</span>
          <span className={s.tourCorps}>
            <span className={s.tourNom}>{etape.nom}</span>
            <span className={s.tourRole}>{etape.role}</span>
            <span className={s.tourTexte}>{etape.texte}</span>
            <span className={s.mono}>{etape.periode}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

// la plaque de la GT86, en petit : le seul objet qui vient tout droit de la 3D, posé une fois (barre du haut)
export function Plaque() {
  return (
    <span className={s.plaque} aria-label="Plaque HUGOJSK">
      <i>GT86</i>HUGOJSK
    </span>
  )
}

/* ---------- CONTACT ---------- */

const ICONES_CONTACT: Record<string, CleIcone> = { "E-mail": "mail", LinkedIn: "linkedin", CV: "cv" }

export function VueContact() {
  return (
    <div className={s.page}>
      <Rubrique titre="Contact" compte={`${CONTACT.length} canaux · ligne ouverte`} />
      <p className={s.chapo}>{insecable("Un poste, un projet, une question technique : la ligne est ouverte.")}</p>
      <ul className={s.appels}>
        {CONTACT.map((c) => {
          return (
            <li key={c.role}>
              <a className={s.appel} href={c.href} {...attributsLien(c.href)}>
                <IconeApp cle={ICONES_CONTACT[c.role] ?? "mail"} taille={TAILLE_TUILE_CONTACT} />
                <span className={s.appelCorps}>
                  <span className={s.mono}>{c.role}</span>
                  <b>{c.valeur}</b>
                </span>
                <ArrowUpRight size={20} aria-hidden />
              </a>
            </li>
          )
        })}
      </ul>
      <dl className={s.specs}>
        <Spec terme="Pilote" valeur={PILOTE.nom} />
        <Spec terme="Poste" valeur={PILOTE.fonction} />
        <Spec terme="Base" valeur={PILOTE.base} />
        <Spec terme="Langues" valeur={PILOTE.langues} />
      </dl>
    </div>
  )
}

export function Spec({ terme, valeur }: { terme: string; valeur: string }) {
  return (
    <div>
      <dt className={s.mono}>{terme}</dt>
      <dd>{valeur}</dd>
    </div>
  )
}
