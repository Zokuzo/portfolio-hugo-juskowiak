import type { Metadata } from "next"
import { MenuSeul } from "@/components/nfs/menu-seul"

export const metadata: Metadata = { title: "DA A · Menu principal (desktop)" }

export default function Page() {
  return <MenuSeul />
}
