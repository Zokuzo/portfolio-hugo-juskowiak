"use client"

import Image from "next/image"
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react"
import { useEffect, useState, type ComponentType, type ReactNode } from "react"
import {
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Code,
  DocumentDownload,
  Global,
  GraduationCap,
  Home2,
  House,
  SearchNormal,
  Sms,
  Xmark,
} from "reicon-react"
import {
  Branches,
  Cabinet,
  Drawer,
  Hub,
  Laptop,
  Plot,
  Plug,
  Query,
  Riffle,
  Sieve,
  Terrain,
  Turntable,
  type HairlineProps,
} from "@lucasmarkes/hairline/react"
import { AppleSpotlight, type ResultatSpotlight } from "@/components/obsidian/c-apple-spotlight"
import { FlipText } from "@/components/obsidian/c-flip-text"
import { FolderPreview } from "@/components/obsidian/c-folder-preview"
import { CARRIERE, CONTACT, PILOTE } from "@/components/nfs/contenu"
import { t } from "@/components/proto/dict"
import { SLUGS_MAISON } from "@/components/proto/mondes"
import { projets, SLUGS_TRAVAIL, type Projet } from "@/components/proto/projets"
import s from "./c.module.css"

/* PISTE C : « Clair, iOS d'abord ». Une seule page, quatre vues et une
   feuille. La vue et la fiche ouverte vivent dans l'ancre (#work,
   #maison/eternal) : le geste retour du téléphone referme la fiche ou
   revient à la vue d'avant, sans routeur à écrire. */

const LANGUE = "fr"
const PLAQUE = "HUGOJSK"
const SEUIL_FERMETURE_PX = 120

const VUES = ["accueil", "work", "maison", "contact"] as const
type Vue = (typeof VUES)[number]

const TOUS = projets(LANGUE)
const parSlug = (slug: string) => TOUS.find((p) => p.slug === slug)
const PROJETS_TRAVAIL = SLUGS_TRAVAIL.map(parSlug).filter((p): p is Projet => Boolean(p))
const PROJETS_MAISON = SLUGS_MAISON.map(parSlug).filter((p): p is Projet => Boolean(p))
const ATELIER = PROJETS_MAISON.filter((p) => p.genre !== "formation")
const CURSUS = PROJETS_MAISON.filter((p) => p.genre === "formation")
/* Une étape du parcours est une formation quand son nom commence comme celui
   d'une fiche cursus (« CPGE TSI » / « CPGE ») ; le reste est l'expérience pro. */
const EXPERIENCES = CARRIERE.filter((e) => !CURSUS.some((c) => e.nom.startsWith(c.nom)))

type Figure = ComponentType<HairlineProps>

/* Une figure Hairline par fiche, choisie pour ce qu'elle dessine. */
const FIGURE_PAR_SLUG: Record<string, Figure> = {
  "reach-up": Hub,
  octo: Sieve,
  "prediction-memoire": Cabinet,
  eternal: Riffle,
  "trading-agent": Plot,
  cpge: Query,
  estia: Branches,
  hokkaido: Terrain,
  mbds: Drawer,
}

export function PortfolioC() {
  const { vue, slug, aller } = useAdresse()
  const [recherche, setRecherche] = useState(false)
  const fiche = slug ? parSlug(slug) : undefined

  const ouvrirFiche = (cible: string) => aller(vue, cible)
  const choisirRecherche = (id: string) => {
    setRecherche(false)
    if (VUES.includes(id as Vue)) aller(id as Vue)
    else ouvrirFiche(id)
  }

  return (
    <div className={s.racine}>
      {/* Le fond du document suit la page : sans ça, le rebond iOS montre le noir du socle. */}
      <style>{`html,body{background:#f2f2f7}`}</style>
      <main className={s.vue}>
        <BarreHaute chercher={() => setRecherche(true)} />
        {vue === "accueil" && <Accueil aller={aller} />}
        {vue === "work" && <Work ouvrir={ouvrirFiche} />}
        {vue === "maison" && <Maison ouvrir={ouvrirFiche} />}
        {vue === "contact" && <Contact />}
      </main>

      <Onglets actif={vue} aller={aller} />

      <AnimatePresence>{fiche && <Feuille key={fiche.slug} projet={fiche} fermer={() => aller(vue)} />}</AnimatePresence>

      <AppleSpotlight
        ouvert={recherche}
        fermer={() => setRecherche(false)}
        resultats={RESULTATS_RECHERCHE}
        raccourcis={RACCOURCIS}
        choisir={choisirRecherche}
        invite="Un projet, une techno…"
      />
    </div>
  )
}

