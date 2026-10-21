"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { FAMILLES, type NomApp, type NomFamille } from "./icones"

/* LE POINT DE BRANCHEMENT DES ICÔNES D'APPS. Tuiles, dock et lignes de
   contact ne connaissent qu'une clé : la famille dessinée se choisit
   ici. Les petits pictos d'interface (flèches, fermer) restent Reicon. */

export type CleIcone = "accueil" | "work" | "maison" | "contact" | "projets" | "parcours" | "atelier" | "cursus" | "mail" | "linkedin" | "cv"

// deux clés de l'interface ne portent pas le nom de l'app dessinée
const DESSIN: Record<CleIcone, NomApp> = {
  accueil: "accueil",
  work: "travail",
  maison: "maison",
  contact: "contact",
  projets: "projets",
  parcours: "parcours",
  atelier: "atelier",
  cursus: "cursus",
  mail: "email",
  linkedin: "linkedin",
  cv: "cv",
}

const FAMILLE_PAR_DEFAUT: NomFamille = "garage"
const estFamille = (nom: string | null): nom is NomFamille => nom !== null && nom in FAMILLES

const ContexteFamille = createContext<NomFamille>(FAMILLE_PAR_DEFAUT)

/* ?icones=chrome|pixel|garage pour comparer les familles sur le
   téléphone. Lu après le montage : le rendu serveur reste celui par défaut. */
export function FamilleIcones({ children }: { children: ReactNode }) {
  const [famille, setFamille] = useState(FAMILLE_PAR_DEFAUT)
  useEffect(() => {
    const demandee = new URLSearchParams(location.search).get("icones")
    if (estFamille(demandee)) setFamille(demandee)
  }, [])
  return <ContexteFamille.Provider value={famille}>{children}</ContexteFamille.Provider>
}

export function IconeApp({ cle, taille }: { cle: CleIcone; taille: number }) {
  const Icone = FAMILLES[useContext(ContexteFamille)][DESSIN[cle]]
  return <Icone size={taille} />
}
