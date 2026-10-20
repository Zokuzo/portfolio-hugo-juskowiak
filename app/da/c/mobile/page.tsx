import type { Metadata, Viewport } from "next"
import Compagnon from "./compagnon"
import { lireFiches, lireProfil, lireTrajet } from "../donnees"

export const metadata: Metadata = { title: "DA C · Cockpit (mobile)", robots: { index: false } }
export const viewport: Viewport = { themeColor: "#08070f" }

export default function Page() {
  return <Compagnon fiches={lireFiches()} trajet={lireTrajet()} profil={lireProfil()} />
}
