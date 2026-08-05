# Cards projets, transitions au clic, fiches formation — design

Date : 2026-08-05
Statut : validé en discussion, en attente de relecture écrite

## But

Trois chantiers liés sur le portfolio « jeu de plans » :

1. Le clic vers une fiche `/work/[slug]` anime un **morph** (la card se prolonge
   dans l'en-tête de la fiche) au lieu d'un chargement sec — aller et retour.
2. Les cards de la feuille 04 (Atelier) deviennent entièrement cliquables,
   mieux hiérarchisées, et leurs schémas SVG s'animent au survol.
3. La formation (feuille 03) reçoit **quatre fiches détaillées** — CPGE, ESTIA,
   Hokkaido, MBDS — sur le même gabarit que les fiches projet, et ses entrées
   deviennent cliquables avec le même morph.

Hors périmètre : contenu supplémentaire sur les cards (métriques, badges),
refonte des autres feuilles, changement de la mécanique de langue FR/EN.

## 1 — Transition morph

Mécanisme : le composant React `ViewTransition` (natif dans Next 16.3,
App Router, aucune dépendance nouvelle), branché sur la View Transitions API
du navigateur.

- Côté liste : chaque card ou ligne menant à une fiche est enveloppée de
  `<ViewTransition name={"fiche-" + slug} share="morph" default="none">`.
  Trois emplacements : cards `.at-projet` (feuille 04), produits `.xp-produit`
  (feuille 02), entrées `.etu-entree` (feuille 03).
- Côté fiche : le `<header className="fp-head">` de `fiche-projet.tsx` reçoit
  le même nom. Une seule paire par navigation ; les slugs sont uniques sur la
  page d'accueil (vérifié : prospector, octo, prediction-memoire, eternal,
  trading-agent + les quatre formations).
- CSS dans `planche.css` : groupe `.morph` à 400 ms avec blur léger en vol
  (recette du guide Next embarqué), `::view-transition { pointer-events: none }`
  pour ne pas gober les clics pendant l'animation, et durées à 0 sous
  `prefers-reduced-motion: reduce`.
- Dégradation : navigateur sans View Transitions → navigation normale, aucun
  code de repli à écrire.

Risque connu : au retour sur `/`, les composants clients remontent et les
animations d'entrée framer-motion (`whileInView`, opacité 0 initiale) rejouent
pendant le morph retour. Si le rendu est laid, on retire l'animation d'entrée
des seuls éléments porteurs d'un nom de transition. Décision à l'implémentation,
à l'œil.

## 2 — Cards feuille 04

Tout en CSS, aucun JS nouveau.

- **Card cliquable** : `.at-projet` passe en `position: relative` ; le lien
  existant « voir la fiche → » s'étire sur toute la card par un pseudo-élément
  `::after` en `inset: 0` (stretched link). Les liens dépôts ↗ et leur réserve
  repassent au-dessus par `z-index`. Pas de `<Link>` imbriqué, sémantique et
  lecteurs d'écran intacts. Les cards sans fiche (A3, A4) ne changent pas de
  comportement.
- **Hover / focus-within** : bordure vers `--paper`, léger lift, flèche du
  lien qui glisse.
- **Schémas animés au survol**, chacun selon sa forme : le flux circule sur
  `.at-fil` (`stroke-dasharray` + `stroke-dashoffset` en boucle), `.at-vanne`
  et `.at-filtre` pulsent, `.at-noeud.at-actif` s'allume. Coupé sous
  `prefers-reduced-motion`.
- **Hiérarchie** : cartouche code/état resserré, nom plus affirmé, respiration
  accrue entre schéma et corps de texte.

## 3 — Fiches formation

- **Données** : les quatre fiches entrent dans `projets.ts` avec
  `genre: "formation"` (les fiches existantes restent le défaut « projet »)
  et les références **F-01…F-04** ; les projets gardent U-01…U-05.
  `SLUGS` s'allonge de `cpge`, `estia`, `hokkaido`, `mbds` →
  `generateStaticParams` produit les quatre pages statiques sans autre change.
- **Gabarit** : `FicheProjet` reste l'unique composant ; il choisit ses
  libellés selon le genre. Formation : contexte / **programme** /
  **travaux marquants** / résultat / **compétences & outils**. Projet :
  inchangé. Nouvelles clés dans `dict.ts` (FR + EN).
- **Feuille 03** : le type `Etude` de `parcours.ts` gagne `fiche?: string` ;
  chaque entrée de la liste devient cliquable (lien « voir la fiche → »,
  même morph, même stretched link que la feuille 04).
- **URL** : `/work/[slug]` pour tout — une route, un gabarit. Si `/work/cpge`
  gêne à l'usage, une route `/formation/[slug]` coûte dix lignes, plus tard.
- **Contenu** : huit textes (4 fiches × FR/EN) rédigés à partir de
  `parcours.ts`, faits à valider par Hugo à la relecture.

## Fichiers touchés

| Fichier | Changement |
|---|---|
| `components/proto/atelier.tsx` | ViewTransition autour des cards à fiche |
| `components/proto/experience.tsx` | ViewTransition autour des produits à fiche |
| `components/proto/etudes.tsx` | entrées cliquables + ViewTransition |
| `components/proto/fiche-projet.tsx` | ViewTransition sur `fp-head`, libellés par genre |
| `components/proto/projets.ts` | 4 fiches formation, `genre`, `SLUGS` |
| `components/proto/parcours.ts` | `fiche?` sur `Etude`, slugs des 4 entrées |
| `components/proto/dict.ts` | clés de libellés formation FR/EN |
| `app/planche.css` | CSS view-transitions, stretched link, hover, schémas animés, hiérarchie cards |

## Vérification

- `next build` passe et sort les quatre nouvelles pages statiques.
- Contrôle visuel sur le dev server (navigateur piloté) : morph aller/retour
  sur les trois feuilles, card entière cliquable, liens dépôts toujours
  cliquables, hover des schémas, `prefers-reduced-motion` respecté.
