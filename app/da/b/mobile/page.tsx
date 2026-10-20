import type { Metadata, Viewport } from "next"
import { COURSES, CONTACTS, EMPLOYEURS, PROFIL } from "../donnees"
import Stories, { type Story } from "./stories"

export const metadata: Metadata = { title: "Night drive mobile | Hugo Juskowiak" }
export const viewport: Viewport = { themeColor: "#08070f" }

const PROJETS = COURSES.filter((c) => c.unite.startsWith("U-"))

const STORIES: Story[] = [
  { genre: "titre" },
  ...PROJETS.map((p): Story => ({
    genre: "course",
    jp: p.jp,
    nom: p.nom,
    meta: `${p.unite} · ${p.cadre}`,
    sous: p.sousTitre,
    etat: `${p.etat} · ${p.periode}`,
    contexte: p.contexte,
    decisions: p.decisions.map((d) => d.titre),
  })),
  {
    genre: "trajet",
    bornes: EMPLOYEURS.map((e) => ({ periode: e.periode, nom: e.nom, fonction: e.fonction })),
  },
  { genre: "pilote", corps: PROFIL.corps, champs: PROFIL.champs },
  { genre: "radio", liens: CONTACTS },
]

export default function NightDriveMobile() {
  return <Stories stories={STORIES} />
}
