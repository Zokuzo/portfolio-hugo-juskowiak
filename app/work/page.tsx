import { redirect } from "next/navigation"
import { SLUGS } from "@/components/proto/projets"

/* L'INDEX /work naît au ticket #34 — d'ici là, la porte mène au premier
   projet. Relevé au moment de la démo publique du #33 : le départ GPS
   « TRAVAIL » poussait vers une 404, inacceptable sur le domaine. */
export default function Page() {
  redirect(`/work/${SLUGS[0]}`)
}
