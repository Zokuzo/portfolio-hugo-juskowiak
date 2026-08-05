import { notFound } from "next/navigation"
import { FicheProjet } from "@/components/proto/fiche-projet"
import { SLUGS } from "@/components/proto/projets"

/* Toutes les fiches sont connues à la compilation : elles sortent
   en statique, comme le reste du document. Aucune donnée n'arrive
   d'un serveur à l'exécution. */
export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }))
}

/* Le slug ne se traduit pas — une URL qui change avec la langue casse
   tous les liens entrants. La bascule FR/EN vit dans la fiche. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUGS.includes(slug)) notFound()
  return <FicheProjet slug={slug} />
}
