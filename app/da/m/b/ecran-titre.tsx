"use client"

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode, type UIEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, ArrowUpRight, Briefcase, Car, DocumentDownload, Global, Home, Sms, X } from "reicon-react"
import {
  Branches, Cabinet, Dish, Hub, Plot, Query, Sieve, Stack, Terminal, Terrain,
  type HairlineProps,
} from "@lucasmarkes/hairline/react"
import type { Projet } from "@/components/proto/projets"
import type { Employeur } from "@/components/proto/parcours"
import { MagnetTabs, type OngletAimante } from "@/components/obsidian/b-magnet-tabs"
import { FlipText } from "@/components/obsidian/b-flip-text"
import { GlowingScrollIndicator } from "@/components/obsidian/b-glowing-scroll-indicator"
import s from "./b.module.css"

export type Contact = { role: string; valeur: string; href: string }

type Props = { work: Projet[]; maison: Projet[]; employeurs: Employeur[]; contacts: Contact[] }

type Vue = "accueil" | "work" | "maison" | "contact"

const ONGLETS: (OngletAimante & { id: Vue })[] = [
  { id: "accueil", libelle: "Départ", icone: <Car size={20} /> },
  { id: "work", libelle: "Work", icone: <Briefcase size={20} /> },
  { id: "maison", libelle: "Maison", icone: <Home size={20} /> },
  { id: "contact", libelle: "Radio", icone: <Sms size={20} /> },
]

/* Une figure Hairline par fiche, choisie pour ce que le projet FAIT :
   le hub multi-tenant, le tamis des exports, la baie mémoire... */
const FIGURES: Record<string, ComponentType<HairlineProps>> = {
  "reach-up": Hub,
  octo: Sieve,
  "prediction-memoire": Cabinet,
  eternal: Terrain,
  "trading-agent": Plot,
  cpge: Stack,
  estia: Branches,
  hokkaido: Dish,
  mbds: Query,
}

const PREFIXE_FICHE = "#fiche/"

/* L'adresse porte l'écran : le bouton retour du téléphone marche, et
   chaque vue se partage par lien (#work, #fiche/reach-up). */
function useAncre() {
  return useSyncExternalStore(
    (notifier) => {
      window.addEventListener("hashchange", notifier)
      return () => window.removeEventListener("hashchange", notifier)
    },
    () => window.location.hash,
    () => "",
  )
}

function lireVue(ancre: string): Vue {
  const id = ancre.slice(1)
  return ONGLETS.some((o) => o.id === id) ? (id as Vue) : "accueil"
}

const aller = (ancre: string) => {
  window.location.hash = ancre
}

export function EcranTitre({ work, maison, employeurs, contacts }: Props) {
  const ancre = useAncre()
  const slugFiche = ancre.startsWith(PREFIXE_FICHE) ? ancre.slice(PREFIXE_FICHE.length) : undefined
  const fiche = [...work, ...maison].find((p) => p.slug === slugFiche)
  /* Sous une fiche ouverte, le fond reste la vue à laquelle elle appartient. */
  const vue: Vue = fiche ? (work.includes(fiche) ? "work" : "maison") : lireVue(ancre)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [vue])

  const ouvrir = (slug: string) => aller(PREFIXE_FICHE + slug)
  const fermer = () => aller(vue)

  return (
    <main className={s.racine}>
      <header className={s.entete}>
        <span className={s.plaque}>HUGOJSK</span>
        <span className={s.mono}>{ONGLETS.find((o) => o.id === vue)?.libelle} · メニュー</span>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={vue}
          className={s.vue}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {vue === "accueil" && <Accueil />}
          {vue === "work" && <VueWork projets={work} employeurs={employeurs} ouvrir={ouvrir} />}
          {vue === "maison" && <VueMaison projets={maison} ouvrir={ouvrir} />}
          {vue === "contact" && <VueContact contacts={contacts} />}
        </motion.div>
      </AnimatePresence>

      <nav className={s.barre} aria-label="Menu principal">
        <MagnetTabs slug="b-nav" options={ONGLETS} actif={vue} choisir={(id) => aller(id === "accueil" ? "" : id)} />
      </nav>

      <AnimatePresence>{fiche && <Fiche key={fiche.slug} projet={fiche} fermer={fermer} />}</AnimatePresence>
    </main>
  )
}

