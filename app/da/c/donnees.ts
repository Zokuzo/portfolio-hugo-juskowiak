import { t } from "@/components/proto/dict"
import { employeurs, etudes } from "@/components/proto/parcours"
import { projets } from "@/components/proto/projets"

/* Maquette FR seulement : tout vient des sources du site, rien n'est réécrit. */
const LANGUE = "fr"
const ANNEE_EN_COURS = 2026

export type Fiche = {
  slug: string
  nom: string
  sousTitre: string
  jp: string
  cadre: string
  periode: string
  etat: string
  annee: number
  parc: string[]
  formation: boolean
}

export type Etape = { annee: string; nom: string; fonction: string; lieu?: string; resume: string; travail: boolean }

function anneeDeDebut(periode: string): number {
  const trouvee = periode.match(/\d{4}/)
  return trouvee ? Number(trouvee[0]) : ANNEE_EN_COURS
}

export function lireFiches(): Fiche[] {
  return projets(LANGUE).map((p) => ({
    slug: p.slug,
    nom: p.nom,
    sousTitre: p.sousTitre,
    jp: p.jp,
    cadre: p.cadre,
    periode: p.periode,
    etat: p.etat,
    annee: anneeDeDebut(p.periode),
    parc: p.parc.slice(0, 6),
    formation: p.genre === "formation",
  }))
}

export function lireTrajet(): Etape[] {
  const postes: Etape[] = employeurs(LANGUE).map((e) => ({
    annee: e.periode,
    nom: e.nom,
    fonction: e.fonction,
    lieu: e.lieu,
    resume: e.resume,
    travail: true,
  }))
  const cursus: Etape[] = etudes(LANGUE).map((s) => ({
    annee: `${Math.floor(s.debut)} → ${Math.floor(s.fin)}`,
    nom: s.nom,
    fonction: s.intitule,
    lieu: s.lieu,
    resume: s.texte,
    travail: false,
  }))
  return [...postes, ...cursus].sort((a, b) => anneeDeDebut(b.annee) - anneeDeDebut(a.annee))
}

export function lireProfil() {
  return {
    role: t(LANGUE, "role"),
    statut: t(LANGUE, "status"),
    spec: t(LANGUE, "spec"),
    corps: t(LANGUE, "opCorps"),
    chute: t(LANGUE, "opChute"),
    liens: t(LANGUE, "ctLiens"),
    vedette: t(LANGUE, "featuredFigures"),
  }
}

export type Profil = ReturnType<typeof lireProfil>
