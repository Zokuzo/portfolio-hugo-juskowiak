import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Michroma, Silkscreen } from "next/font/google"
import { DeuxCorps } from "@/components/mobile-ab/deux-corps"
import { FicheY2k } from "@/components/y2k/fiche-y2k"
import { SLUGS_TRAVAIL, projet } from "@/components/proto/projets"
import "@/components/y2k/y2k.css"
import "@/components/y2k/fiche-y2k.css"

/* LES FICHES BUREAU : /work/[slug]. Depuis le #39, cette route ne
   porte plus QUE le travail : les six fiches maison sont parties sous
   `/home/[slug]`, et leurs anciennes URLs redirigent (next.config.mjs).
   Plus d'aiguillage ici, les deux mondes sont deux routes.

   Toutes les fiches sont connues à la compilation : elles sortent en
   statique, comme le reste du document. Aucune donnée n'arrive d'un
   serveur à l'exécution.

   Le slug ne se traduit pas : une URL qui change avec la langue casse
   tous les liens entrants. La bascule FR/EN vit dans la fiche. */
export function generateStaticParams() {
  return SLUGS_TRAVAIL.map((slug) => ({ slug }))
}

/* Les fontes du monde Y2K, chargées ici et pas au layout racine :
   next/font les auto-héberge au build, zéro requête externe. */
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
   héritaient toutes du titre du layout racine, six onglets rigoureusement
   identiques, et rien pour les distinguer (WCAG 2.4.2, niveau A).

   EN FRANÇAIS, comme `app/work/page.tsx` : la bascule FR/EN vit dans le
   composant client, le document servi est en FR, un titre traduit
   mentirait sur ce que le serveur a rendu. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = projet("fr", slug)
  if (!p) return {}
  return { title: `${p.nom} | Travail | Hugo Juskowiak`, description: p.sousTitre }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUGS_TRAVAIL.includes(slug)) notFound()
  return (
    <DeuxCorps>
      <div className={`${chrome.variable} ${pixel.variable}`}>
        <FicheY2k slug={slug} retour="/work" />
      </div>
    </DeuxCorps>
  )
}
