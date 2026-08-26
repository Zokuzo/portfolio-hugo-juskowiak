import { notFound } from "next/navigation"
import { Michroma, Silkscreen } from "next/font/google"
import { FicheProjet } from "@/components/proto/fiche-projet"
import { FicheY2k } from "@/components/y2k/fiche-y2k"
import { SLUGS } from "@/components/proto/projets"
import "@/components/y2k/y2k.css"
import "@/components/y2k/fiche-y2k.css"

/* Toutes les fiches sont connues à la compilation : elles sortent
   en statique, comme le reste du document. Aucune donnée n'arrive
   d'un serveur à l'exécution. */
export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }))
}

/* Les fontes du monde Y2K, chargées ici comme sur /work — la planche
   des fiches restantes ne les paie pas (variables inertes sans .fy). */
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

/* Le slug ne se traduit pas — une URL qui change avec la langue casse
   tous les liens entrants. La bascule FR/EN vit dans la fiche.

   AIGUILLAGE #38 : les trois fiches bureau passent au gabarit AFFICHE
   PUBLICITAIRE Y2K ; les six autres gardent la coque planche jusqu'à
   leur déménagement vers /home (#39). La liste vit ICI et pas dans le
   composant client : exportée de là-bas, elle n'arrive au serveur que
   comme référence opaque (`.includes is not a function` au build) —
   elle doit égaler les clés d'ACCENTS de fiche-y2k.tsx. */
const SLUGS_Y2K = ["reach-up", "octo", "prediction-memoire"]
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUGS.includes(slug)) notFound()
  if (SLUGS_Y2K.includes(slug)) {
    return (
      <div className={`${chrome.variable} ${pixel.variable}`}>
        <FicheY2k slug={slug} />
      </div>
    )
  }
  return <FicheProjet slug={slug} />
}
