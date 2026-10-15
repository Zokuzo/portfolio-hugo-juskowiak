import type { CSSProperties, ReactNode } from "react"

/* PROTOTYPE JETABLE (#60), 2e tour : trois cartes titre du seuil tirées
   du Pinterest de Hugo (la typographie de marque japonaise 1998-2006),
   commutables par ?police=h|i|j sur / (h par défaut). Chaque carte pose
   le nom et le titre dans sa propre composition ; « Cliquez pour
   démarrer » et « retour » reprennent son habit. Verdict à l'œil de
   Hugo, puis seule la gagnante rejoint scene.tsx et ce fichier disparaît
   avec les polices perdantes du layout.

   Les familles viennent de app/layout.tsx (next/font) : --f-vitesse
   (Saira, axe wdth et italique), --f-etendue (Michroma), --f-display
   (Archivo, axe wdth), --f-mono (JetBrains Mono), --f-jp (Noto Sans JP). */

type Textes = { nom: string; titre: string }

/* `bouton` porte famille, graisse, habit et couleurs, jamais la taille :
   elle reste celle de chaque bouton dans scene.tsx */
type Police = {
  Carte: (textes: Textes) => ReactNode
  bouton: CSSProperties
}
type Cle = "h" | "i" | "j"

/* le nom en katakana, à la japonaise : Hugo à la française (ユゴー, comme
   Victor Hugo), Juskowiak à la polonaise (le J se dit Y) */
const NOM_KATAKANA = "ユゴー・ユスコヴィアク"

const MAJUSCULES: CSSProperties = { textTransform: "uppercase" }

/* ---------------------------------------------------------------------
   H : ÉCRAN-TITRE. L'italique de vitesse chromée d'une pochette PS1
   (GLARE) et le katakana collé sous le logo (MERCURY) : Saira étirée à
   125 %, chrome bleu acier à reflet dur, trait de vitesse effilé ; en
   bas, le titre à gauche et la référence de catalogue à droite.
   --------------------------------------------------------------------- */

const ACIER_CLAIR = "#eef4ff"
const ACIER_BLEU = "#8fb0ff"
const BLEU_NUIT = "#0c1430"

/* le chrome liquide : ciel clair en haut, reflet blanc dur posé sur une
   ligne d'horizon sombre à mi-hauteur, retour au bleu acier en bas */
const CHROME = `linear-gradient(180deg, #ffffff 0%, #b4c6ee 30%, #ffffff 47%, #1b2754 50%, #3c5aa8 60%, #8fb0ff 82%, #e4eeff 100%)`

function CarteEcranTitre({ nom, titre }: Textes) {
  return (
    <div style={{ display: "inline-grid", justifyItems: "start", textAlign: "left" }}>
      {/* le liseré sombre et la lueur sur l'enveloppe, pas sur le texte :
          un filter posé sur l'élément en background-clip:text le repeint
          en aplat clair dans Chrome (vu au seuil) */}
      <div
        style={{
          position: "relative",
          paddingRight: "0.9em",
          filter: `drop-shadow(0 1px 0 ${BLEU_NUIT}) drop-shadow(0 0 22px rgba(96, 140, 255, 0.45))`,
        }}
      >
        <div
          style={{
            ...MAJUSCULES,
            font: "italic 800 clamp(44px, 6.6vw, 108px)/0.92 var(--f-vitesse)",
            fontStretch: "125%",
            letterSpacing: "0.01em",
            background: CHROME,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            /* la lueur héritée de la planche (text-shadow clair) peindrait
               par-dessous des glyphes transparents et noierait le chrome */
            textShadow: "none",
          }}
        >
          {nom}
        </div>
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "0.5em",
            right: 0,
            font: "500 clamp(10px, 0.9vw, 14px)/1 var(--f-vitesse)",
            color: ACIER_CLAIR,
          }}
        >
          TM
        </span>
      </div>
      <TraitDeVitesse />
      <div
        aria-hidden
        style={{
          marginTop: 10,
          paddingLeft: "0.4em",
          font: "500 clamp(13px, 1.25vw, 20px)/1 var(--f-jp)",
          letterSpacing: "0.32em",
          color: ACIER_BLEU,
        }}
      >
        {NOM_KATAKANA}
      </div>
      <div
        style={{
          alignSelf: "stretch",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 32,
          marginTop: 26,
          paddingLeft: "0.4em",
        }}
      >
        <span
          style={{
            ...MAJUSCULES,
            font: "400 clamp(11px, 1vw, 15px)/1 var(--f-vitesse)",
            fontStretch: "125%",
            letterSpacing: "0.3em",
            color: ACIER_CLAIR,
          }}
        >
          {titre}
        </span>
        <span aria-hidden style={{ font: "500 10px/1 var(--f-mono)", letterSpacing: "0.12em", color: `${ACIER_BLEU}b0` }}>
          SLUS-00086
        </span>
      </div>
    </div>
  )
}

