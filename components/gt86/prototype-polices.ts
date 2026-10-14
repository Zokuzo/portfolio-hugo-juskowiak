import type { CSSProperties } from "react"

/* PROTOTYPE JETABLE (#60) : cinq variantes brutalistes du nom et du titre
   du seuil, chacune avec son encadré et son fond, reprises par
   « Cliquez pour démarrer » et « retour » en cadre réduit (des boutons
   de jeu), commutables par ?police=a|d|e|f|g sur / (a par défaut).
   Verdict à l'œil de Hugo, puis seule la gagnante rejoint scene.tsx et
   ce fichier disparaît avec les polices perdantes du layout.

   Les familles viennent de app/layout.tsx (next/font, préchargées) ; la
   palette est celle de la dalle peinte (ecran.ts). */

/* `bouton` porte famille, graisse, cadre et couleurs, jamais la taille :
   elle reste celle de chaque bouton dans scene.tsx. `etiquette` est un
   texte posé en absolu dans le cadre (cotes, katakana). */
type Police = {
  cadre: CSSProperties
  nom: CSSProperties
  titre: CSSProperties
  bouton: CSSProperties
  etiquette?: { texte: string; style: CSSProperties }
}
type Cle = "a" | "d" | "e" | "f" | "g"

const ENCRE = "#e8dff5"
const MAGENTA = "#ff64d2"
const VIOLET = "#8f5cff"
const PRUNE = "#2e1040"
const NUIT = "#08070f"

const MAJUSCULES: CSSProperties = { textTransform: "uppercase" }

/* le bandeau de titre qui court d'un bord à l'autre du cadre : la marge
   négative annule le rembourrage latéral du cadre ; l'ombre pleine de
   2 px bouche le liseré que laisse l'arrondi au sous-pixel entre le
   bandeau et la bordure basse (tailles en vw) */
function bandeau(rembourrage: number, fond: string): CSSProperties {
  return {
    display: "block",
    margin: `0 -${rembourrage}px`,
    padding: `11px ${rembourrage}px 10px`,
    background: fond,
    boxShadow: `0 2px 0 ${fond}`,
  }
}

/* les rayures de chantier en bordure : border-image sur un dégradé
   répété, la largeur de bordure fixe l'épaisseur de la bande */
function rayures(epaisseur: number): CSSProperties {
  return {
    border: `${epaisseur}px solid`,
    borderImage: `repeating-linear-gradient(-45deg, ${MAGENTA} 0 ${epaisseur}px, ${NUIT} ${epaisseur}px ${epaisseur * 2}px) ${epaisseur}`,
  }
}

const PAD_A = 40
const PAD_D = 34
const PAD_F = 30

