import type { Metadata } from "next"
import { ArriveeWork } from "@/components/nfs/arrivee"

export const metadata: Metadata = { title: "Work · DA A | Hugo Juskowiak" }

export default function Page() {
  return <ArriveeWork />
}
