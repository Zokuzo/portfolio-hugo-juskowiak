import type { Metadata } from "next"
import { Michroma, Silkscreen } from "next/font/google"
import HubAffiche from "@/components/y2k/hub-affiche"
import "@/components/y2k/y2k.css"
import "@/components/y2k/affiche.css"

/* ROUTE JETABLE — l'essai B du gate #36 (« fait deux versions pour que
   je test ») : le hub TRAVAIL en pile d'affiches. Comme les autres
   /prototype/* : noindex, déclarée mortelle — le verdict de Hugo
   décide si sa grammaire devient le gabarit fiche (#38) ou si elle
   meurt ici. Mêmes fontes que /work. */

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
  title: "Essai — hub TRAVAIL en affiches",
  robots: { index: false },
}

export default function Page() {
  return (
    <div className={`${chrome.variable} ${pixel.variable}`}>
      <HubAffiche />
    </div>
  )
}
