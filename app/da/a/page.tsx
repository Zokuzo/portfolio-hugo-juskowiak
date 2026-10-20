import type { Metadata } from "next"
import { MenuPrincipal } from "./menu-principal"

export const metadata: Metadata = { title: "DA A · Menu principal (desktop)" }

export default function Page() {
  return <MenuPrincipal />
}
