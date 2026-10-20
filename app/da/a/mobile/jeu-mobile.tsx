"use client"

import { useState, type UIEvent } from "react"
import s from "@/components/nfs/da.module.css"
import { CARRIERE, CONTACT, COURSES, PILOTE } from "@/components/nfs/contenu"
import { TraitVitesse } from "@/components/nfs/trait-vitesse"

const ONGLETS = [
  { id: "garage", nom: "Garage", jp: "ガレージ" },
  { id: "carriere", nom: "Carrière", jp: "キャリア" },
  { id: "pilote", nom: "Pilote", jp: "ドライバー" },
  { id: "radio", nom: "Radio", jp: "ラジオ" },
] as const

type IdOnglet = (typeof ONGLETS)[number]["id"]

const FONDS_COURSES = ["/da/a/3-rue-nuit.jpg", "/da/a/4-habitacle.jpg", "/da/a/2-chute-obliques.jpg", "/da/a/1-ciel.jpg"]

export function JeuMobile() {
  const [demarre, setDemarre] = useState(false)
  const [onglet, setOnglet] = useState<IdOnglet>("garage")

  return (
    <main className={`${s.racine} ${s.mobile}`}>
      {demarre ? (
        <div className={s.jeu}>
          <header className={s.hudMobile}>
            <span className={`${s.chrome} ${s.hudMobileNom}`}>H. Juskowiak<span className={s.tm}>TM</span></span>
            <span className={s.mono}>FR · ♪</span>
          </header>
          <div className={s.ecran}>
            <Ecran onglet={onglet} />
          </div>
          <Dock actif={onglet} choisir={setOnglet} />
        </div>
      ) : (
        <EcranTitre demarrer={() => setDemarre(true)} />
      )}
      <div className={s.grain} />
    </main>
  )
}

function EcranTitre({ demarrer }: { demarrer: () => void }) {
  return (
    <button className={s.titre} onClick={demarrer}>
      <h1 className={`${s.chrome} ${s.titreNom}`}>
        Hugo<br />Juskowiak<span className={s.tm}>TM</span>
        <span className={s.jp}>{PILOTE.jp}</span>
        <TraitVitesse className={s.trait} />
      </h1>
      <span className={`${s.bouton} ${s.commencer}`}>Touche pour commencer</span>
      <span className={`${s.titrePied} ${s.mono}`}>
        <span>{PILOTE.fonction.toLowerCase()}</span>
        <span>© 2026</span>
      </span>
    </button>
  )
}

function Ecran({ onglet }: { onglet: IdOnglet }) {
  if (onglet === "garage") return <Garage />
  if (onglet === "carriere") return <Carriere />
  if (onglet === "pilote") return <Pilote />
  return <Radio />
}

/* Le garage se feuillette au pouce : une course par écran, scroll-snap horizontal,
   jauge segmentée façon stories en haut. */
function Garage() {
  const [indexActif, setIndexActif] = useState(0)
  const suivreDefilement = (ev: UIEvent<HTMLDivElement>) => {
    const el = ev.currentTarget
    setIndexActif(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <>
      <div className={s.segments} aria-hidden>
        {COURSES.map((c, i) => (
          <span key={c.slug} className={`${s.segment} ${i < indexActif ? s.segmentFait : ""} ${i === indexActif ? s.segmentActif : ""}`} />
        ))}
      </div>
      <div className={s.carrousel} onScroll={suivreDefilement}>
        {COURSES.map((c, i) => (
          <article key={c.slug} className={s.carte} style={{ backgroundImage: `url(${FONDS_COURSES[i % FONDS_COURSES.length]})` }}>
            <span className={`${s.jp} ${s.carteJp}`}>{c.jp}</span>
            <span className={s.carteNumero}>0{i + 1}</span>
            <span className={s.mono}>course 0{i + 1} / 0{COURSES.length} · piste {c.piste}</span>
            <h2 className={`${s.chrome} ${s.carteNom}`}>{c.nom}</h2>
            <p className={s.carteTexte}>{c.sousTitre}</p>
            <div className={`${s.carteStats} ${s.mono}`}>
              <div>état<b>{c.etat}</b></div>
              <div>période<b>{c.periode}</b></div>
              <div style={{ gridColumn: "span 2" }}>moteur<b>{c.parc.join(" · ")}</b></div>
            </div>
            <a className={`${s.bouton} ${s.ouvrir}`} href={`#${c.slug}`}>Prendre le volant</a>
          </article>
        ))}
      </div>
    </>
  )
}

function Carriere() {
  return (
    <div className={s.defile}>
      <h2 className={`${s.chrome} ${s.rubrique}`}>Classement</h2>
      {CARRIERE.map((etape, i) => (
        <div key={etape.nom} className={s.tour}>
          <span className={s.position}>P{i + 1}</span>
          <span className={s.tourNom}>{etape.nom}</span>
          <span className={s.tourTexte}>{etape.role}. {etape.texte}</span>
          <span className={s.mono}>{etape.periode}</span>
        </div>
      ))}
    </div>
  )
}

function Pilote() {
  return (
    <div className={s.defile}>
      <h2 className={`${s.chrome} ${s.rubrique}`}>Licence</h2>
      <dl className={s.permis}>
        <div className={s.permisImage} role="img" aria-label="La GT86 en chute dans le couchant" />
        <dt className={s.mono}>pilote</dt>
        <dd>{PILOTE.nom}</dd>
        <dt className={s.mono}>catégorie</dt>
        <dd>{PILOTE.fonction}</dd>
        <dt className={s.mono}>écurie actuelle</dt>
        <dd>UpYourBizz</dd>
        <dt className={s.mono}>base · langues</dt>
        <dd>{PILOTE.base} · {PILOTE.langues}</dd>
      </dl>
    </div>
  )
}

function Radio() {
  return (
    <div className={s.defile}>
      <h2 className={`${s.chrome} ${s.rubrique}`}>Radio</h2>
      {CONTACT.map((c) => (
        <a key={c.role} className={s.appel} href={c.href}>
          <span className={s.mono}>{c.role}</span>
          <b>{c.valeur}</b>
        </a>
      ))}
      <p className={`${s.mono} ${s.pc}`}>la chute complète en 3d se joue sur ordinateur</p>
    </div>
  )
}

function Dock({ actif, choisir }: { actif: IdOnglet; choisir: (id: IdOnglet) => void }) {
  return (
    <nav className={s.dock} aria-label="Menu">
      {ONGLETS.map((o) => (
        <button key={o.id} className={`${s.onglet} ${o.id === actif ? s.ongletActif : ""}`} onClick={() => choisir(o.id)} aria-current={o.id === actif}>
          <span>{o.jp}</span>
          {o.nom}
        </button>
      ))}
    </nav>
  )
}
