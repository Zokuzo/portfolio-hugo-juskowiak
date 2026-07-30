import type React from "react"
import { Archivo, JetBrains_Mono, Noto_Sans_JP } from "next/font/google"
import "./proto.css"

const display = Archivo({
  subsets: ["latin"],
  variable: "--f-display",
  axes: ["wdth"],
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
  display: "swap",
})

// preload:false — les glyphes kana arrivent par unicode-range, on ne bloque pas le rendu pour eux
const jp = Noto_Sans_JP({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--f-jp",
  display: "swap",
  preload: false,
})

export default function ProtoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${mono.variable} ${jp.variable} proto-root`}>{children}</div>
}
