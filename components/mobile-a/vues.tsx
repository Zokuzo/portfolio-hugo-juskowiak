"use client"

import type { ComponentType } from "react"
import { Keyboard, Laptop, Router, type HairlineProps } from "@lucasmarkes/hairline/react"
import { ArrowUpRight, FilePdf, LinkSquare, Sms, type IconProps } from "reicon-react"
import type { Projet } from "@/components/proto/projets"
import { CARRIERE, CONTACT, PILOTE } from "@/components/nfs/contenu"
import { MagnetTabs } from "@/components/obsidian/a-magnet-tabs"
import { figureDe } from "./figures"
import { Plaque } from "./carplay-poche"
import s from "./carplay.module.css"

type Ouvrir = (projet: Projet) => void
type VueAOnglets = { projets: Projet[]; onglet: string; choisir: (onglet: string) => void; ouvrir: Ouvrir }

export function VueWork({ projets, onglet, choisir, ouvrir }: VueAOnglets) {
  return (
    <div className={s.page}>
      <Entete Figure={Laptop} titre="WORK" jp="仕事 · シゴト" sousTitre={`En poste chez ${CARRIERE[0].nom} · ${CARRIERE[0].periode}`} />
      <MagnetTabs slug="work" options={["Projets", "Parcours"]} actif={onglet} choisir={choisir} />
      {onglet === "Projets" ? <ListeProjets projets={projets} ouvrir={ouvrir} /> : <Parcours />}
    </div>
  )
}

export function VueMaison({ projets, onglet, choisir, ouvrir }: VueAOnglets) {
  const filtres = projets.filter((p) => (onglet === "Cursus") === (p.genre === "formation"))
  return (
    <div className={s.page}>
      <Entete Figure={Keyboard} titre="MAISON" jp="家 · イエ" sousTitre="L'atelier du soir et les écoles" />
      <MagnetTabs slug="maison" options={["Atelier", "Cursus"]} actif={onglet} choisir={choisir} />
      <ListeProjets projets={filtres} ouvrir={ouvrir} />
    </div>
  )
}

const ICONES_CONTACT: Record<string, ComponentType<IconProps>> = { "E-mail": Sms, LinkedIn: LinkSquare, CV: FilePdf }

export function VueContact() {
  return (
    <div className={s.page}>
      <Entete Figure={Router} titre="CONTACT" jp="無線 · ムセン" sousTitre="E-mail, LinkedIn ou le CV" />
      <div className={s.liste}>
        {CONTACT.map((c) => {
          const Icone = ICONES_CONTACT[c.role] ?? Sms
          const externe = c.href.startsWith("http")
          return (
            <a key={c.role} className={s.contact} href={c.href} {...(externe ? { target: "_blank", rel: "noreferrer" } : {})}>
              <span className={`${s.icone} ${s.iconePetite} ${s.teinteRose}`}><Icone size={22} weight="Filled" /></span>
              <span><small className={s.mono}>{c.role}</small><b>{c.valeur}</b></span>
              <ArrowUpRight size={20} />
            </a>
          )
        })}
      </div>
      <dl className={`${s.panneau} ${s.fiches}`}>
        <dt>Pilote</dt><dd>{PILOTE.nom}</dd>
        <dt>Poste</dt><dd>{PILOTE.fonction}</dd>
        <dt>Base</dt><dd>{PILOTE.base}</dd>
        <dt>Langues</dt><dd>{PILOTE.langues}</dd>
      </dl>
      <footer className={s.pied}><Plaque /></footer>
    </div>
  )
}

/* L'en-tête d'une vue : une figure Hairline qui joue seule (le tactile
   n'a pas de survol), le titre posé dessus comme sur l'écran du GPS. */
function Entete({ Figure, titre, jp, sousTitre }: { Figure: ComponentType<HairlineProps>; titre: string; jp: string; sousTitre: string }) {
  return (
    <section className={s.entete}>
      <Figure play intensity={0.7} label={`Figure ${titre}`} />
      <span className={`${s.enteteJp} ${s.jp}`}>{jp}</span>
      <div className={s.enteteTexte}>
        <strong className={s.vitesse}>{titre}</strong>
        <span>{sousTitre}</span>
      </div>
    </section>
  )
}

function ListeProjets({ projets, ouvrir }: { projets: Projet[]; ouvrir: Ouvrir }) {
  return (
    <div className={s.liste}>
      {projets.map((p) => {
        const Figure = figureDe(p.slug)
        return (
          <button key={p.slug} className={s.carte} onClick={() => ouvrir(p)}>
            <span className={s.carteFigure}><Figure label={`Figure ${p.nom}`} /></span>
            <span className={s.carteCorps}>
              <span className={`${s.carteHaut} ${s.mono}`}>
                <span>{p.cadre}</span>
                <span className={s.pastille} data-vivant={p.courant || p.etat === "En service" ? "oui" : undefined}>{p.etat}</span>
              </span>
              <h3>{p.nom}</h3>
              <p>{p.sousTitre}</p>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Parcours() {
  return (
    <ol className={s.panneau}>
      {CARRIERE.map((etape) => (
        <li key={etape.nom + etape.periode} className={s.trajet}>
          <span className={s.trajetPoint} />
          <div>
            <h3>{etape.nom} <small>· {etape.role}</small></h3>
            <p>{etape.texte}</p>
            <time className={s.mono}>{etape.periode}</time>
          </div>
        </li>
      ))}
    </ol>
  )
}
