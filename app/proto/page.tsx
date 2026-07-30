"use client"

import { useState } from "react"
import { Plaque } from "@/components/proto/plaque"
import { Trace } from "@/components/proto/trace"
import { Smooth } from "@/components/proto/smooth"
import { World } from "@/components/proto/world"
import type { Lang } from "@/components/proto/dict"

export default function Proto() {
  const [lang, setLang] = useState<Lang>("fr")

  return (
    <main lang={lang}>
      <Smooth />
      {/* Le décor est monté UNE fois, hors des sections, et n'est
          enveloppé dans aucun élément portant transform, filter ou
          will-change — sinon cet ancêtre devient le bloc conteneur
          du position:fixed et le monde se met à scroller. */}
      <World />
      <div className="frame" aria-hidden="true">
        <span className="tick tl" />
        <span className="tick tr" />
        <span className="tick bl" />
        <span className="tick br" />
      </div>
      <Plaque lang={lang} setLang={setLang} />
      <Trace lang={lang} />
    </main>
  )
}
