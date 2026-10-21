import type { ReactNode } from "react"
import { projets } from "@/components/proto/projets"
import { SLUGS_MAISON } from "@/components/proto/mondes"
import { Fusion } from "./fusion"

/* LE SITE A DEUX CORPS (#42) : chaque route rend sa page desktop ET la
   fusion mobile dans le même HTML serveur, et app/globals.css n'en montre
   qu'un au seuil de 768 px. Pas de site m., pas de lecture du user agent
   (il ignore la largeur de l'écran), pas de flash : le CSS tranche avant la
   première peinture, et le prérendu statique reste entier. La fusion lit sa
   vue dans l'URL (fusion.tsx), elle n'a besoin de rien d'autre. */
export function DeuxCorps({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="seul-desktop">{children}</div>
      <div className="seul-mobile">
        <FusionDuSite />
      </div>
    </>
  )
}

/* Les fiches se trient côté serveur : le client ne reçoit que le FR. */
export function FusionDuSite() {
  const toutes = projets("fr")
  const estMaison = (slug: string) => SLUGS_MAISON.includes(slug)
  return <Fusion travail={toutes.filter((p) => !estMaison(p.slug))} maison={toutes.filter((p) => estMaison(p.slug))} />
}
