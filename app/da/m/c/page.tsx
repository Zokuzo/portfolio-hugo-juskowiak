import type { Metadata, Viewport } from "next"
import { PortfolioC } from "./portfolio-c"

export const metadata: Metadata = { title: "Mobile C · Clair" }
export const viewport: Viewport = { themeColor: "#f2f2f7", viewportFit: "cover" }

export default function Page() {
  return <PortfolioC />
}
