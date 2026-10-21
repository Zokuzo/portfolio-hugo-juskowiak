import { Basket, Branches, Cabinet, Dish, Elevator, Exploded, Hub, Phosphor, Riffle, Terminal, Terrain, type HairlineProps } from "@lucasmarkes/hairline/react"
import type { ComponentType } from "react"

/* Une figure Hairline par fiche, choisie pour ce que le projet FAIT :
   Reach-Up distribue (Hub), Octo range des exports (Cabinet), le
   store remplit un panier (Basket), la
   prédiction mémoire est un relief de mesures (Terrain), etc. */
const PAR_SLUG: Record<string, ComponentType<HairlineProps>> = {
  "reach-up": Hub,
  octo: Cabinet,
  "uyb-store": Basket,
  "prediction-memoire": Terrain,
  eternal: Exploded,
  "trading-agent": Phosphor,
  cpge: Elevator,
  estia: Branches,
  hokkaido: Dish,
  mbds: Riffle,
}

export const figureDe = (slug: string) => PAR_SLUG[slug] ?? Terminal
