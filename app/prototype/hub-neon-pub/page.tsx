import type { Metadata } from "next"
import { Michroma, Silkscreen } from "next/font/google"
import HubPub from "@/components/y2k/hub-pub"
import "@/components/y2k/y2k.css"
import "@/components/y2k/pub.css"
import "@/components/y2k/pub-neon.css"

/* ROUTE JETABLE — l'essai D du gate #36 (« combine néon et pub ») : le
   squelette magazine de hub-pub, la peau nuit néon de pub-neon.css.
   Comme les autres /prototype/* : noindex, mortelle au verdict. */

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
  title: "Essai — hub TRAVAIL néon-pub",
  robots: { index: false },
}

export default function Page() {
  return (
    <div className={`${chrome.variable} ${pixel.variable}`}>
      <HubPub monde="neon" />
    </div>
  )
}
