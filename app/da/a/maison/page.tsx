import type { Metadata } from "next"
import { ArriveeMaison } from "@/components/nfs/arrivee"

export const metadata: Metadata = { title: "Maison · DA A | Hugo Juskowiak" }

export default function Page() {
  return <ArriveeMaison />
}
