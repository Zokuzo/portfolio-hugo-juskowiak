"use client"

import { useEffect, useRef, useState } from "react"
import s from "./da.module.css"
import { CARRIERE, CONTACT, COURSES, PILOTE } from "./contenu"
import { TraitVitesse } from "./trait-vitesse"
import { joue } from "./sons"

/* LE MENU PRINCIPAL façon Need for Speed, dans la DA A (écran-titre).
   Deux destinations en tête, MAISON et WORK : les valider lance le départ
   (la GT86 accélère dans la rue quand la 3D est là, le volet en biais
   seul sinon). Les cinq rubriques suivantes s'ouvrent dans le panneau.
   Clavier : ↑↓ pour choisir, ⏎ pour valider ; souris : survol et clic. */

export type Piste = "maison" | "work"

const ENTREES = [
  { id: "maison", nom: "Maison", sous: "portfolio maison · atelier, cursus, hors piste", jp: "ホーム" },
  { id: "work", nom: "Work", sous: "portfolio travail · écuries, méthode, réglages", jp: "ワーク" },
  { id: "garage", nom: "Garage", sous: "5 machines", jp: "ガレージ" },
  { id: "carriere", nom: "Carrière", sous: "le parcours", jp: "キャリア" },
  { id: "pilote", nom: "Pilote", sous: "profil", jp: "ドライバー" },
  { id: "radio", nom: "Radio", sous: "contact", jp: "ラジオ" },
  { id: "options", nom: "Options", sous: "langue, musique, intro", jp: "オプション" },
] as const

type IdEntree = (typeof ENTREES)[number]["id"]

const estPiste = (id: IdEntree): id is Piste => id === "maison" || id === "work"

/* la validation : écrasement puis rebond (recette 3), et le menu file à
   gauche avant que le départ ne prenne l'écran */
const REBOND: Keyframe[] = [{ transform: "scale(1)" }, { transform: "scale(0.96)", offset: 0.3 }, { transform: "scale(1)" }]
const REBOND_MS = 310
const SORTIE_MS = 280

type Props = {
  surDestination: (piste: Piste) => void
  /* "scene" : posé sur la 3D (fond transparent) ; "seul" : plein écran */
  variante: "scene" | "seul"
  surRejoue?: () => void
}

export function MenuNfs({ surDestination, variante, surRejoue }: Props) {
  const [indexActif, setIndexActif] = useState(0)
  const [sortant, setSortant] = useState(false)
  const [flash, setFlash] = useState(0)
  const boutons = useRef<(HTMLButtonElement | null)[]>([])
  const entree = ENTREES[indexActif]

  const choisit = (i: number) => {
    if (i === indexActif) return
    joue("tic")
    setIndexActif(i)
  }

  const valide = (i: number) => {
    if (sortant) return
    const id = ENTREES[i].id
    joue("valide")
    boutons.current[i]?.animate(REBOND, { duration: REBOND_MS, easing: "cubic-bezier(.34,1.56,.64,1)" })
    setFlash((n) => n + 1)
    setIndexActif(i)
    if (!estPiste(id)) return
    setSortant(true)
    setTimeout(() => surDestination(id), SORTIE_MS)
  }

  useNavigationClavier({ index: indexActif, choisit, valide })

  return (
    <main className={`${s.racine} ${variante === "scene" ? s.enScene : ""} ${sortant ? s.sortant : ""}`}>
      {variante === "seul" && <div className={s.fond} />}
      {variante === "seul" && <div className={s.oblique} style={{ left: -150 }} />}
      {variante === "scene" && <div className={s.voileGauche} />}
      <div className={s.grain} />

      <header className={s.hud}>
        <h1 className={`${s.chrome} ${s.marque}`}>
          Hugo Juskowiak<span className={s.tm}>TM</span>
          <span className={s.jp}>{PILOTE.jp}</span>
          <TraitVitesse className={s.trait} />
        </h1>
        <div className={`${s.hudDroit} ${s.mono}`}>
          <span className={s.chantier}>work in progress</span>
          <span>{PILOTE.fonction.toLowerCase()}</span>
          <span>
            <span className={`${s.pastille} ${s.pastilleActive}`}>FR</span> <span className={s.pastille}>EN</span>
          </span>
        </div>
      </header>

      <nav className={s.menu} aria-label="Menu principal">
        {ENTREES.map((e, i) => (
          <button
            key={e.id}
            ref={(b) => {
              boutons.current[i] = b
            }}
            type="button"
            data-nfs={e.id}
            className={`${s.entree} ${estPiste(e.id) ? s.entreeDestination : ""} ${i === indexActif ? s.entreeActive : ""}`}
            onMouseEnter={() => choisit(i)}
            onFocus={() => choisit(i)}
            onClick={() => valide(i)}
            aria-current={i === indexActif}
          >
            <span className={s.mono}>0{i + 1}</span>
            <span className={s.entreeTexte}>
              {e.nom}
              <span className={s.entreeSous}>{e.sous}</span>
            </span>
          </button>
        ))}
      </nav>

      <section className={s.panneau} aria-live="polite">
        <div className={s.bandeau}>
          <span>{entree.nom}</span>
          <span className={s.jp} style={{ color: "#f3daff" }}>{entree.jp}</span>
        </div>
        <Panneau id={entree.id} surDepart={() => valide(indexActif)} surRejoue={surRejoue} />
      </section>

      <footer className={`${s.pied} ${s.mono}`}>
        <span className={s.touches}>
          <span><span className={s.touche}>↑↓</span>choisir</span>
          <span><span className={s.touche}>⏎</span>valider</span>
        </span>
        <span>ref. gt86 · nuit · 2026</span>
      </footer>
      {flash > 0 && <div key={flash} className={s.flash} aria-hidden />}
    </main>
  )
}