/* L'ancre est la source de vérité ; React n'en garde qu'une copie lue. */
function useAdresse() {
  const [adresse, setAdresse] = useState<{ vue: Vue; slug?: string }>({ vue: "accueil" })

  useEffect(() => {
    const lire = () => {
      const [v, slug] = window.location.hash.slice(1).split("/")
      setAdresse({ vue: VUES.includes(v as Vue) ? (v as Vue) : "accueil", slug: slug || undefined })
    }
    lire()
    window.addEventListener("hashchange", lire)
    return () => window.removeEventListener("hashchange", lire)
  }, [])

  const aller = (vue: Vue, slug?: string) => {
    if (vue !== adresse.vue) window.scrollTo({ top: 0 })
    window.location.hash = slug ? `${vue}/${slug}` : vue
  }

  return { ...adresse, aller }
}

const RESULTATS_RECHERCHE: ResultatSpotlight[] = TOUS.map((p) => ({
  id: p.slug,
  icone: p.genre === "formation" ? <GraduationCap size={20} /> : <Code size={20} />,
  libelle: p.nom,
  description: `${p.cadre} · ${p.periode}`,
  motsCles: `${p.sousTitre} ${p.parc.join(" ")}`,
}))

const RACCOURCIS = [
  { id: "work", icone: <Briefcase size={24} />, libelle: "Work" },
  { id: "maison", icone: <House size={24} />, libelle: "Maison" },
  { id: "contact", icone: <Sms size={24} />, libelle: "Contact" },
]

function BarreHaute({ chercher }: { chercher: () => void }) {
  return (
    <header className={s.haut}>
      <Plaque />
      <button type="button" className={s.rond} onClick={chercher} aria-label="Rechercher un projet">
        <SearchNormal size={22} color="#1c1c1e" />
      </button>
    </header>
  )
}

function Plaque() {
  return (
    <span className={s.plaque} aria-label={`Plaque ${PLAQUE}`}>
      {PLAQUE}
    </span>
  )
}

function GrandTitre({ surtitre, jp, titre, chapo }: { surtitre: string; jp?: string; titre: ReactNode; chapo?: string }) {
  return (
    <>
      <p className={s.surtitre}>
        {surtitre}
        {jp && <b> · {jp}</b>}
      </p>
      <h1 className={s.titre}>{titre}</h1>
      {chapo && <p className={s.chapo}>{chapo}</p>}
    </>
  )
}

function Scene({ figure: FigureHairline, legende, valeur, label }: { figure: Figure; legende: string; valeur: string; label: string }) {
  return (
    <div className={`${s.carte} ${s.scene}`}>
      <FigureHairline className={s.figure} theme="light" play intensity={0.7} label={label} />
      <div className={s.legende}>
        <span>{legende}</span>
        <b>{valeur}</b>
      </div>
    </div>
  )
}

function EnTete({ titre, jp }: { titre: string; jp?: string }) {
  return (
    <h2 className={s.enTete}>
      {titre}
      {jp && <span>{jp}</span>}
    </h2>
  )
}

/* ==== ACCUEIL ==== */

