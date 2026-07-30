"use client"

import { useState } from "react"
import { Ortho } from "@/components/proto/ortho"
import type { Lang } from "@/components/proto/dict"

/* Route d'atelier : la planche SEULE, sans le monde ni le scroll, pour
   qu'elle se juge sur elle-même avant qu'on décide où elle vit.
   Pas de <World /> ici — un décor parallaxé derrière un dessin coté
   dirait « ambiance » alors qu'on est en train de juger « précision ».
   À supprimer une fois la planche placée dans la page. */
export default function Vues() {
  const [lang, setLang] = useState<Lang>("fr")

  return (
    <main lang={lang}>
      <div className="ov-lang">
        <button type="button" className="mono mono-xs" aria-pressed={lang === "fr"} onClick={() => setLang("fr")}>
          FR
        </button>
        <button type="button" className="mono mono-xs" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
          EN
        </button>
      </div>
      <Ortho lang={lang} />
    </main>
  )
}
