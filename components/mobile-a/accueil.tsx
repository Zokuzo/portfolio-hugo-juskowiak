"use client"

import { useState, type ComponentType } from "react"
import { Turntable } from "@lucasmarkes/hairline/react"
import { ArrowRight, Briefcase, Call, Code, FilePdf, GraduationCap, House, LinkSquare, Routing, Sms, type IconProps } from "reicon-react"
import type { Projet } from "@/components/proto/projets"
import { CARRIERE, CONTACT, PILOTE } from "@/components/nfs/contenu"
import { FlipText } from "@/components/obsidian/a-flip-text"
import { MusicCard } from "@/components/obsidian/a-music-card"
import type { Aller } from "./carplay-poche"
import { Plaque } from "./carplay-poche"
import s from "./carplay.module.css"

type App = { nom: string; Icone: ComponentType<IconProps>; teinte: string } & ({ vue: Parameters<Aller>; href?: never } | { href: string; vue?: never })

const EN_POSTE = CARRIERE[0]
const lienContact =(role: string) => CONTACT.find((c) => c.role === role)?.href ?? "#"

const APPS: App[] = [
  { nom: "Projets", Icone: Code, teinte: s.teinteRose, vue: ["work", "Projets"] },
  { nom: "Parcours", Icone: Routing, teinte: s.teinteViolet, vue: ["work", "Parcours"] },
  { nom: "Atelier", Icone: House, teinte: s.teinteOr, vue: ["maison", "Atelier"] },
  { nom: "Cursus", Icone: GraduationCap, teinte: s.teinteVert, vue: ["maison", "Cursus"] },
  { nom: "Contact", Icone: Call, teinte: s.teinteNuit, vue: ["contact"] },
  { nom: "Mail", Icone: Sms, teinte: s.teinteBleu, href: lienContact("E-mail") },
  { nom: "LinkedIn", Icone: LinkSquare, teinte: s.teinteBleu, href: lienContact("LinkedIn") },
  { nom: "CV", Icone: FilePdf, teinte: s.teinteBlanc, href: lienContact("CV") },
]

export function Accueil({ aller, travail, maison }: { aller: Aller; travail: Projet[]; maison: Projet[] }) {
  return (
    <div className={s.page}>
      <section className={s.hero}>
        <span className={`${s.kicker} ${s.mono}`}>Écran de bord · ナビ</span>
        <h1 className={s.vitesse}>
          <FlipText duration={2.4} loop={false}>{PILOTE.nom}</FlipText>
        </h1>
        <span className={`${s.heroJp} ${s.jp}`}>{PILOTE.jp}</span>
        <p className={s.heroFonction}>{PILOTE.fonction}</p>
        <p className={s.heroTexte}>En poste chez {EN_POSTE.nom} : {EN_POSTE.texte} Choisis une destination.</p>
      </section>

      <section>
        <div className={s.titreSection}>
          <h2>Destination</h2>
          <span className={s.mono}>{PILOTE.base}</span>
        </div>
        <div className={s.destinations}>
          <button className={s.destination} data-accent="rose" onClick={() => aller("work")}>
            <span className={`${s.icone} ${s.iconePetite} ${s.teinteRose}`}><Briefcase size={24} weight="Filled" /></span>
            <span className={`${s.destinationJp} ${s.jp}`}>仕事</span>
            <strong className={s.vitesse}>WORK</strong>
            <small>{travail.length} projets pro, le parcours</small>
          </button>
          <button className={s.destination} onClick={() => aller("maison")}>
            <span className={`${s.icone} ${s.iconePetite} ${s.teinteViolet}`}><House size={24} weight="Filled" /></span>
            <span className={`${s.destinationJp} ${s.jp}`}>家</span>
            <strong className={s.vitesse}>MAISON</strong>
            <small>{maison.length} fiches perso, l&apos;atelier et les cursus</small>
          </button>
        </div>
      </section>

      <section>
        <div className={s.titreSection}><h2>Apps</h2></div>
        <div className={s.apps}>
          {APPS.map((app) => <IconeApp key={app.nom} app={app} aller={aller} />)}
        </div>
      </section>

      <Radio />

      <footer className={s.pied}>
        <Plaque />
        <span className={s.mono}>la chute de la GT86 en 3D se joue sur ordinateur</span>
      </footer>
    </div>
  )
}

function IconeApp({ app, aller }: { app: App; aller: Aller }) {
  const contenu = (
    <>
      <span className={`${s.icone} ${app.teinte}`}><app.Icone size={28} weight="Filled" /></span>
      <span>{app.nom}</span>
    </>
  )
  if (app.href) {
    const externe = app.href.startsWith("http")
    return <a className={s.app} href={app.href} {...(externe ? { target: "_blank", rel: "noreferrer" } : {})}>{contenu}</a>
  }
  return <button className={s.app} onClick={() => aller(...app.vue!)}>{contenu}</button>
}

/* La radio de bord : la platine Hairline sert de jaquette et tourne
   quand on lance la lecture. Aucun son : c'est un clin d'œil, pas un lecteur. */
function Radio() {
  const [enLecture, setEnLecture] = useState(false)
  return (
    <section>
      <div className={s.titreSection}>
        <h2>En écoute</h2>
        <span className={s.mono}>ラジオ <ArrowRight size={11} className="inline" /></span>
      </div>
      <MusicCard
        titre="Night Drive"
        artiste="Radio GT86"
        enLecture={enLecture}
        basculer={() => setEnLecture((l) => !l)}
        jaquette={<Turntable play={enLecture} intensity={0.8} label="Platine de la radio de bord" />}
      />
    </section>
  )
}
