import type React from "react"
import type { Metadata } from "next"
import { Archivo, JetBrains_Mono, Noto_Sans_JP } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import FiltreCrt from "@/components/filtre-crt"
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
    "Planche technique d'un ingénieur full stack et IA : Reach-Up, routage multi-modèle, prédiction mémoire par machine learning.",
  /* La mire porte son propre fond d'encre : elle tient sur une barre
     d'onglets claire comme sombre, donc plus de variantes par
     `prefers-color-scheme` — deux fichiers identiques qui prétendaient
     être différents. Le SVG passe en premier, les PNG sont le repli. */
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-dark-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
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
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        {/* AVANT LA PREMIÈRE PEINTURE (#13) : le site est statique, le
            serveur ne connaît pas le choix de thème — sans ce script,
            chaque chargement en clair flasherait sombre d'abord. Choix
            mémorisé d'abord, l'OS sinon. `suppressHydrationWarning` sur
            <html> : la classe posée ici diffère du HTML serveur, et
            c'est voulu. La classe `dark` reste : elle ne pilote que la
            @custom-variant Tailwind des composants importés (aucun site
            aujourd'hui) — le thème vit sur `clair`. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `var t=null;try{t=localStorage.getItem("theme")}catch(e){}try{if(t?t==="clair":matchMedia("(prefers-color-scheme: light)").matches)document.documentElement.classList.add("clair")}catch(e){}`,
          }}
        />
        {/* LE MASQUE D'ATTENTE (#54) : la planche est dans le HTML serveur
            (indexation, repli) mais `useGt86` ne répond oui qu'APRÈS
            l'hydratation ; sans ce masque, un desktop capable voyait la
            planche ~300 ms avant le voile CHARGEMENT. Ce script refait les
            critères de `components/gt86/capable.ts` SAUF WebGL (une sonde
            GPU ici bloquerait la première peinture de tout le monde) et pose
            `data-gt86` sur <html> ; la règle peint alors la nuit du voile par-
            dessus tout. Qui retire le masque : la surcouche à son montage, ou
            `useGt86` dès que la capacité réelle dit non (WebGL absent,
            abandon). Le délai est le garde-fou : un chunk qui n'arrive jamais
            ne laisse personne devant un écran vide plus de 5 s. Sans JS, rien
            ne tourne et la planche reste visible. Seule `/` porte la 3D. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var h=document.documentElement,m=function(q){return matchMedia(q).matches};if(location.pathname==="/"&&new URLSearchParams(location.search).get("gt86")!=="off"&&(m("(pointer: fine)")||m("(pointer: coarse)"))&&m("(min-width: 768px)")&&!m("(prefers-reduced-motion: reduce)")){h.setAttribute("data-gt86","attente");setTimeout(function(){h.removeAttribute("data-gt86")},5000)}}catch(e){}`,
          }}
        />
        <style>{`html[data-gt86] body::after{content:"";position:fixed;inset:0;z-index:2147483647;background:#08070f}`}</style>
      </head>
      <body className="antialiased">
        <div className={`${display.variable} ${mono.variable} ${jp.variable} proto-root`}>{children}</div>
        {/* la version CRT (#33) : surcouche globale, toutes routes et 3D */}
        <FiltreCrt />
        <Analytics />
      </body>
    </html>
  )
}
