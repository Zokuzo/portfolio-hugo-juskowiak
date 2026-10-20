import type { Metadata } from "next"
import s from "./night.module.css"
import { CHAPITRES, CONTACTS, COURSES, EMPLOYEURS, ETUDES, PROFIL } from "./donnees"

export const metadata: Metadata = { title: "Night drive | Hugo Juskowiak" }

const PROJETS_EN_ROUTE = COURSES.filter((c) => c.unite.startsWith("U-"))

export default function NightDriveDesktop() {
  return (
    <main className={s.page}>
      <Bandes />
      <Hub />
      <Courses />
      <Trajet />
      <Pilote />
      <Radio />
    </main>
  )
}

function Bandes() {
  return (
    <>
      <div className={s.bandeHaut} aria-hidden>
        <span>REC ● NIGHT DRIVE</span>
        <span>夜のドライブ</span>
        <span>34.5 S · VISION (SLOWED)</span>
      </div>
      <div className={s.bandeBas} aria-hidden>
        <span>HUGOJSK</span>
        <span>♪ MUSIQUE</span>
      </div>
      <div className={s.grain} aria-hidden />
    </>
  )
}

function Hub() {
  return (
    <section className={s.hub}>
      <img className={s.hubFond} src="/da/b/rue.png" alt="" />
      <div className={s.hubVoile} />
      <div className={s.hubTitre}>
        <p className={s.mention}>contact mis · phares allumés</p>
        <h1 className={s.chrome}>
          HUGO<br />JUSKOWIAK<sup>TM</sup>
        </h1>
        <p className={s.kata}>ユゴー・ユスコヴィアク</p>
        <p className={s.role}>Ingénieur Full Stack &amp; IA</p>
      </div>
      <nav className={s.panneaux} aria-label="Chapitres">
        {CHAPITRES.map((c) => (
          <a key={c.num} href={`#${c.ancre}`} className={s.panneau}>
            <span className={s.panneauNum}>{c.num}</span>
            <span className={s.panneauNom}>{c.nom}</span>
            <span className={s.panneauJp}>{c.jp}</span>
            <span className={s.panneauLeg}>{c.legende}</span>
          </a>
        ))}
      </nav>
    </section>
  )
}

function EnTete({ num, nom, jp }: { num: string; nom: string; jp: string }) {
  return (
    <header className={s.enTete}>
      <span className={s.enTeteNum}>{num}</span>
      <h2 className={s.enTeteNom}>{nom}</h2>
      <span className={s.enTeteJp}>{jp}</span>
    </header>
  )
}

function Courses() {
  return (
    <section id="courses" className={s.chapitre}>
      <EnTete num="01" nom="COURSES" jp="レース" />
      <div className={s.enseignes}>
        {PROJETS_EN_ROUTE.map((p) => (
          <a key={p.slug} href="#" className={`${s.enseigne} ${p.courant ? s.enseigneCourante : ""}`}>
            <span className={s.enseigneJp}>{p.jp}</span>
            <span className={s.enseigneMeta}>{p.unite} · {p.cadre}</span>
            <strong className={s.enseigneNom}>{p.nom}</strong>
            <span className={s.enseigneSous}>{p.sousTitre}</span>
            <span className={s.enseigneEtat}>{p.etat} · {p.periode}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

function Trajet() {
  return (
    <section id="trajet" className={s.chapitre}>
      <EnTete num="02" nom="TRAJET" jp="経路" />
      <ol className={s.route}>
        {EMPLOYEURS.map((e) => (
          <li key={e.slug} className={s.borne}>
            <span className={s.bornePeriode}>{e.periode}</span>
            <strong className={s.borneNom}>{e.nom}</strong>
            <span className={s.borneFonction}>{e.fonction} · {e.lieu}</span>
          </li>
        ))}
        {ETUDES.map((e) => (
          <li key={e.code} className={`${s.borne} ${s.borneEtude}`}>
            <span className={s.bornePeriode}>{e.code}</span>
            <strong className={s.borneNom}>{e.nom}</strong>
            <span className={s.borneFonction}>{e.intitule}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Pilote() {
  return (
    <section id="pilote" className={`${s.chapitre} ${s.pilote}`}>
      <EnTete num="03" nom="PILOTE" jp="ドライバー" />
      <div className={s.piloteGrille}>
        <figure className={s.habitacle}>
          <img src="/da/b/habitacle.png" alt="L'habitacle de la GT86 de l'intro" />
        </figure>
        <div>
          <p className={s.piloteCorps}>{PROFIL.corps}</p>
          <p className={s.piloteTexte}>{PROFIL.chute}</p>
          <p className={s.piloteTexte}>{PROFIL.design}</p>
          <dl className={s.jauges}>
            {PROFIL.champs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function Radio() {
  return (
    <section id="radio" className={`${s.chapitre} ${s.radio}`}>
      <EnTete num="04" nom="RADIO" jp="無線" />
      <div className={s.plaque}>
        <span className={s.plaqueEtat}>California</span>
        <span className={s.plaqueTexte}>HUGOJSK</span>
      </div>
      <ul className={s.frequences}>
        {CONTACTS.map(([label, valeur, href]) => (
          <li key={label}>
            <a href={href} className={s.bouton}>
              <span>{label}</span> {valeur}
            </a>
          </li>
        ))}
      </ul>
      <p className={s.mention}>↺ revoir la scène</p>
    </section>
  )
}
