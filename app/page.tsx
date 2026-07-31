"use client"

import { useState } from "react"
import { Plaque } from "@/components/proto/plaque"
import { IndexFeuilles } from "@/components/proto/index-feuilles"
import { Trace } from "@/components/proto/trace"
import { Experience } from "@/components/proto/experience"
import { Etudes } from "@/components/proto/etudes"
import { Atelier } from "@/components/proto/atelier"
import { Telemetrie } from "@/components/proto/telemetrie"
import { Ortho } from "@/components/proto/ortho"
import { Specifications } from "@/components/proto/specifications"
import { Operateur } from "@/components/proto/operateur"
import { Cartouche } from "@/components/proto/cartouche"
import { Smooth } from "@/components/proto/smooth"
import { World } from "@/components/proto/world"
import { Voiture } from "@/components/proto/voiture"
import type { Lang } from "@/components/proto/dict"

/* LE JEU DE PLANS COMPLET — dix feuilles, numérotées sans trou.

   L'ORDRE RÉPOND À UNE QUESTION DE LECTEUR À LA FOIS :
   01 comment il travaille — la seule chose qu'une liste de projets ne
      peut pas dire ;
   02 où il a travaillé, groupé par employeur ;
   03 ce qu'il a étudié, et le double diplôme se VOIT ;
   04 ce qu'il construit seul ;
   05 une pièce en profondeur — le routeur multi-modèle ;
   06 la planche de vues, respiration entre deux feuilles denses ;
   07 les capacités ;
   08 hors travail ;
   09 le contact.

   Mener avec 05 ou 06 aurait été plus spectaculaire et moins utile :
   un recruteur qui ne descend qu'un écran doit tomber sur du travail.

   La numérotation vit dans dict.ts (idxFeuilles) : l'index 00 la
   récite, il ne la redéclare pas. */
export default function Page() {
  const [lang, setLang] = useState<Lang>("fr")

  return (
    <main lang={lang}>
      <Smooth />
      {/* Le décor est monté UNE fois, hors des sections, et n'est
          enveloppé dans aucun élément portant transform, filter ou
          will-change — sinon cet ancêtre devient le bloc conteneur
          du position:fixed et le monde se met à scroller. */}
      <World />
      {/* La voiture est montée ICI, et pas dans la plaque, parce que son
          tourbillon traverse les trois premières feuilles. Même règle que
          le décor : aucun élément enveloppant, sinon un ancêtre portant
          transform devient le bloc conteneur du `position: fixed` et la
          voiture se remet à scroller avec la page. Sa place dans l'ordre
          compte aussi — après <World />, elle passe devant lui à
          z-index égal, et les sections (z-index 1) passent devant elle. */}
      <Voiture />
      <div className="frame" aria-hidden="true">
        <span className="tick tl" />
        <span className="tick tr" />
        <span className="tick bl" />
        <span className="tick br" />
      </div>

      <Plaque lang={lang} setLang={setLang} />
      <IndexFeuilles lang={lang} />
      <Trace lang={lang} />
      <Experience lang={lang} />
      <Etudes lang={lang} />
      <Atelier lang={lang} />
      <Telemetrie lang={lang} />
      <Ortho lang={lang} />
      <Specifications lang={lang} />
      <Operateur lang={lang} />
      <Cartouche lang={lang} />
    </main>
  )
}
