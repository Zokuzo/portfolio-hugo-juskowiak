import type { Metadata } from "next"
import Monte from "./monte"

/* PROTOTYPE — ticket #21 (carte #15). Trois variantes du ciel rosé-orangé
   sur cette route jetable, commutables via ?variant=a|b|c et la barre
   flottante. La route entière meurt avec la branche prototype/ciel-21 —
   rien d'ici ne part en production. */

export const metadata: Metadata = {
  title: "prototype — le ciel",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <Monte />
}
