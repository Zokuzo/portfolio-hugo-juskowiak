"use client"

import { useEffect, useState } from "react"
import "./hub-mobile.css"

/* PROTOTYPE DOSAGE C : hub iOS-first, touches Y2K. Rendu seulement sous
   768 px ; au-dessus, rien n'est monté et le desktop reste la planche. */
const SEUIL_MOBILE = "(max-width: 767px)"

const GROUPES = [
  {
    titre: "Travail",
    liens: [
      { href: "/work", label: "Projets", note: "Reach-Up, routeur" },
      { href: "#experience", label: "Expérience", note: "par employeur" },
      { href: "#etudes", label: "Études", note: "double diplôme" },
    ],
  },
  {
    titre: "Hors travail",
    liens: [
      { href: "/home", label: "La maison", note: "le bureau Y2K" },
      { href: "#profil", label: "Profil", note: "l'opérateur" },
      { href: "#contact", label: "Contact", note: "écrire" },
    ],
  },
]

function useEstMobile() {
  const [estMobile, setEstMobile] = useState(false)
  useEffect(() => {
    const requete = matchMedia(SEUIL_MOBILE)
    const suivre = () => setEstMobile(requete.matches)
    suivre()
    requete.addEventListener("change", suivre)
    return () => requete.removeEventListener("change", suivre)
  }, [])
  return estMobile
}

export function HubMobile() {
  const estMobile = useEstMobile()
  const [feuilleOuverte, setFeuilleOuverte] = useState(false)
  if (!estMobile) return null

  const fermer = () => setFeuilleOuverte(false)

  return (
    <div className="hubm">
      <header className="hubm-barre">
        <span className="hubm-pixels" aria-hidden="true" />
        <button
          type="button"
          className="hubm-menu"
          aria-expanded={feuilleOuverte}
          onClick={() => setFeuilleOuverte(true)}
        >
          Menu
        </button>
      </header>
      <h1 className="hubm-titre">Hugo Juskowiak</h1>
      <p className="hubm-sous">Ingénieur full stack et IA</p>
      {GROUPES.map((groupe) => (
        <section key={groupe.titre} className="hubm-groupe">
          <h2 className="hubm-entete">{groupe.titre}</h2>
          <ul className="hubm-carte">
            {groupe.liens.map((lien) => (
              <li key={lien.href}>
                <a className="hubm-ligne" href={lien.href}>
                  <span>{lien.label}</span>
                  <span className="hubm-note">{lien.note}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {feuilleOuverte && (
        <div className="hubm-voile" onClick={fermer}>
          <nav
            className="hubm-feuille"
            aria-label="Navigation"
            role="dialog"
            aria-modal="true"
            onClick={(evenement) => evenement.stopPropagation()}
          >
            <span className="hubm-poignee" aria-hidden="true" />
            <div className="hubm-feuille-tete">
              <h2 className="hubm-feuille-titre">Aller à</h2>
              <button type="button" className="hubm-menu" onClick={fermer}>
                OK
              </button>
            </div>
            <ul className="hubm-carte">
              {GROUPES.flatMap((groupe) => groupe.liens).map((lien) => (
                <li key={lien.href}>
                  <a className="hubm-ligne" href={lien.href} onClick={fermer}>
                    <span>{lien.label}</span>
                    <span className="hubm-chevron" aria-hidden="true">›</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  )
}
