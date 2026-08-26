import type { Metadata } from "next"
import { Michroma, Silkscreen } from "next/font/google"
import HubTravail from "@/components/y2k/hub-travail"
import "@/components/y2k/y2k.css"

/* LE HUB /work (#36) — l'index-bouchon du #33 meurt ici. La page est un
   composant client (la langue est un état local, comme partout sur le
   site) mais elle est PRÉRENDUE : le serveur sert le hub complet en FR.

   Les deux fontes du monde Y2K se chargent ICI et pas au layout racine :
   la home et les fiches planche n'ont pas à payer le chrome du hub.
   next/font les auto-héberge au build — zéro requête externe à
   l'exécution, la passe 7 du harnais reste vraie. */

/* Michroma : l'Eurostile Extended du pauvre — le lettrage chrome des
   références (Lightforce, Evangelion). Une seule graisse, c'est le jeu. */
const chrome = Michroma({
  weight: "400",
  subsets: ["latin"],
  variable: "--f-chrome",
  display: "swap",
})

/* Silkscreen : LA fonte pixel de l'an 2000 (Kottke, 1999) — chips,
   barres de titre, readouts. Jamais en corps de texte. */
/* une seule graisse : la 700 était préchargée sans jamais être rendue
   (revue #36) — un woff2 de moins dans le <head> */
const pixel = Silkscreen({
  weight: "400",
  subsets: ["latin"],
  variable: "--f-pixel",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Travail — Hugo Juskowiak",
  description:
    "La partition TRAVAIL : quatre employeurs, le routage multi-modèle en vitrine, la méthode en six étapes, les caractéristiques et le contact.",
}

export default function Page() {
  return (
    <div className={`${chrome.variable} ${pixel.variable}`}>
      <HubTravail />
    </div>
  )
}
