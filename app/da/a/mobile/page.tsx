import type { Metadata, Viewport } from "next"
import { JeuMobile } from "./jeu-mobile"

export const metadata: Metadata = { title: "DA A · Jeu mobile" }
export const viewport: Viewport = { themeColor: "#08070f", viewportFit: "cover" }

export default function Page() {
  return <JeuMobile />
}
