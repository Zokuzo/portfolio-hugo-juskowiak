import type { Metadata, Viewport } from "next"
import { projets, SLUGS_TRAVAIL } from "@/components/proto/projets"
import { SLUGS_MAISON } from "@/components/proto/mondes"
import { employeurs } from "@/components/proto/parcours"
import { t } from "@/components/proto/dict"
import { EcranTitre } from "./ecran-titre"

export const metadata: Metadata = { title: "Hugo Juskowiak · Mobile B" }
export const viewport: Viewport = { themeColor: "#08070f", viewportFit: "cover", width: "device-width", initialScale: 1 }

/* Les données se trient ICI, côté serveur : le client ne reçoit que
   les fiches FR, pas le catalogue bilingue entier. */
export default function Page() {
  const toutes = projets("fr")
  return (
    <EcranTitre
      work={toutes.filter((p) => SLUGS_TRAVAIL.includes(p.slug))}
      maison={toutes.filter((p) => SLUGS_MAISON.includes(p.slug))}
      employeurs={employeurs("fr")}
      contacts={t("fr", "ctLiens").map(([role, valeur, href]) => ({ role, valeur, href }))}
    />
  )
}
