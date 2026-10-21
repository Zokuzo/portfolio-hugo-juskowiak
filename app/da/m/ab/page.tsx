import type { Metadata, Viewport } from "next"
import { projets } from "@/components/proto/projets"
import { SLUGS_MAISON } from "@/components/proto/mondes"
import { Fusion } from "@/components/mobile-ab/fusion"

export const metadata: Metadata = { title: "Mobile AB · Fusion" }
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
}

/* Les fiches se trient côté serveur : le client ne reçoit que le FR. */
export default function Page() {
  const toutes = projets("fr")
  const estMaison = (slug: string) => SLUGS_MAISON.includes(slug)
  return <Fusion travail={toutes.filter((p) => !estMaison(p.slug))} maison={toutes.filter((p) => estMaison(p.slug))} />
}
