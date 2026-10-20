"use client"

import { useState } from "react"
import type { Etape, Fiche, Profil } from "./donnees"
import s from "./cockpit.module.css"

const ECRANS = ["MEDIA", "NAV", "PILOTE", "RADIO"] as const
type Ecran = (typeof ECRANS)[number]
const BOUTONS: Record<Ecran, string> = { MEDIA: "Projets", NAV: "Parcours", PILOTE: "Profil", RADIO: "Contact" }

const ARC_DEG = 270
const ANNEE_MIN = 2020
const ANNEE_MAX = 2026

type Props = { fiches: Fiche[]; trajet: Etape[]; profil: Profil }

export default function Cockpit({ fiches, trajet, profil }: Props) {
  const [ecran, setEcran] = useState<Ecran>("MEDIA")
  const [rang, setRang] = useState(0)
  const fiche = fiches[rang]

  return (
    <main className={s.racine}>
      <div className={s.pareBrise} aria-hidden />
      <header className={s.bandeauHaut}>
        <a className={s.mention} href="/">↺ revoir la scène</a>
        <span className={s.mention}>♪ VISION (Slowed) · 34,5 s</span>
        <span className={s.mention}>FR / EN</span>
      </header>

      <div className={s.enseigne}>
        <h1 className={s.chrome}>Hugo Juskowiak<span className={s.tm}>TM</span></h1>
        <span className={s.jp}>ユゴー・ユスコヴィアク</span>
        <span className={s.role}>{profil.role}</span>
      </div>

      <section className={s.planche}>
        <Cadran
          valeur={(fiche.annee - ANNEE_MIN) / (ANNEE_MAX - ANNEE_MIN)}
          graduations={[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(String)}
          legende="Année de départ"
          lecture={fiche.periode}
        />
        <div className={s.ecranCadre}>
          <div className={s.ecran}>
            <div className={s.ecranTitre}>
              <span>AMP · {ecran}</span>
              <span>{profil.statut}</span>
            </div>
            <div className={s.ecranCorps}>
              {ecran === "MEDIA" && <Media fiches={fiches} rang={rang} choisir={setRang} />}
              {ecran === "NAV" && <Route trajet={trajet} />}
              {ecran === "PILOTE" && <Pilote profil={profil} />}
              {ecran === "RADIO" && <Radio profil={profil} />}
            </div>
            <div className={s.ecranPied} role="tablist">
              {ECRANS.map((nom) => (
                <button key={nom} className={s.onglet} role="tab" aria-selected={ecran === nom} onClick={() => setEcran(nom)}>
                  {nom}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Cadran
          valeur={rang / (fiches.length - 1)}
          graduations={fiches.map((_, i) => String(i + 1))}
          legende="Piste"
          lecture={`${String(rang + 1).padStart(2, "0")} / ${String(fiches.length).padStart(2, "0")}`}
        />
      </section>

      <nav className={s.console} aria-label="Sections">
        {ECRANS.map((nom) => (
          <button key={nom} className={s.bouton} aria-pressed={ecran === nom} onClick={() => setEcran(nom)}>
            <span className={s.voyant} />
            {BOUTONS[nom]}
          </button>
        ))}
      </nav>
      <div className={`${s.temoins} ${s.mention}`} aria-hidden>
        <span className={s.temoin}><i style={{ background: "#8f5cff" }} />maison</span>
        <span className={s.temoin}><i style={{ background: "#e561d3" }} />travail</span>
        <span className={s.temoin}><i style={{ background: "#3bd06b" }} />en service</span>
      </div>

      <div className={s.grain} aria-hidden />
      <div className={s.vignette} aria-hidden />
    </main>
  )
}

/* Un cadran blanc rétroéclairé à aiguille violette, comme le combiné de l'habitacle. */
function Cadran({ valeur, graduations, legende, lecture }: { valeur: number; graduations: string[]; legende: string; lecture: string }) {
  const angleDe = (fraction: number) => -ARC_DEG / 2 + fraction * ARC_DEG
  const pas = graduations.length - 1
  return (
    <div className={s.cadran}>
      <svg viewBox="0 0 200 200" aria-hidden>
        <defs>
          <radialGradient id="fond" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#e9e2f4" />
            <stop offset="100%" stopColor="#b9a8d8" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill="#05030a" />
        <circle cx="100" cy="100" r="92" fill="none" stroke="#a86bff" strokeWidth="1.5" opacity="0.8" />
        <circle cx="100" cy="100" r="86" fill="url(#fond)" />
        {Array.from({ length: pas * 4 + 1 }, (_, i) => {
          const majeure = i % 4 === 0
          return (
            <line
              key={i}
              x1="100" y1={majeure ? 20 : 24} x2="100" y2="30"
              stroke={i > pas * 3.4 ? "#e60302" : "#1a1022"}
              strokeWidth={majeure ? 2.2 : 1}
              transform={`rotate(${angleDe(i / (pas * 4))} 100 100)`}
            />
          )
        })}
        {graduations.map((texte, i) => {
          const rad = ((angleDe(i / pas) - 90) * Math.PI) / 180
          return (
            <text key={texte + i} x={100 + Math.cos(rad) * 56} y={100 + Math.sin(rad) * 56 + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1a1022" fontFamily="var(--f-mono)">
              {texte.length > 2 ? texte.slice(2) : texte}
            </text>
          )
        })}
        <g className={s.aiguille} style={{ transform: `rotate(${angleDe(valeur)}deg)` }}>
          <polygon points="98,104 102,104 100.6,22 99.4,22" fill="#8a5cff" />
        </g>
        <circle cx="100" cy="100" r="11" fill="#1a1022" stroke="#a86bff" strokeWidth="2" />
      </svg>
      <div className={s.cadranLegende}>
        {legende}
        <b>{lecture}</b>
      </div>
    </div>
  )
}

function Media({ fiches, rang, choisir }: { fiches: Fiche[]; rang: number; choisir: (rang: number) => void }) {
  const fiche = fiches[rang]
  const piste = (f: Fiche) => {
    const i = fiches.indexOf(f)
    return (
      <li key={f.slug}>
        <button className={s.piste} aria-current={i === rang} onClick={() => choisir(i)}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <span>{f.nom}</span>
        </button>
      </li>
    )
  }
  return (
    <div className={s.media}>
      <ul className={s.pistes}>
        <li className={s.groupe}>PROJETS</li>
        {fiches.filter((f) => !f.formation).map(piste)}
        <li className={s.groupe}>FORMATIONS</li>
        {fiches.filter((f) => f.formation).map(piste)}
      </ul>
      <article className={s.fiche}>
        <h2 className={s.chrome}>{fiche.nom}</h2>
        <span className={s.jp}>{fiche.jp}</span>
        <p>{fiche.sousTitre}</p>
        <div className={s.tuiles}>
          <div className={s.tuile}>Cadre<b>{fiche.cadre}</b></div>
          <div className={s.tuile}>Période<b>{fiche.periode}</b></div>
          <div className={s.tuile}>État<b>{fiche.etat}</b></div>
        </div>
        <div className={s.puces}>
          {fiche.parc.map((outil) => <span key={outil} className={s.puce}>{outil}</span>)}
        </div>
      </article>
    </div>
  )
}

function Route({ trajet }: { trajet: Etape[] }) {
  return (
    <ol className={s.route}>
      {trajet.map((e) => (
        <li key={e.nom + e.annee} className={`${s.etape} ${e.travail ? s.etapeTravail : ""}`}>
          <small>{e.annee}{e.lieu ? ` · ${e.lieu}` : ""}</small>
          <b>{e.nom}</b> · {e.fonction}
        </li>
      ))}
    </ol>
  )
}

function Pilote({ profil }: { profil: Profil }) {
  return (
    <>
      <dl className={s.spec}>
        {profil.spec.map(([cle, valeur]) => (
          <div key={cle} style={{ display: "contents" }}>
            <dt>{cle}</dt>
            <dd>{valeur}</dd>
          </div>
        ))}
      </dl>
      <p style={{ fontSize: 12, lineHeight: 1.5, margin: 0 }}>{profil.corps}</p>
    </>
  )
}

function Radio({ profil }: { profil: Profil }) {
  return (
    <div className={s.radio}>
      {profil.liens.map(([cle, texte, href]) => (
        <a key={cle} className={s.station} href={href}>
          <span>{cle}</span>
          <span>{texte}</span>
          <span>▸</span>
        </a>
      ))}
    </div>
  )
}
