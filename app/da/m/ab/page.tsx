import type { Metadata, Viewport } from "next"
import { FusionDuSite } from "@/components/mobile-ab/deux-corps"

export const metadata: Metadata = { title: "Mobile AB · Fusion" }
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dfe3e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1114" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
}

/* la fusion seule, à toutes les largeurs : la revue de la DA (le site,
   lui, ne la montre que sous 768 px, components/mobile-ab/deux-corps.tsx) */
export default function Page() {
  return <FusionDuSite />
}
