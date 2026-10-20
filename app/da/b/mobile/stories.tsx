"use client"

import { useRef, useState } from "react"
import s from "./mobile.module.css"

export type Story =
  | { genre: "titre" }
  | {
      genre: "course"
      jp: string
      nom: string
      meta: string
      sous: string
      etat: string
      contexte: string
      decisions: string[]
    }
  | { genre: "trajet"; bornes: { periode: string; nom: string; fonction: string }[] }
  | { genre: "pilote"; corps: string; champs: readonly (readonly [string, string])[] }
  | { genre: "radio"; liens: readonly (readonly string[])[] }

/* Navigation propre au téléphone : on glisse au pouce de chapitre en
   chapitre (scroll-snap horizontal), on touche le bord droit ou gauche
   pour avancer ou reculer, et dans une course on glisse vers le haut
   pour ouvrir la fiche (scroll-snap vertical). La jauge du haut suit. */
export default function Stories({ stories }: { stories: Story[] }) {
  const piste = useRef<HTMLDivElement>(null)
  const [courante, setCourante] = useState(0)

  function suivreDefilement() {
    const el = piste.current
    if (el) setCourante(Math.round(el.scrollLeft / el.clientWidth))
  }

  function aller(index: number) {
    const el = piste.current
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" })
  }

  return (
    <main className={s.ecran}>
      <div className={s.jauge} aria-hidden>
        {stories.map((_, i) => (
          <span key={i} className={i <= courante ? s.segmentPlein : s.segment} />
        ))}
      </div>
      <div className={s.compteur}>
        {String(courante + 1).padStart(2, "0")} / {String(stories.length).padStart(2, "0")}
      </div>
      <div ref={piste} className={s.piste} onScroll={suivreDefilement}>
        {stories.map((story, i) => (
          <section key={i} className={s.story}>
            <ContenuStory story={story} />
            <button className={s.zoneGauche} aria-label="Chapitre précédent" onClick={() => aller(i - 1)} />
            <button className={s.zoneDroite} aria-label="Chapitre suivant" onClick={() => aller(i + 1)} />
          </section>
        ))}
      </div>
      <div className={s.grain} aria-hidden />
    </main>
  )
}

function ContenuStory({ story }: { story: Story }) {
  switch (story.genre) {
    case "titre":
      return <Titre />
    case "course":
      return <Course {...story} />
    case "trajet":
      return <Trajet bornes={story.bornes} />
    case "pilote":
      return <Pilote corps={story.corps} champs={story.champs} />
    case "radio":
      return <Radio liens={story.liens} />
  }
}

function Titre() {
  return (
    <div className={s.titre}>
      <img className={s.titreFond} src="/da/b/rue.png" alt="" />
      <div className={s.titreVoile} />
      <p className={s.mention}>夜のドライブ · night drive</p>
      <h1 className={s.chrome}>
        HUGO<br />JUSKO<br />WIAK<sup>TM</sup>
      </h1>
      <p className={s.kata}>ユゴー・ユスコヴィアク</p>
      <p className={s.role}>Ingénieur Full Stack &amp; IA</p>
      <p className={s.start}>GLISSE POUR DÉMARRER ›</p>
    </div>
  )
}

function Course(p: Extract<Story, { genre: "course" }>) {
  return (
    <div className={s.verticale}>
      <div className={s.affiche}>
        <span className={s.afficheJp}>{p.jp}</span>
        <div className={s.afficheBas}>
          <span className={s.meta}>{p.meta}</span>
          <h2 className={s.afficheNom}>{p.nom}</h2>
          <p className={s.afficheSous}>{p.sous}</p>
          <p className={s.etat}>{p.etat}</p>
          <p className={s.ouvrir}>︿ glisse vers le haut : la fiche</p>
        </div>
      </div>
      <div className={s.fiche}>
        <span className={s.meta}>{p.nom} · fiche</span>
        <p className={s.ficheTexte}>{p.contexte}</p>
        <ol className={s.decisions}>
          {p.decisions.map((d, i) => (
            <li key={d}>
              <span>{String(i + 1).padStart(2, "0")}</span> {d}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function Trajet({ bornes }: { bornes: { periode: string; nom: string; fonction: string }[] }) {
  return (
    <div className={s.panneauChapitre}>
      <span className={s.chapitreJp}>経路</span>
      <h2 className={s.chapitreNom}>TRAJET</h2>
      <ol className={s.bornes}>
        {bornes.map((b) => (
          <li key={b.nom + b.periode}>
            <span className={s.meta}>{b.periode}</span>
            <strong>{b.nom}</strong>
            <span>{b.fonction}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Pilote({ corps, champs }: { corps: string; champs: readonly (readonly [string, string])[] }) {
  return (
    <div className={s.panneauChapitre}>
      <img className={s.piloteFond} src="/da/b/habitacle.png" alt="" />
      <span className={s.chapitreJp}>ドライバー</span>
      <h2 className={s.chapitreNom}>PILOTE</h2>
      <p className={s.ficheTexte}>{corps}</p>
      <dl className={s.champs}>
        {champs.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Radio({ liens }: { liens: readonly (readonly string[])[] }) {
  return (
    <div className={s.panneauChapitre}>
      <span className={s.chapitreJp}>無線</span>
      <h2 className={s.chapitreNom}>RADIO</h2>
      <div className={s.plaque}>
        <span>California</span>
        <strong>HUGOJSK</strong>
      </div>
      <div className={s.boutons}>
        {liens.map(([label, valeur, href]) => (
          <a key={label} href={href} className={s.bouton}>
            <span>{label}</span>
            {valeur}
          </a>
        ))}
      </div>
      <p className={s.mention}>la version complète roule sur PC</p>
    </div>
  )
}
