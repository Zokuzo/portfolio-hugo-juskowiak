import type { Famille, IconeProps } from "./tuile"

/* Famille « Garage S13 / NFS Underground » : des objets de garage et de
   route découpés comme des stickers de vitre arrière (liseré, contour),
   posés à même la page, sans tuile. Le CV est un badge de puissance :
   en France, CV, ce sont aussi les chevaux.
   Les couleurs se lisent dans les tokens de l'hôte (--sticker-*,
   --accent, voir mobile-ab/DA.md) ; les valeurs de repli servent la
   planche de revue, qui n'en pose pas. */

type Forme = { d: string; fond?: string; trait?: string; epaisseur?: number }

const CONTOUR_COULEUR = "var(--sticker-contour, #111114)"
const LISERE_COULEUR = "var(--sticker-lisere, #f4f1ea)"
const NOIR = "var(--sticker-contour, #111114)"
const BLANC = "var(--sticker-papier, #f4f1ea)"
const JAUNE = "var(--sticker-signal, #ffd23f)"
const ACCENT = "var(--accent, #e561d3)"
const ACIER = "var(--sticker-metal, #c9ccd6)"
const PNEU = "var(--sticker-fonce, #2a2a31)"

const TAILLE_PAR_DEFAUT = 60
const LISERE_STICKER = 7
const CONTOUR = 3.5

