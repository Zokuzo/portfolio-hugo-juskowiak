import { projets } from "@/components/proto/projets"
import { employeurs, etudes } from "@/components/proto/parcours"
import { t } from "@/components/proto/dict"

/* Maquette DA « Night drive » : tout le contenu vient des vraies sources
   du site (FR). Quand dict/projets/parcours sortiront de proto/, seuls
   ces imports changent. */
export const LANGUE = "fr" as const

export const COURSES = projets(LANGUE)
export const EMPLOYEURS = employeurs(LANGUE)
export const ETUDES = etudes(LANGUE)
export const CONTACTS = t(LANGUE, "ctLiens")
export const PROFIL = {
  corps: t(LANGUE, "opCorps"),
  chute: t(LANGUE, "opChute"),
  design: t(LANGUE, "opDesign"),
  champs: t(LANGUE, "opChamps"),
}

export const CHAPITRES = [
  { num: "01", nom: "COURSES", jp: "レース", ancre: "courses", legende: "Projets en service" },
  { num: "02", nom: "TRAJET", jp: "経路", ancre: "trajet", legende: "Parcours et études" },
  { num: "03", nom: "PILOTE", jp: "ドライバー", ancre: "pilote", legende: "Profil" },
  { num: "04", nom: "RADIO", jp: "無線", ancre: "radio", legende: "Contact" },
] as const