/* ---------- ACCUEIL : l'écran-titre ---------- */

function Accueil() {
  return (
    <>
      <section className={s.titre}>
        <span className={s.jp}>ユゴー・ユスコヴィアク</span>
        <h1 className={s.nom}>
          Hugo
          <br />
          Juskowiak
        </h1>
        <p className={s.fonction}>
          <FlipText duree={3.2}>Ingénieur Full Stack & IA</FlipText>
        </p>
        <p className={s.chapo}>
          Je construis des produits SaaS de bout en bout, du schéma PostgreSQL au routage entre modèles d&apos;IA.
          Aujourd&apos;hui chez UpYourBizz.
        </p>
      </section>

      <MenuJeu
        lignes={[
          { cle: "work", jp: "仕事", titre: "Work", texte: "Expériences et projets pro", agir: () => aller("work") },
          { cle: "maison", jp: "家", titre: "Maison", texte: "Atelier perso et cursus", agir: () => aller("maison") },
          { cle: "contact", jp: "無線", titre: "Radio", texte: "Me contacter", agir: () => aller("contact") },
        ]}
      />

      <p className={s.indice}>
        <Car size={16} /> Sur ordinateur, la GT86 vous conduit en 3D
      </p>
    </>
  )
}

type LigneMenu = { cle: string; jp: string; titre: string; texte: string; agir: () => void }

/* La sélection façon menu de jeu : une seule ligne allumée à la fois,
   elle suit le doigt (pointer) et le clavier (focus). */
