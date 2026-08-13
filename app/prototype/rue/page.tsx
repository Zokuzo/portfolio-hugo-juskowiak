import type { Metadata } from "next"
import Monte from "./monte"

/* PROTOTYPE — ticket #22 (carte #15). La rue japonaise nocturne, monde
   d'atterrissage : lampadaires chauds, asphalte mouillé, néons discrets.
   Route jetable — elle meurt avec la branche prototype/rue-22. */

export const metadata: Metadata = {
  title: "prototype — la rue",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <Monte />
}