/* les gestes vivent dans une ref : l'écouteur est posé UNE fois, et lit
   toujours l'index et les actions du dernier rendu */
function useNavigationClavier(actions: { index: number; choisit: (i: number) => void; valide: (i: number) => void }) {
  const courant = useRef(actions)
  courant.current = actions
  useEffect(() => {
    const surTouche = (ev: KeyboardEvent) => {
      const { index, choisit, valide } = courant.current
      if (ev.key === "ArrowDown") choisit((index + 1) % ENTREES.length)
      else if (ev.key === "ArrowUp") choisit((index - 1 + ENTREES.length) % ENTREES.length)
      else if (ev.key === "Enter" && !(ev.target instanceof HTMLButtonElement)) valide(index)
      else return
      ev.preventDefault()
    }
    window.addEventListener("keydown", surTouche)
    return () => window.removeEventListener("keydown", surTouche)
  }, [])
}

function Panneau({ id, surDepart, surRejoue }: { id: IdEntree; surDepart: () => void; surRejoue?: () => void }) {
  if (estPiste(id)) return <Epreuve piste={id} surDepart={surDepart} />
  if (id === "garage") return <Garage />
  if (id === "carriere") return <Carriere />
  if (id === "pilote") return <Pilote />
  if (id === "radio") return <Radio />
  return <Options surRejoue={surRejoue} />
}

/* la carte d'épreuve (Unbound) : ce qui attend au bout de la route */
const EPREUVES: Record<Piste, { titre: string; texte: string; etapes: string[] }> = {
  maison: {
    titre: "Portfolio maison",
    texte: "Ce que je construis seul, ce que j'ai étudié, et ce qui se passe hors du travail.",
    etapes: ["Atelier", "Cursus", "Hors piste", "Radio"],
  },
  work: {
    titre: "Portfolio work",
    texte: "Les écuries où j'ai roulé, la méthode tour par tour, et les réglages de la machine.",
    etapes: ["Écuries", "Méthode", "Réglages", "Radio"],
  },
}

function Epreuve({ piste, surDepart }: { piste: Piste; surDepart: () => void }) {
  const e = EPREUVES[piste]
  const machines = COURSES.filter((c) => c.piste === (piste === "work" ? "travail" : "maison"))
  return (
    <div className={s.epreuve}>
      <div className={`${s.chrome} ${s.epreuveTitre}`}>{e.titre}</div>
      <p className={s.voitureTexte}>{e.texte}</p>
      <ol className={s.etapes}>
        {e.etapes.map((etape, i) => (
          <li key={etape}>
            <span className={s.mono}>CP{i + 1}</span>
            {etape}
          </li>
        ))}
      </ol>
      <div className={`${s.fiche} ${s.mono}`}>
        <span>machines <b>{machines.length}</b></span>
        <span>{machines.map((c) => c.nom).join(" · ")}</span>
      </div>
      <button type="button" className={`${s.bouton} ${s.demarrer}`} onClick={surDepart}>
        <span>Démarrer ⏎</span>
      </button>
    </div>
  )
}

function Garage() {
  return (
    <div className={s.garage}>
      {COURSES.map((c) => (
        <div key={c.slug} className={s.voiture}>
          <span className={`${s.jp} ${s.voitureJp}`}>{c.jp}</span>
          <div className={`${s.chrome} ${s.voitureNom}`}>{c.nom}</div>
          <p className={s.voitureTexte}>{c.sousTitre}</p>
          <div className={`${s.fiche} ${s.mono}`}>
            <span>état <b>{c.etat}</b></span>
            <span>piste <b>{c.piste}</b></span>
            <span>{c.periode}</span>
          </div>
        </div>
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

function Options({ surRejoue }: { surRejoue?: () => void }) {
  return (
    <div className={s.options}>
      <div className={s.option}>
        <span className={s.optionNom}>Langue</span>
        <span className={s.choix}><span className={s.bouton}>Français</span><span className={s.bouton} style={{ opacity: 0.5 }}>English</span></span>
      </div>
      <div className={s.option}>
        <span className={s.optionNom}>Intro</span>
        {surRejoue ? (
          <button type="button" className={s.bouton} onClick={surRejoue}>Revoir la chute</button>
        ) : (
          <a className={s.bouton} href="/">Revoir la chute</a>
        )}
      </div>
    </div>
  )
}