function Accueil({ aller }: { aller: (vue: Vue) => void }) {
  /* La désignation redit le titre de la page, et la fonction suit le poste
     affiché en tête pour que les deux ne se contredisent pas. */
  const fiches = t(LANGUE, "spec")
    .filter(([cle]) => cle !== "Désignation")
    .map(([cle, valeur]) => [cle, cle === "Fonction" ? t(LANGUE, "gt86Titre") : valeur] as const)
  return (
    <>
      <GrandTitre
        surtitre={t(LANGUE, "status")}
        titre={<FlipText loop={false} duration={1.6}>{PILOTE.nom}</FlipText>}
        chapo={`${t(LANGUE, "gt86Titre")} chez ${EXPERIENCES[0]?.nom}. Du schéma de données à l'interface, avec de l'IA dedans.`}
      />

      <section className={s.section}>
        <EnTete titre="Où va-t-on ?" jp="どこへ行く" />
        <ol className={s.trajet}>
          <li className={`${s.arret} ${s.arretActif}`}>
            <Destination
              nom="WORK"
              jp="ワーク"
              texte={`${EXPERIENCES.length} expériences\n${PROJETS_TRAVAIL.length} projets pro`}
              figure={Laptop}
              aller={() => aller("work")}
            />
          </li>
          <li className={s.arret}>
            <Destination
              nom="MAISON"
              jp="ホーム"
              texte={`${ATELIER.length} projets perso\n${CURSUS.length} étapes de cursus`}
              figure={Turntable}
              aller={() => aller("maison")}
            />
          </li>
        </ol>
      </section>

      <section className={s.section}>
        <EnTete titre="Fiche pilote" />
        <div className={s.groupe}>
          {fiches.map(([cle, valeur]) => (
            <div key={cle} className={`${s.ligne} ${s.ligneSansIcone}`}>
              <span className={s.ligneCorps}>
                <span className={s.ligneSous}>{cle}</span>
                <span className={s.ligneTitre}>{valeur}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <Signature />
    </>
  )
}

function Destination({ nom, jp, texte, figure: FigureHairline, aller }: { nom: string; jp: string; texte: string; figure: Figure; aller: () => void }) {
  return (
    <button type="button" className={`${s.carte} ${s.destination}`} onClick={aller}>
      <span className={s.ligneCorps}>
        <span className={s.destinationNom}>{nom}</span>
        <span className={s.destinationJp}>{jp}</span>
        <span className={s.destinationTexte}>{texte}</span>
      </span>
      <FigureHairline className={s.figurePetite} theme="light" play intensity={0.6} aria-hidden />
      <ChevronRight size={20} color="#c7c7cc" />
    </button>
  )
}

function Signature() {
  return (
    <footer className={s.signature}>
      <Plaque />
      <span>La version complète, avec la GT86 en 3D, se conduit sur ordinateur.</span>
    </footer>
  )
}

/* ==== WORK ==== */

function Work({ ouvrir }: { ouvrir: (slug: string) => void }) {
  return (
    <>
      <GrandTitre surtitre="Destination" jp="ワーク" titre="Work" chapo="Le parcours pro, du plus récent au plus ancien, puis les projets ouverts en fiche." />

      <section className={s.section}>
        <EnTete titre="Expériences" jp="キャリア" />
        <ol className={s.trajet}>
          {EXPERIENCES.map((e, i) => (
            <li key={e.nom} className={`${s.arret} ${i === 0 ? s.arretActif : ""}`}>
              <Experience nom={e.nom} role={e.role} periode={e.periode} texte={e.texte} ouvrir={ouvrir} />
            </li>
          ))}
        </ol>
      </section>

      <section className={s.section}>
        <EnTete titre="Projets" jp="プロジェクト" />
        <div className={s.projets}>
          {PROJETS_TRAVAIL.map((p) => (
            <CarteProjet key={p.slug} projet={p} ouvrir={() => ouvrir(p.slug)} />
          ))}
        </div>
      </section>
    </>
  )
}

function Experience({ nom, role, periode, texte, ouvrir }: { nom: string; role: string; periode: string; texte: string; ouvrir: (slug: string) => void }) {
  const fiches = TOUS.filter((p) => p.cadre === nom)
  return (
    <div className={`${s.carte} ${s.experience}`}>
      <div className={s.experienceHaut}>
        <span className={s.experienceNom}>{nom}</span>
        <span className={s.experiencePeriode}>{periode}</span>
      </div>
      <div className={s.experienceRole}>{role}</div>
      <div className={s.experienceTexte}>{texte}</div>
      {fiches.length > 0 && (
        <div className={s.puces}>
          {fiches.map((p) => (
            <button key={p.slug} type="button" className={`${s.puce} ${s.puceAction}`} onClick={() => ouvrir(p.slug)}>
              {p.nom}
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CarteProjet({ projet, ouvrir }: { projet: Projet; ouvrir: () => void }) {
  const FigureHairline = FIGURE_PAR_SLUG[projet.slug] ?? Hub
  return (
    <button type="button" className={`${s.carte} ${s.projet}`} onClick={ouvrir}>
      <div className={s.projetScene}>
        <FigureHairline className={s.figure} theme="light" play intensity={0.6} aria-hidden />
      </div>
      <div className={s.projetCorps}>
        <div className={s.projetMeta}>
          {projet.cadre} · {projet.etat}
        </div>
        <h3 className={s.projetNom}>{projet.nom}</h3>
        <p className={s.projetSous}>{projet.sousTitre}</p>
        <div className={s.projetPied}>
          <span>Ouvrir la fiche</span>
          <ChevronRight size={18} />
        </div>
      </div>
    </button>
  )
}

/* ==== MAISON ==== */

function Maison({ ouvrir }: { ouvrir: (slug: string) => void }) {
  return (
    <>
      <GrandTitre surtitre="Destination" jp="ホーム" titre="Maison" chapo="Ce que je construis pour moi, et le chemin d'école qui y mène." />

      <Scene figure={Turntable} legende="Hors travail" valeur={t(LANGUE, "offdutyName")} label="Des blocs sur un plateau tournant" />

      <section className={s.section}>
        <EnTete titre="Atelier" jp="アトリエ" />
        <Dossiers projets={ATELIER} ouvrir={ouvrir} />
      </section>

      <section className={s.section}>
        <EnTete titre="Cursus" jp="学歴" />
        <Dossiers projets={CURSUS} ouvrir={ouvrir} />
      </section>
    </>
  )
}

function Dossiers({ projets: liste, ouvrir }: { projets: Projet[]; ouvrir: (slug: string) => void }) {
  return (
    <div className={s.dossiers}>
      {liste.map((p, i) => (
        <Dossier key={p.slug} projet={p} rang={i} ouvrir={() => ouvrir(p.slug)} />
      ))}
    </div>
  )
}

const DELAI_ENTROUVERT_MS = 500
const DUREE_ENTROUVERT_MS = 1100
const DELAI_OUVERTURE_FICHE_MS = 220

/* Au doigt, pas de survol : le dossier s'entrouvre une fois à l'arrivée
   pour montrer qu'il contient quelque chose, et s'ouvre sous le doigt. */
function Dossier({ projet, rang, ouvrir }: { projet: Projet; rang: number; ouvrir: () => void }) {
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => {
    const debut = window.setTimeout(() => setOuvert(true), DELAI_ENTROUVERT_MS + rang * 160)
    const fin = window.setTimeout(() => setOuvert(false), DELAI_ENTROUVERT_MS + rang * 160 + DUREE_ENTROUVERT_MS)
    return () => {
      window.clearTimeout(debut)
      window.clearTimeout(fin)
    }
  }, [rang])

  const toucher = () => {
    setOuvert(true)
    window.setTimeout(ouvrir, DELAI_OUVERTURE_FICHE_MS)
  }

  return (
    <button type="button" className={`${s.carte} ${s.dossier}`} onClick={toucher} onPointerDown={() => setOuvert(true)} onPointerLeave={() => setOuvert(false)}>
      <FolderPreview fichiers={projet.parc} ouvert={ouvert} marque={projet.jp} />
      <span>
        <span className={s.dossierNom}>{projet.nom}</span>
        <span className={`${s.dossierSous} block`}>{projet.periode}</span>
      </span>
    </button>
  )
}

/* ==== CONTACT ==== */

const ICONE_CONTACT: Record<string, ReactNode> = {
  "E-mail": <Sms size={18} />,
  LinkedIn: <Global size={18} />,
  CV: <DocumentDownload size={18} />,
}

function Contact() {
  return (
    <>
      <GrandTitre surtitre="Radio" jp="ラジオ" titre="Contact" chapo={t(LANGUE, "offdutyDesc")} />

      <Scene figure={Plug} legende="Basé en" valeur={PILOTE.base} label="Une prise et sa fiche dessinées au trait" />

      <section className={s.section}>
        <EnTete titre="Me joindre" />
        <div className={s.groupe}>
          {CONTACT.map((c) => (
            <a key={c.role} className={s.ligne} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              <span className={s.pastille}>{ICONE_CONTACT[c.role] ?? <ArrowUpRight size={18} />}</span>
              <span className={s.ligneCorps}>
                <span className={s.ligneTitre}>{c.role}</span>
                <span className={`${s.ligneSous} truncate`}>{c.valeur}</span>
              </span>
              <ArrowUpRight size={18} color="#c7c7cc" />
            </a>
          ))}
        </div>
        <p className={s.pied}>Langues : {PILOTE.langues}</p>
      </section>

      <Signature />
    </>
  )
}

/* ==== FEUILLE (fiche) ==== */

function Feuille({ projet, fermer }: { projet: Projet; fermer: () => void }) {
  const poignee = useDragControls()
  const FigureHairline = FIGURE_PAR_SLUG[projet.slug] ?? Hub
  const formation = projet.genre === "formation"

  useEffect(() => {
    const avant = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = avant
    }
  }, [])

  const lacher = (_: unknown, info: PanInfo) => {
    if (info.offset.y > SEUIL_FERMETURE_PX) fermer()
  }

  return (
    <>
      <motion.div className={s.voile} onClick={fermer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.section
        className={s.feuille}
        role="dialog"
        aria-modal
        aria-label={projet.nom}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 40 }}
        drag="y"
        dragListener={false}
        dragControls={poignee}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={lacher}
      >
        <div className={s.feuilleHaut} onPointerDown={(e) => poignee.start(e)}>
          <span className={s.poignee} />
          <span className={`${s.projetMeta} ${s.fermer}`}>{projet.unite} · {projet.jp}</span>
          <button type="button" className={`${s.rond} ${s.fermer}`} onClick={fermer} aria-label="Fermer la fiche">
            <Xmark size={20} color="#3a3a3c" />
          </button>
        </div>

        <div className={s.feuilleCorps}>
          <h1 className={s.titre} style={{ fontSize: 34, marginTop: 4 }}>{projet.nom}</h1>
          <p className={s.chapo}>{projet.sousTitre}</p>

          <Scene figure={FigureHairline} legende={projet.cadre} valeur={projet.periode} label={projet.nom} />

          <BlocFiche titre="Contexte">
            <p className={s.prose}>{projet.contexte}</p>
          </BlocFiche>

          <BlocFiche titre={formation ? "Programme" : "Contraintes"}>
            <ul className={s.liste}>
              {projet.contraintes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </BlocFiche>

          <BlocFiche titre={formation ? "Ce que j'en retiens" : "Décisions"}>
            {projet.decisions.map((d) => (
              <div key={d.titre} className={s.decision}>
                <h3>{d.titre}</h3>
                <p>{d.texte}</p>
              </div>
            ))}
          </BlocFiche>

          {projet.captures && projet.captures.length > 0 && (
            <section className={s.section}>
              <EnTete titre="Captures" />
              {projet.captures.map((c) => (
                <figure key={c.src} style={{ margin: 0 }}>
                  <Image className={s.capture} src={c.src} alt={c.alt} width={1600} height={900} sizes="100vw" />
                  <figcaption className={s.captureLegende}>{c.legende}</figcaption>
                </figure>
              ))}
            </section>
          )}

          {projet.resultat && (
            <BlocFiche titre="Résultat">
              <p className={s.prose}>{projet.resultat}</p>
            </BlocFiche>
          )}

          <section className={s.section}>
            <EnTete titre="Parc" />
            <div className={s.puces} style={{ marginTop: 0 }}>
              {projet.parc.map((techno) => (
                <span key={techno} className={s.puce} style={{ background: "#fff" }}>
                  {techno}
                </span>
              ))}
            </div>
          </section>

          {projet.prevu && (
            <BlocFiche titre="Prévu">
              <ul className={s.liste}>
                {projet.prevu.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </BlocFiche>
          )}
        </div>
      </motion.section>
    </>
  )
}

function BlocFiche({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <EnTete titre={titre} />
      <div className={s.groupe}>{children}</div>
    </section>
  )
}

/* ==== ONGLETS ==== */

const ONGLETS: { vue: Vue; libelle: string; Icone: typeof Home2 }[] = [
  { vue: "accueil", libelle: "Accueil", Icone: Home2 },
  { vue: "work", libelle: "Work", Icone: Briefcase },
  { vue: "maison", libelle: "Maison", Icone: House },
  { vue: "contact", libelle: "Contact", Icone: Sms },
]

function Onglets({ actif, aller }: { actif: Vue; aller: (vue: Vue) => void }) {
  return (
    <nav className={s.onglets} aria-label="Sections">
      {ONGLETS.map(({ vue, libelle, Icone }) => (
        <button
          key={vue}
          type="button"
          className={`${s.onglet} ${vue === actif ? s.ongletActif : ""}`}
          onClick={() => aller(vue)}
          aria-current={vue === actif ? "page" : undefined}
        >
          <Icone size={26} weight={vue === actif ? "Filled" : "Outline"} />
          {libelle}
        </button>
      ))}
    </nav>
  )
}