function MenuJeu({ lignes }: { lignes: LigneMenu[] }) {
  const [active, setActive] = useState(0)
  return (
    <ol className={s.menu}>
      {lignes.map((ligne, i) => (
        <li key={ligne.cle}>
          <button
            type="button"
            className={`${s.ligne} ${i === active ? s.ligneActive : ""}`}
            onPointerEnter={() => setActive(i)}
            onPointerDown={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={ligne.agir}
          >
            <span className={s.ligneNumero}>0{i + 1}</span>
            <span className={s.ligneCorps}>
              <span className={s.ligneTitre}>{ligne.titre}</span>
              <span className={s.ligneTexte}>{ligne.texte}</span>
            </span>
            <span className={s.ligneJp}>{ligne.jp}</span>
            <ArrowRight size={20} className={s.ligneFleche} />
          </button>
        </li>
      ))}
    </ol>
  )
}

/* ---------- WORK ---------- */

function VueWork({ projets, employeurs, ouvrir }: { projets: Projet[]; employeurs: Employeur[]; ouvrir: (slug: string) => void }) {
  return (
    <>
      <Rubrique titre="Work" jp="仕事" compte={`${projets.length} projets · ${employeurs.length} employeurs`} />
      <Garage projets={projets} ouvrir={ouvrir} />

      <h3 className={s.sousRubrique}>Classement</h3>
      <ol className={s.classement}>
        {employeurs.map((e, i) => (
          <li key={e.slug} className={`${s.tour} ${e.courant ? s.tourCourant : ""}`}>
            <span className={s.position}>P{i + 1}</span>
            <span className={s.tourCorps}>
              <span className={s.tourNom}>{e.nom}</span>
              <span className={s.tourRole}>{e.fonction}</span>
              <span className={s.mono}>{e.periode}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  )
}

/* ---------- MAISON ---------- */

function VueMaison({ projets, ouvrir }: { projets: Projet[]; ouvrir: (slug: string) => void }) {
  const atelier = projets.filter((p) => p.genre !== "formation")
  const cursus = projets.filter((p) => p.genre === "formation")
  return (
    <>
      <Rubrique titre="Maison" jp="家" compte={`${atelier.length} projets · ${cursus.length} cursus`} />
      <Garage projets={atelier} ouvrir={ouvrir} />

      <h3 className={s.sousRubrique}>Cursus</h3>
      <MenuJeu
        lignes={cursus.map((c) => ({ cle: c.slug, jp: c.jp, titre: c.nom, texte: c.periode, agir: () => ouvrir(c.slug) }))}
      />
    </>
  )
}

function Rubrique({ titre, jp, compte }: { titre: string; jp: string; compte: string }) {
  return (
    <div className={s.rubrique}>
      <h2 className={s.rubriqueTitre}>{titre}</h2>
      <span className={s.rubriqueJp}>{jp}</span>
      <span className={s.mono}>{compte}</span>
    </div>
  )
}

/* Le garage : les cartes défilent au pouce. Seule la carte au centre
   anime sa figure : neuf figures en boucle à la fois, c'est du CPU pour
   rien et un écran qui ne dit plus où regarder. */
function Garage({ projets, ouvrir }: { projets: Projet[]; ouvrir: (slug: string) => void }) {
  const piste = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const suivre = (ev: UIEvent<HTMLDivElement>) => {
    const el = ev.currentTarget
    const pas = el.scrollWidth / projets.length
    setActive(Math.min(projets.length - 1, Math.round(el.scrollLeft / pas)))
  }

  return (
    <>
      <div ref={piste} className={s.garage} onScroll={suivre}>
        {projets.map((p, i) => (
          <CarteProjet key={p.slug} projet={p} active={i === active} ouvrir={() => ouvrir(p.slug)} />
        ))}
      </div>
      {projets.length > 1 && (
        <div className={s.jauge}>
          <span className={s.mono}>
            {String(active + 1).padStart(2, "0")} / {String(projets.length).padStart(2, "0")}
          </span>
          <GlowingScrollIndicator conteneur={piste} />
        </div>
      )}
    </>
  )
}

function CarteProjet({ projet, active, ouvrir }: { projet: Projet; active: boolean; ouvrir: () => void }) {
  return (
    <article className={`${s.carte} ${active ? s.carteActive : ""}`}>
      <div className={s.carteFigure}>
        <Figure slug={projet.slug} play={active} />
        <span className={s.carteJp}>{projet.jp}</span>
      </div>
      <div className={s.carteCorps}>
        <span className={s.mono}>
          {projet.unite} · {projet.etat}
        </span>
        <h3 className={s.carteNom}>{projet.nom}</h3>
        <p className={s.carteTexte}>{projet.sousTitre}</p>
        <button type="button" className={s.bouton} onClick={ouvrir}>
          Ouvrir la fiche <ArrowRight size={18} />
        </button>
      </div>
    </article>
  )
}

function Figure({ slug, play }: { slug: string; play: boolean }) {
  const Composant = FIGURES[slug] ?? Terminal
  return <Composant className={s.figure} theme="dark" intensity={0.7} play={play} />
}

/* ---------- FICHE ---------- */

function Fiche({ projet, fermer }: { projet: Projet; fermer: () => void }) {
  const estFormation = projet.genre === "formation"

  useEffect(() => {
    const fermerAuClavier = (ev: KeyboardEvent) => ev.key === "Escape" && fermer()
    window.addEventListener("keydown", fermerAuClavier)
    document.documentElement.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", fermerAuClavier)
      document.documentElement.style.overflow = ""
    }
  }, [fermer])

  return (
    <motion.div
      className={s.fiche}
      role="dialog"
      aria-modal
      aria-label={projet.nom}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", bounce: 0.08, duration: 0.42 }}
    >
      <div className={s.ficheBarre}>
        <span className={s.mono}>{projet.unite} · fiche</span>
        <button type="button" className={s.fermer} onClick={fermer} aria-label="Fermer la fiche">
          <X size={22} />
        </button>
      </div>

      <div className={s.ficheFigure}>
        <Figure slug={projet.slug} play />
      </div>

      <span className={s.jp}>{projet.jp}</span>
      <h2 className={s.ficheNom}>{projet.nom}</h2>
      <p className={s.ficheSous}>{projet.sousTitre}</p>

      <dl className={s.specs}>
        <Spec terme="Cadre">{projet.cadre}</Spec>
        <Spec terme="Période">{projet.periode}</Spec>
        <Spec terme="État">{projet.etat}</Spec>
      </dl>

      <Bloc titre="Contexte">
        <p>{insecable(projet.contexte)}</p>
      </Bloc>

      {projet.contraintes.length > 0 && (
        <Bloc titre={estFormation ? "Programme" : "Contraintes"}>
          <ul className={s.puces}>
            {projet.contraintes.map((c) => (
              <li key={c}>{insecable(c)}</li>
            ))}
          </ul>
        </Bloc>
      )}

      {projet.decisions.length > 0 && (
        <Bloc titre={estFormation ? "Travaux" : "Décisions"}>
          <ol className={s.decisions}>
            {projet.decisions.map((d, i) => (
              <li key={d.titre}>
                <span className={s.decisionNumero}>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <b>{d.titre}</b>
                  {insecable(d.texte)}
                </span>
              </li>
            ))}
          </ol>
        </Bloc>
      )}

      {projet.resultat && (
        <Bloc titre="Résultat">
          <p>{insecable(projet.resultat)}</p>
        </Bloc>
      )}

      {projet.parc.length > 0 && (
        <Bloc titre={estFormation ? "Outils" : "Moteur"}>
          <ul className={s.puces2}>
            {projet.parc.map((outil) => (
              <li key={outil}>{outil}</li>
            ))}
          </ul>
        </Bloc>
      )}

      {projet.prevu && (
        <Bloc titre="Prévu">
          <ul className={s.puces}>
            {projet.prevu.map((p) => (
              <li key={p}>{insecable(p)}</li>
            ))}
          </ul>
        </Bloc>
      )}

      <button type="button" className={`${s.bouton} ${s.boutonLarge}`} onClick={fermer}>
        Retour au menu
      </button>
    </motion.div>
  )
}

/* Typographie française : la ponctuation haute ne part pas seule à la ligne. */
function insecable(texte: string) {
  return texte.replace(/ ([:;!?])/g, "\u00a0$1")
}

function Spec({ terme, children }: { terme: string; children: ReactNode }) {
  return (
    <div>
      <dt className={s.mono}>{terme}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className={s.bloc}>
      <h3 className={s.blocTitre}>{titre}</h3>
      {children}
    </section>
  )
}

/* ---------- CONTACT ---------- */

const ICONES_CONTACT = [Sms, Global, DocumentDownload]

function VueContact({ contacts }: { contacts: Contact[] }) {
  return (
    <>
      <Rubrique titre="Radio" jp="無線" compte={`${contacts.length} canaux`} />
      <p className={s.chapo}>Un poste, un projet, une question technique : la ligne est ouverte.</p>
      <ul className={s.appels}>
        {contacts.map((c, i) => {
          const Icone = ICONES_CONTACT[i] ?? Global
          const externe = c.href.startsWith("http")
          return (
            <li key={c.role}>
              <a className={s.appel} href={c.href} {...(externe ? { target: "_blank", rel: "noreferrer" } : {})}>
                <span className={s.appelIcone}>
                  <Icone size={22} />
                </span>
                <span className={s.appelCorps}>
                  <span className={s.mono}>{c.role}</span>
                  <b>{c.valeur}</b>
                </span>
                <ArrowUpRight size={20} />
              </a>
            </li>
          )
        })}
      </ul>
    </>
  )
}
