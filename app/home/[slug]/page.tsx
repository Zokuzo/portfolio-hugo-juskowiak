import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Michroma, Silkscreen } from "next/font/google"
import { FicheY2k } from "@/components/y2k/fiche-y2k"
import { SLUGS_MAISON } from "@/components/proto/mondes"
import { projet } from "@/components/proto/projets"
import "@/components/y2k/y2k.css"
import "@/components/y2k/fiche-y2k.css"

/* LES SIX FICHES MAISON (#39) — les deux projets d'atelier et les
   quatre cursus, sortis de `/work` où ils n'avaient rien à faire : le
   hub MAISON les liait sous la route du BUREAU, et leur retour
   renvoyait à la planche. Ici ils rentrent chez eux.

   Route jumelle de `app/work/[slug]/page.tsx` — même gabarit, mêmes
   fontes, même prérendu statique ; seul le monde change, et il change
   par la propriété `retour` : c'est le SERVEUR qui sait dans quelle
   partition il rend, pas la fiche qui le devine d'une liste de slugs
   recopiée côté client. */
export function generateStaticParams() {
  return SLUGS_MAISON.map((slug) => ({ slug }))
}

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

/* LE TITRE DE PAGE, PAR FICHE. Ces six URLs sont les adresses
   CANONIQUES depuis le #39 (les 308 de next.config.mjs y aboutissent) :
   ce sont elles qui s'indexent, se mettent en favori et s'annoncent au
   lecteur d'écran à chaque chargement. Sans `generateMetadata` elles
   héritaient toutes du titre du layout racine — six onglets rigoureusement
   identiques, et rien pour les distinguer (WCAG 2.4.2, niveau A).

   EN FRANÇAIS, comme `app/home/page.tsx` : la bascule FR/EN vit dans le
   composant client, le document servi est en FR — un titre traduit
   mentirait sur ce que le serveur a rendu. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = projet("fr", slug)
  if (!p) return {}
  return { title: `${p.nom} — Maison — Hugo Juskowiak`, description: p.sousTitre }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUGS_MAISON.includes(slug)) notFound()
  return (
    <div className={`${chrome.variable} ${pixel.variable}`}>
      <FicheY2k slug={slug} retour="/home" />
    </div>
  )
}
