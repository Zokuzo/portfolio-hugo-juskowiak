"use client"

import { useState } from "react"
import { Plaque } from "@/components/proto/plaque"
import { IndexFeuilles } from "@/components/proto/index-feuilles"
import { Trace } from "@/components/proto/trace"
import { Telemetrie } from "@/components/proto/telemetrie"
import { Ortho } from "@/components/proto/ortho"
import { Revisions } from "@/components/proto/revisions"
import { Specifications } from "@/components/proto/specifications"
import { Operateur } from "@/components/proto/operateur"
import { Cartouche } from "@/components/proto/cartouche"
import { Smooth } from "@/components/proto/smooth"
import { World } from "@/components/proto/world"
import type { Lang } from "@/components/proto/dict"

/* LE JEU DE PLANS COMPLET — huit feuilles, numérotées sans trou.

   L'ordre raconte : le travail d'abord (01 la chaîne, 02 l'arbitrage
   qui la rend intéressante), la machine comme objet ensuite (03, qui
   est aussi la respiration entre deux feuilles denses), puis
   l'histoire (04), les capacités (05), l'humain (06), et le cartouche
   qui signe (07).

   Mener avec 03 aurait été plus joli et moins juste : un recruteur qui
   ne descend qu'un écran doit tomber sur du travail, pas sur une
   métaphore.

   La numérotation vit dans dict.ts (idxFeuilles) : l'index 00 la
   récite, il ne la redéclare pas. */
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
      <IndexFeuilles lang={lang} />
      <Trace lang={lang} />
      <Telemetrie lang={lang} />
      <Ortho lang={lang} />
      <Revisions lang={lang} />
      <Specifications lang={lang} />
      <Operateur lang={lang} />
      <Cartouche lang={lang} />
    </main>
  )
}