export const POLICES: Record<Cle, Police> = {
  /* A encadrée : Dela Gothic One (gothique japonaise en masses pleines)
     sur une dalle de nuit, bordure d'encre épaisse, ombre portée dure
     magenta ; le bandeau clair en Archivo étirée ferme le bas du cadre */
  a: {
    cadre: {
      display: "inline-block",
      padding: `30px ${PAD_A}px 0`,
      background: NUIT,
      border: `5px solid ${ENCRE}`,
      boxShadow: `14px 14px 0 ${MAGENTA}`,
    },
    nom: {
      ...MAJUSCULES,
      font: "400 clamp(44px, 7vw, 112px)/0.95 var(--f-brut)",
      letterSpacing: "-0.01em",
      color: ENCRE,
    },
    titre: {
      ...MAJUSCULES,
      ...bandeau(PAD_A, ENCRE),
      marginTop: 26,
      font: "800 clamp(11px, 1vw, 15px)/1 var(--f-display)",
      fontStretch: "125%",
      letterSpacing: "0.28em",
      color: NUIT,
    },
    bouton: {
      ...MAJUSCULES,
      fontFamily: "var(--f-brut)",
      fontWeight: 400,
      letterSpacing: "0.04em",
      padding: "11px 18px 10px",
      color: ENCRE,
      background: NUIT,
      border: `3px solid ${ENCRE}`,
      boxShadow: `5px 5px 0 ${MAGENTA}`,
    },
  },

  /* D affiche : Anton, grotesque condensée très haute de l'affiche de
     propagande, noire sur un aplat magenta ; double filet nuit puis
     magenta, ombre prune décalée ; le titre sur une barre de nuit en
     Archivo condensée au maximum, ferré à gauche comme une affiche */
  d: {
    cadre: {
      display: "inline-block",
      textAlign: "left",
      padding: `22px ${PAD_D}px 0`,
      background: MAGENTA,
      border: `6px solid ${NUIT}`,
      boxShadow: `0 0 0 6px ${MAGENTA}, 20px 20px 0 6px ${PRUNE}`,
    },
    nom: {
      ...MAJUSCULES,
      font: "400 clamp(70px, 11vw, 176px)/0.86 var(--f-affiche)",
      letterSpacing: "0.005em",
      color: NUIT,
    },
    titre: {
      ...MAJUSCULES,
      ...bandeau(PAD_D, NUIT),
      marginTop: 22,
      font: "800 clamp(13px, 1.25vw, 19px)/1 var(--f-display)",
      fontStretch: "62%",
      letterSpacing: "0.42em",
      color: MAGENTA,
    },
    bouton: {
      ...MAJUSCULES,
      fontFamily: "var(--f-affiche)",
      fontWeight: 400,
      letterSpacing: "0.08em",
      padding: "9px 20px 8px",
      color: NUIT,
      background: MAGENTA,
      border: `3px solid ${NUIT}`,
      boxShadow: `0 0 0 3px ${MAGENTA}, 7px 7px 0 3px ${PRUNE}`,
    },
  },

  /* E extended : Unbounded noire, la plus large possible, en nuit sur une
     dalle d'encre claire ; filet nuit doublé d'un anneau clair pour
     tenir sur la rue sombre, ombre violette décalée ; le titre sous un
     filet plein, en Unbounded maigre très espacée */
  e: {
    cadre: {
      display: "inline-block",
      padding: "28px 36px 20px",
      background: ENCRE,
      border: `5px solid ${NUIT}`,
      boxShadow: `0 0 0 5px ${ENCRE}, 16px 16px 0 5px ${VIOLET}`,
    },
    nom: {
      ...MAJUSCULES,
      font: "900 clamp(32px, 5.2vw, 86px)/0.92 var(--f-large)",
      letterSpacing: "-0.035em",
      color: NUIT,
    },
    titre: {
      ...MAJUSCULES,
      marginTop: 20,
      paddingTop: 14,
      borderTop: `5px solid ${NUIT}`,
      font: "500 clamp(10px, 0.95vw, 14px)/1 var(--f-large)",
      letterSpacing: "0.52em",
      color: VIOLET,
    },
    bouton: {
      ...MAJUSCULES,
      fontFamily: "var(--f-large)",
      fontWeight: 800,
      letterSpacing: "0.02em",
      padding: "10px 18px 9px",
      color: NUIT,
      background: ENCRE,
      border: `3px solid ${NUIT}`,
      boxShadow: `0 0 0 2px ${ENCRE}, 6px 6px 0 2px ${VIOLET}`,
    },
  },

  /* F étiquette : Space Mono grasse, la plaque industrielle ou l'écran de
     diagnostic ; fond de nuit quadrillé violet, filet d'encre fin, pas
     d'ombre ; une cote magenta au-dessus du cadre et le titre en ligne
     de relevé sous un pointillé */
  f: {
    cadre: {
      display: "inline-block",
      position: "relative",
      textAlign: "left",
      padding: `30px ${PAD_F}px 0`,
      backgroundColor: NUIT,
      backgroundImage: `linear-gradient(${VIOLET}38 1px, transparent 1px), linear-gradient(90deg, ${VIOLET}38 1px, transparent 1px)`,
      backgroundSize: "18px 18px",
      border: `2px solid ${ENCRE}`,
    },
    nom: {
      ...MAJUSCULES,
      font: "700 clamp(34px, 5vw, 80px)/1 var(--f-terminal)",
      letterSpacing: "-0.05em",
      color: ENCRE,
    },
    titre: {
      ...MAJUSCULES,
      ...bandeau(PAD_F, "transparent"),
      marginTop: 24,
      borderTop: `2px dashed ${ENCRE}`,
      font: "400 clamp(11px, 1vw, 15px)/1 var(--f-terminal)",
      letterSpacing: "0.16em",
      color: MAGENTA,
    },
    etiquette: {
      texte: "|<- ZN6 / FA20 / REV.60 ->|",
      style: {
        position: "absolute",
        left: -2,
        right: -2,
        bottom: "100%",
        marginBottom: 8,
        font: "400 11px/1 var(--f-terminal)",
        letterSpacing: "0.2em",
        color: MAGENTA,
        textAlign: "center",
      },
    },
    bouton: {
      ...MAJUSCULES,
      fontFamily: "var(--f-terminal)",
      fontWeight: 700,
      letterSpacing: "0.06em",
      padding: "10px 16px",
      color: ENCRE,
      background: NUIT,
      border: `2px solid ${ENCRE}`,
      outline: `1px dashed ${MAGENTA}`,
      outlineOffset: 4,
    },
  },

  /* G pochoir : Big Shoulders Stencil noire, le marquage peint d'un
     atelier, sur une dalle prune bordée de rayures de sécurité magenta
     et nuit ; ハチロク (le surnom japonais de la 86) en colonne verticale
     dans le cadre, en Noto Sans JP */
  g: {
    cadre: {
      ...rayures(14),
      display: "inline-block",
      position: "relative",
      padding: "22px 84px 22px 40px",
      background: PRUNE,
    },
    nom: {
      ...MAJUSCULES,
      font: "900 clamp(64px, 9.5vw, 152px)/0.84 var(--f-pochoir)",
      letterSpacing: "0.015em",
      color: ENCRE,
    },
    titre: {
      ...MAJUSCULES,
      marginTop: 16,
      font: "700 clamp(15px, 1.5vw, 23px)/1 var(--f-pochoir)",
      letterSpacing: "0.36em",
      color: MAGENTA,
    },
    etiquette: {
      texte: "ハチロク",
      style: {
        position: "absolute",
        top: 18,
        right: 22,
        writingMode: "vertical-rl",
        font: "500 clamp(16px, 1.6vw, 24px)/1 var(--f-jp)",
        letterSpacing: "0.12em",
        color: MAGENTA,
      },
    },
    bouton: {
      ...MAJUSCULES,
      ...rayures(5),
      fontFamily: "var(--f-pochoir)",
      fontWeight: 800,
      letterSpacing: "0.1em",
      padding: "9px 18px 8px",
      color: ENCRE,
      background: PRUNE,
    },
  },
}

const CLES = Object.keys(POLICES) as Cle[]

export function policeVoulue(): Police {
  const cle = new URLSearchParams(window.location.search).get("police")
  return CLES.includes(cle as Cle) ? POLICES[cle as Cle] : POLICES.a
}
