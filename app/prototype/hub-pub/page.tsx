import type { Metadata } from "next"
import { Michroma, Silkscreen } from "next/font/google"
import HubPub from "@/components/y2k/hub-pub"
import "@/components/y2k/y2k.css"
import "@/components/y2k/pub.css"

/* ROUTE JETABLE — l'essai C du gate #36 : le hub TRAVAIL en pages de
   magazine (d'après la pub Nokia 7250 de Hugo). Comme les autres
   /prototype/* : noindex, déclarée mortelle. Mêmes fontes que /work. */

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
  title: "Essai — hub TRAVAIL en pub magazine",
  robots: { index: false },
}

export default function Page() {
  return (
    <div className={`${chrome.variable} ${pixel.variable}`}>
      <HubPub />
    </div>
  )
}
