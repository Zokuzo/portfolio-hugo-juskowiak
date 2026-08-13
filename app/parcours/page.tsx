import type { Metadata } from "next"
import { Caveat, Dancing_Script } from "next/font/google"
import { PageParcours } from "@/components/proto/page-parcours"
import "./parcours.css"
import "./estia.css"
import "./cpge.css"

/* La main du correcteur (univers CPGE) — QUATRIÈME fonte du dépôt,
   gatée avec la planche v1. Chargée ICI et pas au layout : zéro octet
   de Caveat hors /parcours. preload:false — elle n'écrit que des
   annotations, on ne bloque pas le rendu pour elle. */
const correcteur = Caveat({
  subsets: ["latin"],
  variable: "--f-correcteur",
  display: "swap",
  preload: false,
})

/* La plume de l'étudiant (JOUR CPGE, demande Hugo 2026-08-13) —
   CINQUIÈME fonte, cursive calligraphique : la voix de l'étudiant
   s'écrit au stylo sur la copie ; l'énoncé imprimé reste net. Deux
   mains distinctes : Caveat corrige, Dancing Script compose. */
const plume = Dancing_Script({
  subsets: ["latin"],
  variable: "--f-plume",
  display: "swap",
  preload: false,
})

/* FR en dur — même règle que le layout : le HTML est statique, la
   langue est un état client, le title ne bascule pas. Premières
   métadonnées PAR PAGE du dépôt (spec §1 : « Métadonnées propres »). */
export const metadata: Metadata = {
  title: "Parcours | Hugo Juskowiak",
  description:
    "Quatre chapitres — la discipline (CPGE), le métier (ESTIA), le souffle (Hokkaido), la modernité (MBDS). Le parcours d'un ingénieur full stack et IA.",
}

export default function Page() {
  return (
    <div className={`${correcteur.variable} ${plume.variable}`}>
      <PageParcours />
    </div>
  )
}
