import type { Metadata } from "next"
import { Michroma, Silkscreen } from "next/font/google"
import HubMaison from "@/components/y2k/hub-maison"
import "@/components/y2k/y2k.css"
import "@/components/y2k/hub-maison.css"

/* LE HUB /home (#37) — le départ GPS « MAISON » cesse de mentir ici.
   Même construction que /work : composant client (la langue est un
   état local) mais PRÉRENDU — le serveur sert le hub complet en FR.

   Les deux fontes du monde Y2K se chargent ICI et pas au layout
   racine, comme sur /work : next/font les auto-héberge au build —
   zéro requête externe à l'exécution, la passe 7 du harnais reste
   vraie. */

const chrome = Michroma({
  weight: "400",
  subsets: ["latin"],
  variable: "--f-chrome",
  display: "swap",
})

const pixel = Silkscreen({
  weight: "400",
  subsets: ["latin"],
  variable: "--f-pixel",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Maison — Hugo Juskowiak",
  description:
    "La partition MAISON : l'atelier sur disquettes, quatre cursus en lecture, le hors-travail et la messagerie.",
}

export default function Page() {
  return (
    <div className={`${chrome.variable} ${pixel.variable}`}>
      <HubMaison />
    </div>
  )
}
