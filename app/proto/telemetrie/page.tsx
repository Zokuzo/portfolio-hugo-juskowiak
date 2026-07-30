"use client"

import { useState } from "react"
import { Smooth } from "@/components/proto/smooth"
import { World } from "@/components/proto/world"
import { Telemetrie } from "@/components/proto/telemetrie"
import type { Lang } from "@/components/proto/dict"

/* Route d'atelier. Contrairement à la planche de vues, une SECTION ne
   peut pas se juger hors du monde : son contraste, son lit et sa
   densité se lisent contre la brume, pas contre du noir nu. Le décor
   est donc monté ici — et, comme sur la page réelle, il n'est enveloppé
   dans aucun élément portant transform, filter ou will-change, sinon
   cet ancêtre deviendrait le bloc conteneur du position:fixed.
   L'écran d'amorce existe pour une seule raison : les voies montent à
   l'entrée dans le viewport, et une section déjà visible au chargement
   ne montrerait jamais son geste.
   À supprimer quand la section rejoint /proto. */
export default function TelemetriePage() {
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
      <Telemetrie lang={lang} />
    </main>
  )
}
