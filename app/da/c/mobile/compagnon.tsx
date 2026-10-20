"use client"

import { useState, type ReactNode, type UIEvent } from "react"
import type { Etape, Fiche, Profil } from "../donnees"
import s from "../cockpit.module.css"

type Onglet = "garage" | "trajet" | "pilote" | "radio"

/* Pictos au trait, 24 px : volant, borne GPS, casque, ondes radio. */
const DOCK: { id: Onglet; libelle: string; picto: ReactNode }[] = [
  { id: "garage", libelle: "Garage", picto: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M3.5 10h6M14.5 10h6M12 14.5V21" /></> },
  { id: "trajet", libelle: "Trajet", picto: <><path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z" /><circle cx="12" cy="10" r="2" /></> },
  { id: "pilote", libelle: "Pilote", picto: <><path d="M5 14a7 7 0 0 1 14 0v4H5z" /><path d="M5 14h14M9 18v-4" /></> },
  { id: "radio", libelle: "Contact", picto: <><circle cx="12" cy="12" r="2" /><path d="M8 8a5.5 5.5 0 0 0 0 8M16 8a5.5 5.5 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></> },
]

type Props = { fiches: Fiche[]; trajet: Etape[]; profil: Profil }

export default function Compagnon({ fiches, trajet, profil }: Props) {
  const [onglet, setOnglet] = useState<Onglet>("garage")

  return (
    <main className={`${s.racine} ${s.tel}`}>
      <header className={s.telEntete}>
        <span className={s.connexion}><i />GT86 · connectée</span>
        <span className={s.mention}>FR / EN</span>
      </header>

      {onglet === "garage" && <Garage fiches={fiches} profil={profil} />}
      {onglet === "trajet" && <Trajet trajet={trajet} />}
      {onglet === "pilote" && <Pilote profil={profil} />}
      {onglet === "radio" && <Radio profil={profil} />}

      <nav className={s.dock} aria-label="Sections">
        {DOCK.map(({ id, libelle, picto }) => (
          <button key={id} className={s.dockTouche} aria-current={onglet === id} onClick={() => setOnglet(id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {picto}
            </svg>
            {libelle}
          </button>
        ))}
      </nav>
    </main>
  )
}

function Garage({ fiches, profil }: { fiches: Fiche[]; profil: Profil }) {
  const [actif, setActif] = useState(0)
  const suivreGlisse = (e: UIEvent<HTMLDivElement>) => {
    const piste = e.currentTarget
    const carte = piste.firstElementChild as HTMLElement | null
    if (!carte) return
    setActif(Math.round(piste.scrollLeft / (carte.offsetWidth + 12)))
  }

  return (
    <>
      <section className={s.titreEcran}>
        <h1 className={s.chrome}>Hugo<br />Juskowiak<span className={s.tm}>TM</span></h1>
        <span className={s.jp}>ユゴー・ユスコヴィアク</span>
        <span className={s.roleTel}>{profil.role}</span>
      </section>

      <div className={s.rubrique}>
        <div className={s.rubriqueTete}>
          <h2 className={s.titre}>Garage</h2>
          <span className={s.mention}>{String(actif + 1).padStart(2, "0")} / {String(fiches.length).padStart(2, "0")}</span>
        </div>
      </div>
      <div className={s.jauge} aria-hidden>
        {fiches.map((f, i) => <span key={f.slug} data-actif={i <= actif} />)}
      </div>
      <div className={s.garage} onScroll={suivreGlisse}>
        {fiches.map((f) => (
          <article key={f.slug} className={`${s.carte} ${f.formation ? s.carteFormation : ""}`}>
            <span className={s.carteJp} aria-hidden>{f.jp}</span>
            <div>
              <div className={s.carteHaut}>
                <span>{f.formation ? "Formation" : "Projet"}</span>
                <span className={s.etatTel}><i />{f.etat}</span>
              </div>
              <h3 className={s.chrome}>{f.nom}</h3>
              <p>{f.sousTitre}</p>
            </div>
            <div>
              <div className={s.tuiles}>
                <div className={s.tuile}>Cadre<b>{f.cadre}</b></div>
                <div className={s.tuile} style={{ gridColumn: "span 2" }}>Période<b>{f.periode}</b></div>
              </div>
              <div className={s.puces}>
                {f.parc.slice(0, 4).map((outil) => <span key={outil} className={s.puce}>{outil}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className={`${s.mention} ${s.indice}`}>← glisser pour changer de voiture →</p>
    </>
  )
}

function Trajet({ trajet }: { trajet: Etape[] }) {
  return (
    <section className={s.rubrique}>
      <div className={s.rubriqueTete}>
        <h2 className={s.titre}>Trajet</h2>
        <span className={s.mention}>● travail ● école</span>
      </div>
      <ol className={s.trajet}>
        {trajet.map((e) => (
          <li key={e.nom + e.annee} className={s.troncon}>
            <span className={`${s.borne} ${e.travail ? s.borneTravail : ""}`} />
            <div className={s.tronconCorps}>
              <small>{e.annee}{e.lieu ? ` · ${e.lieu}` : ""}</small>
              <b>{e.nom}</b>
              <span>{e.fonction}</span>
              <details>
                <summary>DÉTAILS</summary>
                {e.resume}
              </details>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Pilote({ profil }: { profil: Profil }) {
  return (
    <section className={s.rubrique}>
      <div className={s.rubriqueTete}>
        <h2 className={s.titre}>Pilote</h2>
        <span className={s.mention}>{profil.statut}</span>
      </div>
      <div className={s.compteurs}>
        {profil.spec.map(([cle, valeur]) => (
          <div key={cle} className={s.compteur}>{cle}<b>{valeur}</b></div>
        ))}
      </div>
      <p className={s.texteTel}>{profil.corps}</p>
      <p className={s.texteTel}>{profil.chute}</p>
    </section>
  )
}

function Radio({ profil }: { profil: Profil }) {
  return (
    <section className={s.rubrique}>
      <div className={s.rubriqueTete}>
        <h2 className={s.titre}>Contact</h2>
        <span className={s.mention}>3 stations</span>
      </div>
      <div className={s.touches}>
        {profil.liens.map(([cle, texte, href]) => (
          <a key={cle} className={s.touche} href={href}>
            {cle}
            <small>{texte}</small>
          </a>
        ))}
      </div>
      <p className={`${s.mention} ${s.surPc}`}>La scène complète, en 3D, se conduit sur ordinateur.</p>
    </section>
  )
}
