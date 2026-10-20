"use client"

import { useEffect, useState } from "react"
import s from "./da.module.css"
import { CARRIERE, CONTACT, COURSES, PILOTE } from "./contenu"
import { TraitVitesse } from "./trait-vitesse"

const ENTREES = [
  { id: "garage", nom: "Garage", sous: "5 machines, travail et maison" },
  { id: "carriere", nom: "Carrière", sous: "le parcours, tour par tour" },
  { id: "pilote", nom: "Pilote", sous: "profil" },
  { id: "radio", nom: "Radio", sous: "contact" },
  { id: "options", nom: "Options", sous: "langue, musique, intro" },
] as const

type IdEntree = (typeof ENTREES)[number]["id"]

export function MenuPrincipal() {
  const [indexActif, setIndexActif] = useState(0)
  useNavigationClavier(setIndexActif)
  const entree = ENTREES[indexActif]

  return (
    <main className={s.racine}>
      <div className={s.fond} />
      <div className={s.oblique} style={{ left: -150 }} />
      <div className={s.grain} />

      <header className={s.hud}>
        <h1 className={`${s.chrome} ${s.marque}`}>
          Hugo Juskowiak<span className={s.tm}>TM</span>
          <span className={s.jp}>{PILOTE.jp}</span>
          <TraitVitesse className={s.trait} />
        </h1>
        <div className={`${s.hudDroit} ${s.mono}`}>
          <span>{PILOTE.fonction.toLowerCase()}</span>
          <span>
            <span className={`${s.pastille} ${s.pastilleActive}`}>FR</span> <span className={s.pastille}>EN</span>
          </span>
          <span>♪ vision (slowed)</span>
        </div>
      </header>

      <nav className={s.menu} aria-label="Menu principal">
        {ENTREES.map((e, i) => (
          <button
            key={e.id}
            className={`${s.entree} ${i === indexActif ? s.entreeActive : ""}`}
            onMouseEnter={() => setIndexActif(i)}
            onFocus={() => setIndexActif(i)}
            aria-current={i === indexActif}
          >
            <span className={s.mono}>0{i + 1}</span>
            <span>
              {e.nom}
              <span className={s.entreeSous}>{e.sous}</span>
            </span>
          </button>
        ))}
      </nav>

      <section className={s.panneau} aria-live="polite">
        <div className={s.bandeau}>
          <span>{entree.nom}</span>
          <span className={s.jp} style={{ color: "#f3daff" }}>{JP[entree.id]}</span>
        </div>
        <Panneau id={entree.id} />
      </section>

      <footer className={`${s.pied} ${s.mono}`}>
        <span className={s.touches}>
          <span><span className={s.touche}>↑↓</span>choisir</span>
          <span><span className={s.touche}>⏎</span>valider</span>
          <span><span className={s.touche}>échap</span>revoir la scène</span>
        </span>
        <span>ref. gt86 · nuit · 2026</span>
      </footer>
    </main>
  )
}

const JP: Record<IdEntree, string> = {
  garage: "ガレージ",
  carriere: "キャリア",
  pilote: "ドライバー",
  radio: "ラジオ",
  options: "オプション",
}

function useNavigationClavier(setIndex: (f: (i: number) => number) => void) {
  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowDown") setIndex((i) => (i + 1) % ENTREES.length)
      if (ev.key === "ArrowUp") setIndex((i) => (i - 1 + ENTREES.length) % ENTREES.length)
    }
    window.addEventListener("keydown", surTouche)
    return () => window.removeEventListener("keydown", surTouche)
  }, [setIndex])
}

function Panneau({ id }: { id: IdEntree }) {
  if (id === "garage") return <Garage />
  if (id === "carriere") return <Carriere />
  if (id === "pilote") return <Pilote />
  if (id === "radio") return <Radio />
  return <Options />
}

function Garage() {
  return (
    <div className={s.garage}>
      {COURSES.map((c) => (
        <a key={c.slug} className={s.voiture} href={`#${c.slug}`}>
          <span className={`${s.jp} ${s.voitureJp}`}>{c.jp}</span>
          <div className={`${s.chrome} ${s.voitureNom}`}>{c.nom}</div>
          <p className={s.voitureTexte}>{c.sousTitre}</p>
          <div className={`${s.fiche} ${s.mono}`}>
            <span>état <b>{c.etat}</b></span>
            <span>piste <b>{c.piste}</b></span>
            <span>{c.periode}</span>
            <span>{c.parc.join(" · ")}</span>
          </div>
        </a>
      ))}
    </div>
  )
}

function Carriere() {
  return (
    <table className={s.tableau}>
      <tbody>
        {CARRIERE.map((etape, i) => (
          <tr key={etape.nom}>
            <td className={s.position}>P{i + 1}</td>
            <td>
              <div className={s.tableauNom}>{etape.nom}</div>
              <div className={s.tableauRole}>{etape.role} · {etape.texte}</div>
            </td>
            <td className={s.mono} style={{ textAlign: "right", whiteSpace: "nowrap" }}>{etape.periode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Pilote() {
  return (
    <div className={s.pilote}>
      <div className={s.piloteImage} role="img" aria-label="Le cockpit de la GT86, de nuit" />
      <dl className={s.licence}>
        <dt className={s.mono}>pilote</dt>
        <dd>{PILOTE.nom}</dd>
        <dt className={s.mono}>catégorie</dt>
        <dd>{PILOTE.fonction}</dd>
        <dt className={s.mono}>base</dt>
        <dd>{PILOTE.base}</dd>
        <dt className={s.mono}>langues</dt>
        <dd>{PILOTE.langues}</dd>
        <dt className={s.mono}>écurie actuelle</dt>
        <dd>UpYourBizz</dd>
      </dl>
    </div>
  )
}

function Radio() {
  return (
    <div className={s.radio}>
      {CONTACT.map((c) => (
        <a key={c.role} className={s.frequence} href={c.href}>
          <span className={s.mono}>{c.role}</span>
          <span className={s.frequenceValeur}>{c.valeur}</span>
        </a>
      ))}
    </div>
  )
}

function Options() {
  return (
    <div className={s.options}>
      <div className={s.option}>
        <span className={s.optionNom}>Langue</span>
        <span className={s.choix}><span className={s.bouton}>Français</span><span className={s.bouton} style={{ opacity: 0.5 }}>English</span></span>
      </div>
      <div className={s.option}>
        <span className={s.optionNom}>Musique</span>
        <span className={s.bouton}>♪ Activée</span>
      </div>
      <div className={s.option}>
        <span className={s.optionNom}>Intro</span>
        <a className={s.bouton} href="/">Revoir la chute</a>
      </div>
    </div>
  )
}
