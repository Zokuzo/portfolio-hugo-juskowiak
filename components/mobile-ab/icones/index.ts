import { chrome } from "./chrome"
import { garage } from "./garage"
import { pixel } from "./pixel"

export { APPS, Tuile, type Famille, type Icone, type IconeProps, type NomApp } from "./tuile"

export const FAMILLES = { chrome, pixel, garage }
export type NomFamille = keyof typeof FAMILLES
