import type { Metadata } from "next"
import { PageParcours } from "@/components/proto/page-parcours"
import "./parcours.css"

/* FR en dur — même règle que le layout : le HTML est statique, la
   langue est un état client, le title ne bascule pas. Premières
   métadonnées PAR PAGE du dépôt (spec §1 : « Métadonnées propres »). */
export const metadata: Metadata = {
  title: "Parcours | Hugo Juskowiak",
  description:
    "Quatre chapitres — la discipline (CPGE), le métier (ESTIA), le souffle (Hokkaido), la modernité (MBDS). Le parcours d'un ingénieur full stack et IA.",
}

export default function Page() {
  return <PageParcours />
}
