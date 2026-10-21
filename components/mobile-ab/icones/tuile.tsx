import type { CSSProperties, JSX, ReactNode } from "react"

export type IconeProps = { size?: number }
export type Icone = (props: IconeProps) => JSX.Element

export const APPS = [
  "travail", "maison", "projets", "parcours", "atelier", "cursus", "contact",
  "email", "linkedin", "cv", "radio", "reglages", "accueil",
] as const
export type NomApp = (typeof APPS)[number]
export type Famille = Record<NomApp, Icone>

const TAILLE_GRILLE = 60
/* Le squircle iOS approché : 22,5 % de rayon, la valeur que prennent
   la plupart des recréations CSS des icônes d'iPhone. */
const RAYON_SQUIRCLE = 0.225

/* La tuile porte son propre fond. `light-dark()` suit le `color-scheme`
   de l'ancêtre : le thème se choisit au-dessus, pas dans chaque icône.
   --tuile-fond et --tuile-relief, posés par un ancêtre, retirent la
   tuile là où elle ferait doublon (le dock : le dessin seul). */
export function Tuile({ size = TAILLE_GRILLE, fond, relief, children }: { size?: number; fond: string; relief?: string; children: ReactNode }) {
  const style: CSSProperties = {
    display: "inline-block",
    flex: "none",
    width: size,
    height: size,
    borderRadius: size * RAYON_SQUIRCLE,
    overflow: "hidden",
    background: `var(--tuile-fond, ${fond})`,
    boxShadow: `var(--tuile-relief, ${relief ?? "inset 0 0 0 1px light-dark(rgb(0 0 0 / .1), rgb(255 255 255 / .1))"})`,
  }
  return <span aria-hidden style={style}>{children}</span>
}