/* le trait de vitesse : un fil qui part fin à gauche, s'épaissit sous le
   nom et s'effile à droite, en chrome lui aussi */
function TraitDeVitesse() {
  return (
    <svg aria-hidden viewBox="0 0 1000 20" preserveAspectRatio="none" style={{ width: "100%", height: 16, marginTop: 6, display: "block" }}>
      <defs>
        <linearGradient id="vitesse" x1="0" x2="1">
          <stop offset="0" stopColor={ACIER_BLEU} stopOpacity="0" />
          <stop offset="0.35" stopColor={ACIER_CLAIR} />
          <stop offset="1" stopColor={ACIER_BLEU} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <polygon points="0,10 300,2 1000,6 330,14" fill="url(#vitesse)" />
      <polygon points="420,17 760,15 1000,16 780,19" fill={ACIER_BLEU} opacity="0.6" />
    </svg>
  )
}

/* ---------------------------------------------------------------------
   I : CONSTRUCTEUR. Les logos fins et larges de matériel (NSX, PSP,
   Militech) : Michroma très espacée en glace froide ; HUGO petit, calé
   en largeur sur JUSKOWIAK comme BIO sur TECHNICA ; l'éclat à quatre
   branches de Trauma Team ; quatre coins de visée et les mentions mono
   aux coins, comme l'affiche Gaudium de Machina. Pas de boîte.
   --------------------------------------------------------------------- */

const GLACE = "#dff4ff"
const CYAN = "#7fd4ff"
const LUEUR_FROIDE = "0 0 2px rgba(191, 233, 255, 0.9), 0 0 14px rgba(110, 200, 255, 0.55), 0 0 40px rgba(60, 150, 255, 0.25)"

const MENTION: CSSProperties = {
  position: "absolute",
  font: "400 10px/1 var(--f-mono)",
  letterSpacing: "0.18em",
  color: `${CYAN}c0`,
}

function CarteConstructeur({ nom, titre }: Textes) {
  const [prenom, ...reste] = nom.split(" ")
  return (
    <div style={{ position: "relative", display: "inline-block", padding: "54px 72px 50px", ...MAJUSCULES }}>
      <CoinsDeVisee />
      <span aria-hidden style={{ ...MENTION, top: 0, left: 22 }}>GT86 / ZN6</span>
      <span aria-hidden style={{ ...MENTION, top: 0, right: 22 }}>COPR. 2026</span>
      <span aria-hidden style={{ ...MENTION, bottom: 0, left: 22 }}>SIDE A</span>
      <span aria-hidden style={{ ...MENTION, bottom: 0, right: 22 }}>N° 086</span>

      <div style={{ display: "inline-grid", justifyItems: "stretch", textShadow: LUEUR_FROIDE, color: GLACE }}>
        <Eclat />
        <div
          style={{
            font: "400 clamp(14px, 1.5vw, 24px)/1 var(--f-etendue)",
            letterSpacing: "1.05em",
            marginRight: "-1.05em",
            textAlign: "center",
            marginTop: 14,
          }}
        >
          {prenom}
        </div>
        <div
          style={{
            font: "400 clamp(34px, 5vw, 80px)/1 var(--f-etendue)",
            letterSpacing: "0.14em",
            marginRight: "-0.14em",
            marginTop: 12,
          }}
        >
          {reste.join(" ")}
        </div>
        <div
          style={{
            marginTop: 22,
            paddingTop: 14,
            borderTop: `1px solid ${CYAN}66`,
            font: "400 clamp(9px, 0.78vw, 12px)/1 var(--f-etendue)",
            letterSpacing: "0.42em",
            marginRight: "-0.42em",
            textAlign: "center",
            color: CYAN,
            textShadow: "0 0 10px rgba(110, 200, 255, 0.5)",
          }}
        >
          {titre}
        </div>
      </div>
    </div>
  )
}

