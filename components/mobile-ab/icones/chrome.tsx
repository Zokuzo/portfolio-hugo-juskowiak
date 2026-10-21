import { useId } from "react"
import { Tuile, type Famille, type IconeProps } from "./tuile"

/* Famille « Chrome Y2K » : chaque picto est un tube de métal liquide,
   comme les logos chromés et les cœurs de CHASE épinglés par Hugo, avec
   l'étincelle à quatre branches rose en signature. */

type Glyphe = { traits?: string[]; pleins?: string[]; etincelle?: [number, number] }

const ROSE = "#e561d3"
const FOND = "light-dark(linear-gradient(160deg, #f6f5f9, #dcdbe3), linear-gradient(160deg, #1a1922, #08070d))"
const CONTOUR = "light-dark(#24222c, #000)"
const EPAISSEUR_TUBE = 5
const EPAISSEUR_CONTOUR = 8.5

function etoile(cx: number, cy: number, r: number) {
  const pince = r * 0.18
  return `M${cx} ${cy - r}Q${cx + pince} ${cy - pince} ${cx + r} ${cy}Q${cx + pince} ${cy + pince} ${cx} ${cy + r}Q${cx - pince} ${cy + pince} ${cx - r} ${cy}Q${cx - pince} ${cy - pince} ${cx} ${cy - r}Z`
}

function cercle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`
}

function Chrome({ glyphe, size }: { glyphe: Glyphe; size?: number }) {
  // useId rend des « : » ou « « » » : on ne garde que ce qu'une url(#...) accepte
  const id = `chrome${useId().replace(/[^\w-]/g, "")}`
  const metal = `url(#${id})`
  const { traits = [], pleins = [], etincelle } = glyphe
  return (
    <Tuile size={size} fond={FOND}>
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          {/* L'horizon du chrome : ciel blanc, ligne sombre, sol clair. Un seul
              dégradé en coordonnées absolues pour que tous les tubes d'une
              icône partagent le même reflet. */}
          <linearGradient id={id} x1="0" y1="10" x2="0" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".38" stopColor="#c9ccda" />
            <stop offset=".5" stopColor="#4a4c5c" />
            <stop offset=".56" stopColor="#f2f2f7" />
            <stop offset=".8" stopColor="#9a9db0" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <g strokeLinecap="round" strokeLinejoin="round">
          {pleins.map((d) => <path key={d} d={d} fill={CONTOUR} stroke={CONTOUR} strokeWidth={EPAISSEUR_CONTOUR - EPAISSEUR_TUBE} />)}
          {traits.map((d) => <path key={d} d={d} fill="none" stroke={CONTOUR} strokeWidth={EPAISSEUR_CONTOUR} />)}
          {pleins.map((d) => <path key={d} d={d} fill={metal} />)}
          {traits.map((d) => <path key={d} d={d} fill="none" stroke={metal} strokeWidth={EPAISSEUR_TUBE} />)}
          {traits.map((d) => <path key={d} d={d} fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".9" transform="translate(-.8 -1.2)" />)}
        </g>
        {etincelle && <path d={etoile(etincelle[0], etincelle[1], 7)} fill={ROSE} stroke={CONTOUR} strokeWidth="1" />}
      </svg>
    </Tuile>
  )
}

const GLYPHES: Record<keyof Famille, Glyphe> = {
  travail: {
    traits: ["M12 26h40v22a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3Z", "M25 26v-5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5", "M12 36h40"],
    etincelle: [51, 15],
  },
  maison: {
    pleins: ["M32 52C13 40 9 24 19 18c6-3.5 11 0 13 4.5C34 18 39 14.5 45 18c10 6 6 22-13 34Z"],
    etincelle: [50, 14],
  },
  projets: { traits: ["M22 21 11 32l11 11", "M42 21l11 11-11 11", "M36 16 28 48"], etincelle: [52, 13] },
  parcours: {
    traits: ["M16 53c0-12 32-8 32-20S18 25 18 13"],
    pleins: [cercle(16, 53, 4)],
    etincelle: [18, 11],
  },
  atelier: {
    traits: ["M15 49 33 31", "M31 25.5A10 10 0 0 1 44 13l-6 6 1.5 5.5L45 26l6-6a10 10 0 0 1-12.5 13"],
    etincelle: [16, 15],
  },
  cursus: {
    traits: ["M32 15 54 25 32 35 10 25Z", "M19 30v10c0 4 26 4 26 0V30", "M54 25v13"],
    etincelle: [14, 48],
  },
  contact: {
    pleins: ["M21 12c-4 0-8 4-7 10 2 13 14 26 28 29 6 1 9-3 9-7l-1-3-9-4-4 4c-6-3-10-7-13-13l4-4-4-9Z"],
    etincelle: [48, 15],
  },
  email: { traits: ["M11 19h42v28H11Z", "M12 20l20 15 20-15"], etincelle: [52, 13] },
  linkedin: {
    traits: ["M20 30v17", "M30 47V30", "M30 37c0-4 3-7 7.5-7S45 33 45 37v10"],
    pleins: [cercle(20, 20, 3.5)],
    etincelle: [50, 15],
  },
  cv: {
    traits: ["M17 10h18l12 12v32H17Z", "M35 10v12h12", "M32 34a5 5 0 1 0 0 8", "M36 33l3.5 10 3.5-10"],
    etincelle: [13, 49],
  },
  radio: {
    traits: [cercle(32, 32, 19), cercle(32, 32, 6)],
    etincelle: [50, 14],
  },
  reglages: {
    traits: [cercle(32, 32, 10), "M32 12v4", "M32 48v4", "M12 32h4", "M48 32h4", "M18 18l3 3", "M43 43l3 3", "M46 18l-3 3", "M21 43l-3 3"],
    pleins: ["M32 22a10 10 0 0 0 0 20Z"],
  },
  accueil: { pleins: [etoile(32, 32, 22)], etincelle: [47, 47] },
}

const icone = (nom: keyof Famille) => function IconeChrome({ size }: IconeProps) {
  return <Chrome glyphe={GLYPHES[nom]} size={size} />
}

export const chrome: Famille = Object.fromEntries(
  Object.keys(GLYPHES).map((nom) => [nom, icone(nom as keyof Famille)]),
) as Famille
