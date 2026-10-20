import type { Metadata } from "next"
import Cockpit from "./cockpit"
import { lireFiches, lireProfil, lireTrajet } from "./donnees"

export const metadata: Metadata = { title: "DA C · Cockpit (desktop)", robots: { index: false } }

export default function Page() {
  return <Cockpit fiches={lireFiches()} trajet={lireTrajet()} profil={lireProfil()} />
}
