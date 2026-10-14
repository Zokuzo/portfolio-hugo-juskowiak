import type { CSSProperties } from "react"

/* PROTOTYPE JETABLE (#60) : trois polices pour le nom et le titre du
   seuil, reprises par « Cliquez pour démarrer » et « retour », commutables par ?police=a|b|c sur / (a par défaut). Verdict à
   l'œil de Hugo, puis seule la variante gagnante rejoint scene.tsx et ce
   fichier disparaît avec les polices perdantes du layout.

   Les familles viennent de app/layout.tsx (next/font, préchargées) ; la
   palette est celle de la dalle peinte (ecran.ts) : magenta #ff64d2,
   violet #8f5cff, prune #2e1040, lilas #f3daff. */

/* `bouton` ne porte que la famille et sa graisse : la taille, la couleur
   et la place restent celles de chaque bouton dans scene.tsx */
type Police = { nom: CSSProperties; titre: CSSProperties; bouton: CSSProperties }

const ENCRE = "#e8dff5"
const MAGENTA = "#ff64d2"
const VIOLET = "#8f5cff"
const PRUNE = "#2e1040"

/* l'extrusion de C : une ombre dure par pixel de profondeur, du violet
   de la face vers la prune du fond ; la dernière, floue, pose la masse
   sur la rue */
const PROFONDEUR_PX = 9
function extrusion(profondeur: number): string {
  const couches = Array.from({ length: profondeur }, (_, i) => {
    const p = i + 1
    return `${p}px ${p}px 0 ${p <= 2 ? VIOLET : PRUNE}`
  })
  return [...couches, `${profondeur + 4}px ${profondeur + 6}px 18px rgba(0, 0, 0, 0.7)`].join(", ")
}

export const POLICES: Record<"a" | "b" | "c", Police> = {
  /* A brutaliste : Dela Gothic One, gothique japonaise en masses pleines
     (le pays de la GT86) ; le titre en aplat inversé, Archivo étirée */
  a: {
    nom: {
      font: "400 clamp(44px, 7vw, 112px)/0.95 var(--f-brut)",
      letterSpacing: "-0.01em",
      textTransform: "uppercase",
      color: ENCRE,
    },
    titre: {
      display: "inline-block",
      marginTop: 18,
      padding: "7px 12px 6px",
      font: "800 clamp(11px, 1vw, 15px)/1 var(--f-display)",
      fontStretch: "125%",
      letterSpacing: "0.28em",
      textTransform: "uppercase",
      color: "#08070f",
      background: ENCRE,
    },
    bouton: { fontFamily: "var(--f-brut)", fontWeight: 400, letterSpacing: "0.04em", textTransform: "uppercase" },
  },
  /* B arcade : Silkscreen, le pixel des bornes, ombre dure sans flou
     comme un sprite ; le titre en Chakra Petch, l'encre du HUD */
  b: {
    nom: {
      font: "700 clamp(34px, 5vw, 76px)/1.05 var(--f-pixel)",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: ENCRE,
      textShadow: `0.08em 0.08em 0 ${VIOLET}`,
    },
    titre: {
      marginTop: 20,
      font: "600 italic clamp(12px, 1.1vw, 16px)/1 var(--f-hud)",
      letterSpacing: "0.32em",
      textTransform: "uppercase",
      color: MAGENTA,
    },
    bouton: { fontFamily: "var(--f-pixel)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" },
  },
  /* C relief : Racing Sans One, l'italique des logos de course, extrudée
     en couches ; le titre reprend la police avec un relief court */
  c: {
    nom: {
      font: "400 clamp(50px, 7.5vw, 124px)/1 var(--f-course)",
      letterSpacing: "0.01em",
      color: ENCRE,
      textShadow: extrusion(PROFONDEUR_PX),
    },
    titre: {
      marginTop: 22,
      font: "400 clamp(15px, 1.4vw, 21px)/1 var(--f-course)",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: MAGENTA,
      textShadow: `1px 1px 0 ${PRUNE}, 2px 2px 0 ${PRUNE}`,
    },
    bouton: { fontFamily: "var(--f-course)", fontWeight: 400, letterSpacing: "0.06em" },
  },
}

export function policeVoulue(): Police {
  const cle = new URLSearchParams(window.location.search).get("police")
  return cle === "b" || cle === "c" ? POLICES[cle] : POLICES.a
}
