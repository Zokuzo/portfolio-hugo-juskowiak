import type React from "react"
import type { Metadata } from "next"
import { Archivo, JetBrains_Mono, Noto_Sans_JP } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "./planche.css"

/* Archivo est chargée avec son axe `wdth` : la planche s'en sert pour
   condenser les titres. Sans l'axe, `font-stretch` n'a aucun effet et
   toute la typographie s'élargit d'un coup. */
const display = Archivo({
  subsets: ["latin"],
  variable: "--f-display",
  axes: ["wdth"],
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
  display: "swap",
})

// preload:false — les glyphes kana arrivent par unicode-range, on ne bloque pas le rendu pour eux
const jp = Noto_Sans_JP({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--f-jp",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "Hugo Juskowiak | Ingénieur Full Stack & IA",
  description:
    "Planche technique d'un ingénieur full stack et IA : Prospector, routage multi-modèle, machine learning en production.",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

/* `.proto-root` porte les tokens du système et vit ICI, à la racine :
   toutes les routes de la planche en héritent, y compris /work.
   ATTENTION — ce div ne doit JAMAIS recevoir transform, filter,
   perspective, will-change ni contain:paint. Le décor est en
   position:fixed et prendrait cet ancêtre pour bloc conteneur ; il se
   mettrait alors à scroller avec la page. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased">
        <div className={`${display.variable} ${mono.variable} ${jp.variable} proto-root`}>{children}</div>
        <Analytics />
      </body>
    </html>
  )
}
