"use client"

import { useState } from "react"
import { Smooth } from "@/components/proto/smooth"
import { World } from "@/components/proto/world"
import { Revisions } from "@/components/proto/revisions"
import type { Lang } from "@/components/proto/dict"

/* Route d'atelier — mêmes règles que /proto/telemetrie : le décor est
   monté pour que la section se juge contre la brume et non contre du
   noir nu, et il n'est enveloppé dans aucun élément portant transform,
   filter ou will-change. L'écran d'amorce existe pour que les entrées
   montent à l'entrée dans le viewport plutôt qu'au chargement.
   À supprimer quand la section rejoint /proto. */
export default function RevisionsPage() {
  const [lang, setLang] = useState<Lang>("fr")

  return (
    <main lang={lang}>
      <Smooth />
      <World />
      <div className="frame" aria-hidden="true">
        <span className="tick tl" />
        <span className="tick tr" />
        <span className="tick bl" />
        <span className="tick br" />
      </div>

      <div className="ov-lang">
        <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>
          FR
        </button>
        <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
          EN
        </button>
      </div>

      <div className="tel-amorce" aria-hidden="true" />
      <Revisions lang={lang} />
    </main>
  )
}
