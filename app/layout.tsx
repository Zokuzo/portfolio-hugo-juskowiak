import type React from "react"
import type { Metadata, Viewport } from "next"
import { Archivo, JetBrains_Mono, Michroma, Noto_Sans_JP, Saira } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import FiltreCrt from "@/components/filtre-crt"
import "./globals.css"

/* Archivo est chargée avec son axe `wdth` : le menu NFS et la fusion s'en servent pour
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

/* PROTOTYPE #60 : les deux familles des cartes titre du seuil qui ne
   sont pas déjà là (components/gt86/prototype-polices.tsx). Saira avec
   son axe `wdth` et son italique : l'italique de vitesse étirée à 125 %.
   Préchargées : la fonte est en cache bien avant que le nom
   n'apparaisse. Les perdantes partent au verdict de Hugo. */
const vitesse = Saira({ subsets: ["latin"], axes: ["wdth"], style: ["normal", "italic"], variable: "--f-vitesse", display: "swap" })
const etendue = Michroma({ weight: "400", subsets: ["latin"], variable: "--f-etendue", display: "swap" })
const policesSeuil = [vitesse, etendue].map((police) => police.variable).join(" ")

export const metadata: Metadata = {
  title: "Hugo Juskowiak | Ingénieur Full Stack & IA",
  description:
    "Portfolio d'un ingénieur full stack et IA au Mans : Reach-Up, Octo, UYB Store, prédiction mémoire par machine learning.",
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

/* La barre du navigateur aux couleurs de la fusion mobile (#42), sur
   téléphone seulement : le desktop garde la barre de son navigateur.
   Le --fond de la palette par défaut (components/mobile-ab/palettes.ts) ;
   la bascule de thème réécrit ces balises (bascule-theme.tsx). */
const TELEPHONE = "(max-width: 767px)"
export const viewport: Viewport = {
  themeColor: [
    { media: `${TELEPHONE} and (prefers-color-scheme: light)`, color: "#dfe3e8" },
    { media: `${TELEPHONE} and (prefers-color-scheme: dark)`, color: "#0f1114" },
  ],
}

/* `.proto-root` porte les tokens du système et vit ICI, à la racine :
   toutes les routes en héritent (le socle, app/globals.css).
   ATTENTION — ce div ne doit JAMAIS recevoir transform, filter,
   perspective, will-change ni contain:paint : les position:fixed des
   pages (surcouche 3D, menu, feuilles) prendraient cet ancêtre pour
   bloc conteneur et se mettraient à scroller avec la page. */
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
            chaque chargement en clair flasherait sombre d'abord. Le réglage
            système décide à chaque visite (demande de Hugo, 2026-10-21) ;
            la bascule ne vaut que pour la session (sessionStorage), et
            l'ancien choix mémorisé en localStorage est effacé.
            `suppressHydrationWarning` sur <html> : la classe posée ici
            diffère du HTML serveur, et c'est voulu. La classe `dark` reste : elle ne pilote que la
            @custom-variant Tailwind des composants importés (aucun site
            aujourd'hui) — le thème vit sur `clair`. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `var t=null;try{localStorage.removeItem("theme");t=sessionStorage.getItem("theme")}catch(e){}try{if(t?t==="clair":matchMedia("(prefers-color-scheme: light)").matches)document.documentElement.classList.add("clair")}catch(e){}`,
          }}
        />
        {/* LE MASQUE D'ATTENTE (#54) : la fusion est dans le HTML serveur
            (indexation, repli) mais `useGt86` ne répond oui qu'APRÈS
            l'hydratation ; sans ce masque, un desktop capable voyait la
            fusion ~300 ms avant le voile CHARGEMENT. Ce script refait les
            critères de `components/gt86/capable.ts` SAUF WebGL (une sonde
            GPU ici bloquerait la première peinture de tout le monde) et pose
            `data-gt86` sur <html> ; la règle peint alors la nuit du voile par-
            dessus tout. Qui retire le masque : la surcouche à son montage, ou
            `useGt86` dès que la capacité réelle dit non (WebGL absent,
            abandon). Le délai est le garde-fou : un chunk qui n'arrive jamais
            ne laisse personne devant un écran vide plus de 5 s. Sans JS, rien
            ne tourne et la fusion reste visible. Seule `/` porte la 3D.
            `overflow: hidden` dès le masque : sinon la barre de défilement
            de la fusion reste peinte en blanc au bord du noir, puis saute
            quand la surcouche gèle le défilement. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var h=document.documentElement,m=function(q){return matchMedia(q).matches};if(location.pathname==="/"&&new URLSearchParams(location.search).get("gt86")!=="off"&&(m("(pointer: fine)")||m("(pointer: coarse)"))&&m("(min-width: 768px)")&&!m("(prefers-reduced-motion: reduce)")){h.setAttribute("data-gt86","attente");setTimeout(function(){h.removeAttribute("data-gt86")},5000)}}catch(e){}`,
          }}
        />
        <style>{`html[data-gt86]{overflow:hidden}html[data-gt86] body::after{content:"";position:fixed;inset:0;z-index:2147483647;background:#08070f}`}</style>
      </head>
      <body className="antialiased">
        <div className={`${display.variable} ${mono.variable} ${jp.variable} ${policesSeuil} proto-root`}>{children}</div>
        {/* la version CRT (#33) : surcouche globale, toutes routes et 3D */}
        <FiltreCrt />
        <Analytics />
      </body>
    </html>
  )
}
