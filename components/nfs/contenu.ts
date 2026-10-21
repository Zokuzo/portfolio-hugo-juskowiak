/* Extrait des vrais textes (components/proto/projets.ts, parcours.ts, dict.ts).
   ponytail: copie figée pour la maquette ; à brancher sur contenu/ une fois dict.ts sorti de proto/. */

export type Course = {
  slug: string
  nom: string
  jp: string
  sousTitre: string
  periode: string
  etat: string
  piste: "travail" | "maison"
  parc: string[]
}

export const COURSES: Course[] = [
  { slug: "reach-up", nom: "Reach-Up", jp: "リーチアップ", sousTitre: "SaaS de prospection B2B multi-tenant, en marque blanche", periode: "2026.05 → présent", etat: "En service", piste: "travail", parc: ["TypeScript", "React", "Hono", "Supabase"] },
  { slug: "octo", nom: "Octo", jp: "オクト", sousTitre: "Segmentation d'exports DMS pour concessionnaires automobiles", periode: "2026.05 → présent", etat: "En service", piste: "travail", parc: ["TypeScript", "Traitement d'exports DMS"] },
  { slug: "uyb-store", nom: "UYB Store", jp: "ユーワイビー・ストア", sousTitre: "Marketplace qui regroupe l'offre de produits UpYourBizz", periode: "2026.09 → présent", etat: "En service", piste: "travail", parc: ["TypeScript", "React", "Supabase", "DocuSeal"] },
  { slug: "prediction-memoire", nom: "Prédiction mémoire", jp: "メモリ予測", sousTitre: "Machine learning contre la sur-allocation mémoire de pipelines bio-informatiques", periode: "2025.04 → 2025.09", etat: "Livré", piste: "travail", parc: ["Python", "XGBoost", "SHAP"] },
  { slug: "eternal", nom: "Eternal", jp: "エターナル", sousTitre: "Plateforme d'apprentissage gamifiée", periode: "En cours", etat: "En cours", piste: "maison", parc: ["JavaScript sans build", "three.js", "WebGL"] },
  { slug: "trading-agent", nom: "Trading Agent", jp: "トレーディング", sousTitre: "Bot de trading multi-stratégie en paper trading", periode: "En cours", etat: "Paper trading", piste: "maison", parc: ["Python (stdlib pur)", "Alpaca", "systemd"] },
]

export type Etape = { periode: string; nom: string; role: string; texte: string }

export const CARRIERE: Etape[] = [
  { periode: "2026.05 → présent", nom: "UpYourBizz", role: "Développeur Full Stack & Ingénieur IA", texte: "Reach-Up, Octo (8 h vers 15 min), UYB Store, UpYourAds." },
  { periode: "2025.04 → 2025.09", nom: "Sophia Genetics", role: "Stagiaire ingénieur logiciel", texte: "Prédiction d'usage mémoire par machine learning." },
  { periode: "2024.09 → 2025.10", nom: "MBDS", role: "Master Data Science", texte: "Mené en parallèle du cycle ingénieur." },
  { periode: "2024.03 → 2024.08", nom: "Hokkaido", role: "Semestre d'échange", texte: "Information & Ingénierie, au Japon." },
  { periode: "2023.02 → 2023.07", nom: "The Guill Corp", role: "Stagiaire ingénieur logiciel", texte: "Aéronautique. Filtrage de données d'aviation." },
  { periode: "2022.09 → 2025.10", nom: "ESTIA", role: "Master d'ingénieur trilingue", texte: "Le rail principal du parcours. Diplômé." },
  { periode: "2020.09 → 2022.06", nom: "CPGE TSI", role: "Classe préparatoire", texte: "Deux ans de fondations avant le code." },
]

export const CONTACT = [
  { role: "E-mail", valeur: "hugo.jskpro@outlook.fr", href: "mailto:hugo.jskpro@outlook.fr" },
  { role: "LinkedIn", valeur: "linkedin.com/in/hugo-juskowiak", href: "https://www.linkedin.com/in/hugo-juskowiak/" },
  { role: "CV", valeur: "CV au format PDF", href: "/CV_Hugo_Juskowiak_FR.pdf" },
]

export const PILOTE = {
  nom: "Hugo Juskowiak",
  jp: "ユゴー・ユスコヴィアク",
  fonction: "Ingénieur Full Stack & IA",
  base: "Le Mans, France",
  langues: "FR / EN / ES / JP",
}
