import type { Metadata, Viewport } from "next"
import { projets } from "@/components/proto/projets"
import { SLUGS_MAISON } from "@/components/proto/mondes"
import { CarplayPoche } from "@/components/mobile-a/carplay-poche"

export const metadata: Metadata = { title: "Mobile A · CarPlay de poche" }
export const viewport: Viewport = { themeColor: "#08070f", viewportFit: "cover", width: "device-width", initialScale: 1 }

/* Les fiches se trient côté serveur : le client ne reçoit que le FR. */
export default function Page() {
  const tous = projets("fr")
  const estMaison = (slug: string) => SLUGS_MAISON.includes(slug)
  return <CarplayPoche travail={tous.filter((p) => !estMaison(p.slug))} maison={tous.filter((p) => estMaison(p.slug))} />
}