/* les quatre coins d'un viseur en filet d'1 px : le cadre est un fil,
   jamais un bloc */
function CoinsDeVisee() {
  const branche = 18
  const coin = (position: CSSProperties, bords: CSSProperties): ReactNode => (
    <span aria-hidden style={{ position: "absolute", width: branche, height: branche, ...position, ...bords }} />
  )
  const filet = `1px solid ${CYAN}99`
  return (
    <>
      {coin({ top: 18, left: 0 }, { borderTop: filet, borderLeft: filet })}
      {coin({ top: 18, right: 0 }, { borderTop: filet, borderRight: filet })}
      {coin({ bottom: 18, left: 0 }, { borderBottom: filet, borderLeft: filet })}
      {coin({ bottom: 18, right: 0 }, { borderBottom: filet, borderRight: filet })}
    </>
  )
}

/* l'éclat à quatre branches (Trauma Team, les étoiles des affiches
   chromées) : deux losanges effilés croisés et un point chaud */
function Eclat() {
  return (
    <svg aria-hidden viewBox="-20 -20 40 40" style={{ width: 30, height: 30, justifySelf: "center", filter: "drop-shadow(0 0 6px rgba(127, 212, 255, 0.8))" }}>
      <path d="M0 -20 L1.6 -1.6 L20 0 L1.6 1.6 L0 20 L-1.6 1.6 L-20 0 L-1.6 -1.6 Z" fill={GLACE} />
      <circle r="2.2" fill="#ffffff" />
    </svg>
  )
}

/* ---------------------------------------------------------------------
   J : CASSETTE. L'emballage vidéo japonais (la VHS T-180, la planche
   sakura épinglée deux fois) : un rectangle en filet rose, le nom en
   grotesque large et grasse (Archivo à 125 %), le titre façon « VIDEO
   CASSETTE », le katakana en colonne à droite, la double réglure et son
   onglet, les cases à cocher dehors, et un soleil rayé derrière.
   --------------------------------------------------------------------- */

const ROSE = "#ff5fb8"
const CREME = "#fff0f7"
const PRUNE = "#2a0f3a"

function CarteCassette({ nom, titre }: Textes) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "stretch", textAlign: "left", ...MAJUSCULES }}>
      <CasesACocher />
      <div style={{ position: "relative", display: "flex", gap: 40, padding: "28px 26px 22px 34px", border: `1px solid ${ROSE}`, background: "rgba(18, 5, 28, 0.5)" }}>
        <SoleilRaye />
        <div style={{ position: "relative", display: "grid", alignContent: "space-between" }}>
          <div>
            <div style={{ font: "800 clamp(34px, 4.6vw, 74px)/0.9 var(--f-display)", fontStretch: "125%", letterSpacing: "-0.02em", color: CREME, textShadow: `0 0 24px ${PRUNE}` }}>
              {nom}
            </div>
            <div style={{ marginTop: 16, font: "300 clamp(11px, 1.05vw, 16px)/1 var(--f-display)", fontStretch: "125%", letterSpacing: "0.34em", color: CREME }}>
              {titre}
            </div>
          </div>
          <div aria-hidden style={{ marginTop: 26, display: "flex", alignItems: "baseline", gap: 14, color: ROSE }}>
            <span style={{ font: "800 clamp(16px, 1.5vw, 22px)/1 var(--f-display)", fontStretch: "125%", padding: "3px 8px 2px", border: `2px solid ${ROSE}` }}>
              HI-FI
            </span>
            <span style={{ font: "500 11px/1 var(--f-mono)", letterSpacing: "0.16em" }}>STEREO · 2026 · ハチロク</span>
          </div>
        </div>
        <div
          aria-hidden
          style={{
            position: "relative",
            writingMode: "vertical-rl",
            font: "500 clamp(13px, 1.2vw, 18px)/1 var(--f-jp)",
            letterSpacing: "0.14em",
            color: CREME,
          }}
        >
          {NOM_KATAKANA}
        </div>
      </div>
      <Reglure />
    </div>
  )
}

/* le soleil couchant des pochettes vaporwave : un disque rose dont la
   moitié basse est tranchée de bandes de plus en plus larges */
