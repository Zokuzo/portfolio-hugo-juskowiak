import type { Metadata } from "next"
import { Michroma, Silkscreen } from "next/font/google"
import HubMaison from "@/components/y2k/hub-maison"
import "@/components/y2k/y2k.css"
import "@/components/y2k/hub-maison.css"
import "@/components/y2k/hero-fenetre.css"

/* L'ESSAI « FENÊTRE » du hero de /home (#37, 2e retour de gate : « fais
   une version totalement différente de la hero section »).

   La page est le hub MAISON à l'identique — SEUL le hero change. C'est
   la condition d'un gate honnête : ce qui diffère est ce qu'on juge.
   La route vit sous /prototype comme les essais du #36 ; le verdict de
   Hugo décidera laquelle des deux devient LE hero, et l'autre mourra
   (route 404, fichiers supprimés — l'historique git les garde). */

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
  title: "Maison — essai fenêtre",
  description: "Essai de hero pour la partition MAISON : la chambre au crépuscule, le système sur le moniteur du bureau.",
  /* un essai n'a rien à faire dans un index de moteur de recherche */
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <div className={`${chrome.variable} ${pixel.variable}`}>
      <HubMaison hero="fenetre" />
    </div>
  )
}
