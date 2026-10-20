"use client"

import { useState } from "react"
import { t, type Lang } from "@/components/proto/dict"
import "./hub-mobile.css"

/* PROTOTYPE iPhone, dosage B « Hybride » : deux surfaces de verre
   dépoli seulement (l'entête et la feuille qu'elle ouvre), le reste
   garde les biseaux Y2K. Masqué par le CSS au-dessus de 767 px. */
export function HubMobile({ lang }: { lang: Lang }) {
  const [ouverte, setOuverte] = useState(false)
  const fermer = () => setOuverte(false)

  return (
    <div className="hubm">
      <header className="hubm-entete">
        <span className="hubm-nom">HJ · 86</span>
        <button
          type="button"
          className="hubm-pilule"
          aria-expanded={ouverte}
          aria-controls="hubm-feuille"
          onClick={() => setOuverte(!ouverte)}
        >
          {ouverte ? "Fermer" : "Sommaire"}
        </button>
      </header>
      {ouverte && <div className="hubm-voile" onClick={fermer} aria-hidden="true" />}
      <nav id="hubm-feuille" className="hubm-feuille" data-ouverte={ouverte} aria-label="Sommaire" inert={!ouverte}>
        <span className="hubm-poignee" aria-hidden="true" />
        <ul>
          {t(lang, "idxFeuilles").map(([numero, ancre, titre, note]) => (
            <li key={ancre}>
              <a className="hubm-carte" href={`#${ancre}`} onClick={fermer}>
                <b>{numero}</b>
                <span>
                  {titre}
                  <small>{note}</small>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