function SoleilRaye() {
  return (
    <svg aria-hidden viewBox="0 0 100 100" style={{ position: "absolute", right: 70, bottom: 18, width: "min(7vw, 100px)", opacity: 0.9 }}>
      <defs>
        <linearGradient id="soleil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8fd0" />
          <stop offset="1" stopColor="#d1127e" />
        </linearGradient>
        <mask id="tranches">
          <rect width="100" height="100" fill="white" />
          {[56, 64, 71, 77, 82, 87, 91].map((y, rang) => (
            <rect key={y} y={y} width="100" height={1 + rang * 0.6} fill="black" />
          ))}
        </mask>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#soleil)" mask="url(#tranches)" />
    </svg>
  )
}

/* les cases de la planche sakura (SP / LO-FI / VHS), cochées pour ce
   que fait Hugo */
function CasesACocher() {
  const cases = ["FRONT", "BACK", "IA"]
  return (
    <div aria-hidden style={{ position: "absolute", right: "100%", top: 0, marginRight: 22, display: "grid", gap: 10 }}>
      {cases.map((libelle) => (
        <span key={libelle} style={{ display: "flex", alignItems: "center", gap: 8, font: "500 10px/1 var(--f-mono)", letterSpacing: "0.14em", color: CREME }}>
          <span style={{ width: 9, height: 9, border: `1px solid ${ROSE}`, display: "grid", placeItems: "center", font: "700 9px/1 var(--f-mono)", color: ROSE }}>
            ×
          </span>
          {libelle}
        </span>
      ))}
    </div>
  )
}

/* la double réglure à droite du rectangle et son onglet vertical */
function Reglure() {
  return (
    <div aria-hidden style={{ display: "flex", gap: 5, marginLeft: 8 }}>
      <span style={{ width: 1, background: ROSE }} />
      <span style={{ position: "relative", width: 1, background: ROSE }}>
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 4,
            writingMode: "vertical-rl",
            padding: "6px 2px",
            background: ROSE,
            color: PRUNE,
            font: "700 10px/1 var(--f-mono)",
            letterSpacing: "0.12em",
          }}
        >
          SIDE A
        </span>
      </span>
    </div>
  )
}

/* --------------------------------------------------------------------- */

export const POLICES: Record<Cle, Police> = {
  /* une plaque parallélogramme bleu nuit, l'italique chromé du logo */
  h: {
    Carte: CarteEcranTitre,
    bouton: {
      ...MAJUSCULES,
      fontFamily: "var(--f-vitesse)",
      fontStyle: "italic",
      fontWeight: 700,
      fontStretch: "125%",
      letterSpacing: "0.12em",
      padding: "11px 30px 10px",
      color: ACIER_CLAIR,
      background: `linear-gradient(180deg, #1c2a58, ${BLEU_NUIT})`,
      border: "none",
      borderRadius: 0,
      clipPath: "polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)",
    },
  },
  /* le filet de glace et sa lueur, en Michroma espacée */
  i: {
    Carte: CarteConstructeur,
    bouton: {
      ...MAJUSCULES,
      fontFamily: "var(--f-etendue)",
      fontWeight: 400,
      letterSpacing: "0.3em",
      padding: "12px 20px 12px 24px",
      color: GLACE,
      background: "rgba(6, 14, 28, 0.82)",
      border: `1px solid ${CYAN}99`,
      borderRadius: 0,
      boxShadow: `0 0 16px rgba(110, 200, 255, 0.25)`,
      textShadow: "0 0 8px rgba(110, 200, 255, 0.6)",
    },
  },
  /* le filet rose doublé d'un second filet décalé, comme la réglure */
  j: {
    Carte: CarteCassette,
    bouton: {
      ...MAJUSCULES,
      fontFamily: "var(--f-display)",
      fontWeight: 800,
      fontStretch: "125%",
      letterSpacing: "0.08em",
      padding: "10px 18px 9px",
      color: CREME,
      background: PRUNE,
      border: `1px solid ${ROSE}`,
      borderRadius: 0,
      outline: `1px solid ${ROSE}`,
      outlineOffset: 3,
    },
  },
}

const CLES = Object.keys(POLICES) as Cle[]

export function policeVoulue(): Police {
  const cle = new URLSearchParams(window.location.search).get("police")
  return CLES.includes(cle as Cle) ? POLICES[cle as Cle] : POLICES.h
}
