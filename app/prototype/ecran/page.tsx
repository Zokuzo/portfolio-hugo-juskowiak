import type { Metadata } from "next"
import Monte from "./monte"

/* PROTOTYPE — ticket #23 (carte #15). L'écran média de l'habitacle :
   natif GT86 (quad Display) ou PSP détournée en écran embarqué.
   Route jetable — elle meurt avec la branche prototype/ecran-23. */

export const metadata: Metadata = {
  title: "prototype — l'écran",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <Monte />
}