function cercle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`
}

function rayonsDeJante(branches: number, rayon: number) {
  return Array.from({ length: branches }, (_, i) => {
    const angle = (i / branches) * 2 * Math.PI - Math.PI / 2
    return `M32 32L${(32 + rayon * Math.cos(angle)).toFixed(2)} ${(32 + rayon * Math.sin(angle)).toFixed(2)}`
  }).join("")
}

/* Trois passes : le liseré du sticker, le contour, puis la couleur.
   Les couleurs passent par style : un attribut SVG ne lit pas var(). */
function Calques({ formes, passe }: { formes: Forme[]; passe: "lisere" | "contour" | "couleur" }) {
  return formes.map(({ d, fond, trait, epaisseur = 0 }) => {
    if (passe === "lisere") return <path key={d} d={d} style={{ fill: fond ? LISERE_COULEUR : "none", stroke: LISERE_COULEUR }} strokeWidth={epaisseur + LISERE_STICKER} />
    if (passe === "contour") return <path key={d} d={d} style={{ fill: fond ?? "none", stroke: CONTOUR_COULEUR }} strokeWidth={epaisseur + CONTOUR} />
    return trait ? <path key={d} d={d} style={{ fill: "none", stroke: trait }} strokeWidth={epaisseur} /> : null
  })
}

function Sticker({ formes, size = TAILLE_PAR_DEFAUT }: { formes: Forme[]; size?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 64 64" width={size} height={size} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      <Calques formes={formes} passe="lisere" />
      <Calques formes={formes} passe="contour" />
      <Calques formes={formes} passe="couleur" />
    </svg>
  )
}

const FORMES: Record<keyof Famille, Forme[]> = {
  travail: [
    { d: "M11 40a21 21 0 0 1 42 0Z", fond: BLANC },
    { d: "M45 25a21 21 0 0 1 8 15h-6a15 15 0 0 0-5-10.5Z", fond: ACCENT },
    { d: "M30 41 47 26 34 43Z", fond: NOIR },
    { d: cercle(32, 41, 3), fond: NOIR },
  ],
  maison: [
    { d: "M10 31 32 13l22 18v21H10Z", fond: JAUNE },
    { d: "M19 33h26v19H19Z", fond: BLANC },
    { d: "M19 39.5h26M19 45.5h26", trait: NOIR, epaisseur: 0.1 },
  ],
  projets: [
    { d: cercle(32, 32, 21), fond: PNEU },
    { d: cercle(32, 32, 14), fond: ACIER },
    { d: rayonsDeJante(5, 13), trait: NOIR, epaisseur: 3 },
    { d: cercle(32, 32, 4.5), fond: ACCENT },
  ],
  parcours: [
    { d: "M32 7 57 32 32 57 7 32Z", fond: JAUNE },
    { d: "M25 45c0-9 13-8 13-17v-4", trait: NOIR, epaisseur: 3.5 },
    { d: "M32.5 25 38 17l5.5 8Z", fond: NOIR },
  ],
  atelier: [
    { d: "M16 48 34 30", trait: ACIER, epaisseur: 6 },
    { d: "M31 25.5A10 10 0 0 1 44 13l-6 6 1.5 5.5L45 26l6-6a10 10 0 0 1-12.5 13Z", fond: ACIER },
  ],
  cursus: [
    { d: cercle(32, 32, 20), fond: ACCENT },
    { d: "M24 44 32 20l8 24M27 36h10", trait: BLANC, epaisseur: 4.5 },
  ],
  contact: [
    { d: "M24 10h16a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5H24a5 5 0 0 1-5-5V15a5 5 0 0 1 5-5Z", fond: PNEU },
    { d: "M25 17h14M25 22h14M25 27h14", trait: ACIER, epaisseur: 2 },
    { d: "M45 22h3v8h-3Z", fond: ACCENT },
    { d: "M32 42c0 4-6 4-6 8s8 3 8 7", trait: ACCENT, epaisseur: 2.5 },
  ],
  email: [
    { d: "M9 18h46v29H9Z", fond: BLANC },
    { d: "M10 19l22 16 22-16", trait: NOIR, epaisseur: 0.1 },
    { d: "M9 41h46", trait: ACCENT, epaisseur: 3 },
  ],
  linkedin: [
    { d: "M9 19h46v26H9Z", fond: BLANC },
    { d: "M9 19h9v26H9Z", fond: ACCENT },
    { d: "M28 30v9", trait: NOIR, epaisseur: 4 },
    { d: cercle(28, 24.5, 1.6), fond: NOIR },
    { d: "M36 39v-9M36 34c0-3 2.5-4 5-4s5 1 5 4v5", trait: NOIR, epaisseur: 4 },
  ],
  cv: [
    { d: "M10 24c0-5 4-8 9-8h26c5 0 9 3 9 8v14c0 5-4 8-9 8H19c-5 0-9-3-9-8Z", fond: JAUNE },
    { d: "M30 25.5a6.5 6.5 0 1 0 0 11", trait: NOIR, epaisseur: 4 },
    { d: "M35 24l5 14 5-14", trait: NOIR, epaisseur: 4 },
  ],
  radio: [
    { d: "M9 17h46v31H9Z", fond: PNEU },
    { d: "M13 21h38v11H13Z", fond: ACCENT },
    { d: "M20 48l3-7h18l3 7", fond: PNEU },
    { d: `${cercle(25, 37, 2.5)}${cercle(39, 37, 2.5)}`, fond: BLANC },
  ],
  reglages: [
    { d: "M32 34v16", trait: ACIER, epaisseur: 6 },
    { d: "M21 52h22", trait: PNEU, epaisseur: 5 },
    { d: cercle(32, 22, 13), fond: PNEU },
    { d: "M26 16v12M32 16v12M38 16v12M26 22h12", trait: BLANC, epaisseur: 1.8 },
  ],
  accueil: [
    { d: cercle(32, 32, 19), trait: BLANC, epaisseur: 6 },
    { d: "M14 34h12l6 6 6-6h12M32 40v11", trait: BLANC, epaisseur: 5 },
    { d: cercle(32, 33, 5), fond: ACCENT },
  ],
}

const icone = (nom: keyof Famille) => function IconeGarage({ size }: IconeProps) {
  return <Sticker formes={FORMES[nom]} size={size} />
}

export const garage: Famille = Object.fromEntries(
  Object.keys(FORMES).map((nom) => [nom, icone(nom as keyof Famille)]),
) as Famille
