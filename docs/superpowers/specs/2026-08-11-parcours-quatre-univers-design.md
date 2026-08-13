# Le parcours en quatre univers — design

Date : 2026-08-11
Statut : **tranché** — chaque décision de ce spec a été prise par Hugo au
grilling du 2026-08-11 (chantier GitHub #4, fermé sur ce document ; le
présent spec est le livrable du chantier #6). Ne restent ouverts que les
gates à l'œil, listés en fin de document.

## But

Fusionner les quatre fiches formation (`/work/cpge`, `/work/estia`,
`/work/hokkaido`, `/work/mbds`) en **une page `/parcours` à quatre
chapitres**, chacun étant un **univers visuel autonome** rattaché à un
mouvement de design nommé, relié aux autres par une **métamorphose
continue au scroll**. La page est un monde à part : elle n'hérite ni du
décor du site ni de son verrou mono-accent — mais elle vit sous les mêmes
**gates** (budget, reduce, contrastes) et le bi-thème NUIT/JOUR s'y
décline **par univers**.

## Contexte — ce que le grilling a établi et pourquoi

Les arbitrages du 2026-08-10 (issue #4 : URL `/parcours`, chapitres,
palette déverrouillée, morph abandonné) dataient d'avant la fermeture du
bi-thème #13. Le grilling du 2026-08-11 les a re-testés et étendus :

1. **`/parcours` est un monde autonome (option b)** — pas un habillage du
   monde du site. Le décor de l'accueil n'y entre pas.
2. **Le bi-thème se décline PAR UNIVERS** : chaque chapitre définit sa
   NUIT et son JOUR — huit directions visuelles pour cette page. C'est le
   niveau de personnalité voulu par Hugo, en toute connaissance du coût.
3. **La même ambition s'étend à `/work`** (univers-architecture par fiche
   projet, bi-thème compris) — mais en **chantier séparé, après, livré
   fiche par fiche**, le gabarit commun restant en vie jusqu'à ce que la
   dernière fiche l'ait quitté. Issue dédiée ; hors périmètre ici.
4. **Un seul invariant de design : LES DONNÉES.** `projets.ts`,
   `parcours.ts`, `dict.ts` restent la source unique (FR/EN gratuit
   partout) ; un univers met en scène le contenu, il ne le fork jamais.
   Typographie, grammaire de la planche, topbar : **libérées** — un
   univers peut tout réinventer.
5. **La doctrine invisible n'est pas un invariant de design, c'est un
   GATE DE SORTIE** : chaque univers fait absolument ce qu'il veut et ne
   sort que s'il passe le banc (≤ 10 % de frames > 8,3 ms à plancher
   égal), `reduce`, et `contrastes.mjs` avec SES propres paires.
6. **Trois besoins de navigation, forme libre** : chaque univers répond
   quelque part à *sortir*, *changer de langue*, *changer de thème* — la
   forme lui appartient, l'existence non (un anglophone coincé dans un
   chapitre sans bouton EN est une impasse, pas un univers).

## État vérifié au 2026-08-11

- Les 4 entrées `genre: "formation"` vivent dans `projets.ts` (FR ~349-460,
  EN ~731-850) ; `SLUGS = FR.map((p) => p.slug)` (`projets.ts:864`) — il
  est DÉRIVÉ : retirer les entrées fait maigrir `generateStaticParams`
  tout seul (`app/work/[slug]/page.tsx:8-10`).
- Chronologie réelle : CPGE (fondations) → **ESTIA 2022.09→2025.10, « le
  rail principal du parcours »** ; **Hokkaido 2024.03→2024.07** vit
  DEDANS (parenthèse de 5 mois) ; **MBDS 2024.09→2025.10** court en
  chevauchement sur la fin. La vraie forme n'est pas une ligne : un rail,
  une échappée, un contrepoint.
- La feuille 03 (`etudes.tsx`) relie chaque entrée à `/work/<slug>` quand
  `e.fiche` existe, avec les ancres de retour `carte-<fiche>` du
  ticket 31 (`etudes.tsx:158-185`).
- Le morph des fiches vit en CSS : `::view-transition-group(.morph)` et
  voisines (`planche.css:4254-4275`), avec leur branche `reduce`.
- `next.config.mjs` porte déjà un bloc `redirects()` (`:14`).
- L'index annonce « Neuf pièces documentées séparément — cinq projets,
  quatre cursus » (`dict.ts:708`, `idxAnnexesNote`) et liste quatre
  annexes F-01…F-04.
- Le bi-thème du site s'accroche à `html.clair` (script anti-FOUC de
  `layout.tsx`, interrupteur `theme-toggle.tsx`, événement
  `themechange`) ; l'outil de gates est `tools/controles/contrastes.mjs`
  (étalonné au millième sur les 15 ratios du sombre).

## Hors périmètre

Les univers `/work` (chantier séparé, issue dédiée — voir Séquençage) ;
toute retouche du document principal (accueil) ; un cinquième chapitre ;
le contenu ÉDITORIAL nouveau (le spec met en scène le contenu existant,
enrichi seulement là où le récit l'exige).

## 1 — Structure : quatre chapitres plats, l'imbrication dans la chair

**L'OS de la page** : quatre chapitres à plat, ordre chronologique
d'entrée — `#cpge` → `#estia` → `#hokkaido` → `#mbds` — quatre ancres
bêtes et solides pour les redirections. **La CHAIR raconte la vraie
chronologie** : la frontière vers Hokkaido se vit comme *quitter le
rail* ; celle vers MBDS comme *une seconde voie qui s'ouvre à côté*, pas
après ; les dates de chevauchement s'affichent sans honte dans chaque
chapitre. La vérité est dans la matière, la solidité dans la structure.

**La couverture** : `/parcours` s'ouvre sur une couverture sobre — titre,
l'arc (*discipline → métier → souffle → modernité*), sommaire des quatre
chapitres — qui amorce la grammaire de métamorphose et porte les trois
besoins de navigation en attendant que chaque univers les reprenne à sa
façon. Métadonnées propres (title/description, FR).

**Les ancres atterrissent toujours DANS un chapitre, jamais dans une
frontière** — un chapitre se suffit quand on y arrive par redirection.

## 2 — Les quatre univers (validés tels quels au grilling)

Chaque univers = un mouvement de design nommé + sa déclinaison NUIT/JOUR.
Les directions ci-dessous sont le CAP contractuel ; leur exécution
concrète se gate à l'œil sur planche avant construction (le rituel du
studio clair).

| Chapitre | Mouvement | NUIT | JOUR |
|---|---|---|---|
| **CPGE** | Style Typographique International — le brutalisme suisse de copie : grille stricte apparente, display massive condensée, quadrillage 5×5, encre Bic bleue + rouge de correction, marges de copie, tampons | le tableau noir — craie, équations au fusain | la copie double-feuille sous néon de salle de khôlle |
| **ESTIA** | Cyanotype / blueprint d'atelier — bleu de Prusse, traits blancs, hachures, cartouches normalisés, le calque qui se soulève. Le chapitre-mère : la langue du site dans sa matière originelle | cyanotype profond (blanc sur Prusse) | le calque et le papier machine sous lampe d'architecte |
| **Hokkaido** | Minimalisme blanc de Kenya Hara — le MA (間), vide habité, compositions décentrées, `--f-jp` en majesté verticale, un geste de sumi-e par écran. Le chapitre le plus LENT du site, à dessein | l'indigo aizome, une lanterne, le rouge d'un sceau (hanko) comme unique chaleur | la neige de Sapporo — blanc sur blanc, ombres bleutées |
| **MBDS** | Liquid glass sur champ de données — verre dépoli flottant sur des flux réels (routage multi-modèle, coûts), profondeur, réfraction | verre sombre sur dataviz phosphorescente | verre givré sur blanc clinique |

**Caveat MBDS assumé au grilling** : le `backdrop-filter` se repaie à
chaque frame de défilement — les surfaces de verre seront comptées et le
banc tranchera ; si le budget casse, le verre devient statique-malin
(flou pré-cuit dans la matière, réfraction simulée) sans changer le
mouvement.

**L'arc narratif** : la discipline (Suisse) → le métier (blueprint) → le
souffle (MA) → la modernité (glass).

## 3 — La métamorphose continue (option b, cadrée)

Hugo veut la métamorphose au scroll — pas des coupes, pas des sas. Le
cadre d'ingénierie qui la rend payable, validé au grilling :

- **Un seul monde vivant à la fois.** Dans une zone de frontière (plage
  de scroll dédiée, ~80–100vh), les deux univers coexistent mais le
  sortant se FIGE (sa matière devient un état peint, plus rien n'y
  anime) pendant que l'entrant se construit par-dessus — transforms,
  opacité, toile (l'iris de #13 a chiffré le procédé : 0,25 % au banc).
  Jamais deux mondes animés superposés.
- **L'interpolation par les jetons.** Chaque univers est un jeu de
  jetons (`@property` enregistrées, interpolables) ; la frontière est
  UNE variable de progression, **fonction pure du scroll** — le F5 garé
  en pleine frontière rend l'état exact (la leçon de l'iris périmé,
  revue #13). Couleurs et espaces glissent continûment ; la STRUCTURE
  bascule au point le plus couvert de la zone, sous couverture du blend.
- **Sous `reduce`** : les frontières deviennent des coupes franches — le
  mouvement s'éteint, le récit reste.
- **Gate dédié** : le banc traverse chaque frontière au scroll ; chaque
  zone passe les 10 % individuellement, sinon ELLE se simplifie.

## 4 — Mécanique du site : les cinq conséquences (validées)

1. **Les données déménagent** : `projets.ts` perd ses 4 entrées
   `genre: "formation"` (SLUGS/`generateStaticParams` maigrissent
   d'eux-mêmes) → contenu restructuré dans un module `chapitres.ts`
   dédié au récit, FR/EN conservés, source unique.
2. **Feuille 03** : chaque entrée pointe `/parcours#<ancre>` ; les
   `viewTransitionName`/classes `.morph` des formations tombent (les
   règles `planche.css:4254-4275` ne survivent que si les fiches projet
   s'en servent encore — à vérifier à l'implémentation) ; **la sortie
   d'un chapitre ramène à sa carte** `carte-<slug>` de la feuille 03
   (ticket 31 étendu).
3. **L'index** : les quatre lignes F-01…F-04 fusionnent en une entrée
   « PARCOURS » ; `idxAnnexesNote` (« Neuf pièces… ») se réécrit
   (« Cinq projets et un parcours » — FR et EN).
4. **Redirections 301** dans `next.config.mjs` :
   `/work/{cpge,estia,hokkaido,mbds}` → `/parcours#{ancre}` — le
   fragment passe dans `destination`, `permanent: true`.
5. **Couverture + métadonnées** : voir §1.

## 5 — Séquençage (validé)

- **Ce chantier** : `/parcours` seul — fusion, redirections, 4 univers ×
  2 thèmes, frontières. Le plus gros chantier créatif du site à ce jour.
- **`/work` en chantier séparé, après** — issue dédiée ouverte à la
  clôture de #6 : univers-architecture par fiche projet (5 × 2 thèmes),
  livré **fiche par fiche** derrière ses gates, gabarit commun maintenu
  jusqu'au dernier départ. Ordre suggéré : Reach-Up d'abord.
- **Phasage d'implémentation proposé pour `/parcours`** (le plan détaillé
  suivra le rituel du dépôt au moment de l'attaque) :
  1. squelette + données (`chapitres.ts`, page, ancres, redirections,
     couverture sobre) — la page EXISTE, laide et vraie ;
  2. un univers à la fois, chacun gaté à l'œil sur planche puis au banc
     (ordre : ESTIA d'abord — le chapitre-mère fixe la barre — puis
     CPGE, Hokkaido, MBDS) ;
  3. les frontières, une à une, chacune gatée ;
  4. bascule feuille 03 + index + retrait des entrées formation — EN
     DERNIER : les quatre fiches `/work` restent en vie jusqu'à ce que
     `/parcours` soit prêt à les remplacer, redirections comprises.

## Fichiers touchés (anticipation, l'implémentation précisera)

| Fichier | Changement |
|---|---|
| `app/parcours/page.tsx` (nouveau) | la page, couverture + 4 chapitres + frontières |
| `components/proto/chapitres.ts` (nouveau) | contenu des 4 formations restructuré pour le récit, FR/EN |
| CSS des univers (nouveau, découpage au plan) | 4 univers × 2 thèmes + jetons de frontière `@property` |
| `components/proto/projets.ts` | retrait des 4 entrées formation (en phase 4) |
| `components/proto/etudes.tsx` | liens vers ancres, retrait morph, retours carte |
| `components/proto/dict.ts` | index (entrée PARCOURS, note annexes), métadonnées, chaînes de couverture FR/EN |
| `app/planche.css` | retrait des règles morph si plus aucun consommateur |
| `next.config.mjs` | 4 redirections 301 |
| `tools/controles/contrastes.mjs` | gates étendus : les paires de CHAQUE univers, NUIT et JOUR |

## Vérification

- **Contrastes** : chaque univers ajoute ses paires à `contrastes.mjs` —
  étalonnage intact, gates par univers × thème.
- **Banc** : traversée complète de `/parcours` en NUIT et en JOUR, et
  chaque frontière isolément — ≤ 10 % à plancher égal, `--tete`.
- **`reduce`** : frontières en coupes franches, aucun mouvement
  scroll-causé, la page reste lisible et navigable.
- **Réseau** : les matières lourdes d'un chapitre ne se chargent qu'à
  l'approche (fenêtrage à la manière de la séquence voiture).
- **Redirections** : les 4 URLs mortes atterrissent sur leur ancre,
  build vert avec SLUGS maigris.
- **Navigation** : depuis chaque chapitre, dans chaque thème : sortir /
  langue / thème atteignables au clavier.
- **À l'œil, gates Hugo** : une planche par univers (×2 thèmes) AVANT
  construction ; chaque frontière sur build de production ; la
  couverture.

## Points de vigilance

- **L'identité éclatée volontairement** : avec les données pour seul
  invariant, la signature commune repose entièrement sur la QUALITÉ
  d'exécution et l'arc narratif — c'est le pari assumé du grilling.
- **Le poids** : 4 univers = 4 matières (textures, fontes propres
  éventuelles). Chaque ajout pèse sur une seule page, mais la doctrine
  « zéro octet avant le besoin » du dépôt s'applique : fenêtrage par
  chapitre.
- **Les fontes par univers** (la typographie n'est plus un invariant) :
  chaque fonte nouvelle est un coût de chargement et une licence à
  vérifier — décision par univers au moment de sa planche.
- **`@property` et l'interpolation de jetons** : support large mais à
  vérifier au banc sur les types utilisés (couleurs, longueurs).
- **Lenis + ancres** : l'atterrissage par fragment doit poser le scroll
  exactement dans le chapitre (offset des zones de frontière).

## Ce qui reste à trancher par Hugo (gates à l'œil, au fil du chantier)

1. La planche de chaque univers (×2 thèmes) avant sa construction.
2. Chaque frontière, sur build de production.
3. La couverture.
4. MBDS : verre vivant ou statique-malin — le banc proposera, l'œil
   disposera.

## Addendum 2026-08-12 — gate pris et directives nouvelles

**Planche ESTIA ×2 thèmes : GATÉE** (« c'est parfait », séance du
2026-08-12 ; v2.3, `.scratch/planches-parcours/estia.html`). Valeurs
contractuelles issues du gate :

- **NUIT — le tirage cyanotype** : bichrome STRICT. Prusse `#0e2a4a`
  (bord surexposé `#081c33`, papier nu `#dfe3e6`), trait `#e9eef5`
  (12,434), annotation `#a9bed6` (7,609), chimie inégale (champ +
  bord d'émulsion brossé).
- **JOUR — la table d'architecte** : papier machine `#f0e9d8` sous
  flaque de lampe (chaud, retombée vers les bords), table sombre
  `#6e6350` autour, ombre du bras de lampe sur un coin ; encre
  `#1c3a5e` (9,554), annotation `#48617f` (5,271) ; **la sanguine
  `#a83c22` (5,204) est RÉSERVÉE aux révisions** (nuage, RÉV., tampon)
  — la NUIT n'y a pas droit, c'est sa chimie.
- **Composition « feuille de travail »** : rien d'empilé — les pièces
  se posent où il y a de la place, échelles variées, chevauchements.
  Règle de lisibilité : les cadres peuvent se toucher, **les textes
  jamais** (pièces opaques sur la feuille).
- **Typo : celle du site** (Archivo wdth · JetBrains Mono · Noto JP) —
  le chapitre-mère parle la langue d'origine, zéro fonte neuve.
- Appareil sémantique : cote = les vraies dates, nomenclature =
  compétences, tampon = état, cartouche = langue REF/REV, nuage de
  révision sur la seconde voie (RÉV. 2024.09).

**Directive Hugo (2026-08-12, contractuelle pour la suite)** :

1. **Chaque univers porte SES animations et transitions, dans sa
   langue propre** — pas une grammaire de mouvement commune. ESTIA
   trace ses traits, Hokkaido respire, MBDS réfracte : le mouvement
   EST la matière du monde.
2. **Chaque univers porte de l'INTERACTIVITÉ propre** (au-delà du
   scroll) — pointer fine ; sous `reduce` et au tactile, tout se pose.
3. **Les frontières (phase 3) parlent la langue des DEUX mondes**
   qu'elles relient — la transition n'est pas un fondu neutre.
4. Ces trois points valent aussi pour le chantier `/work` (#14).

Les gates existants (banc ≤ 10 %, `reduce`, contrastes) restent le
filet de sortie de chaque univers, interactivité comprise.

## Addendum 2026-08-12 (suite) — planche CPGE gatée

**Planche CPGE ×2 thèmes : GATÉE** (« parfait pour la planche cpge »,
séance du 2026-08-12 ; v1, `.scratch/planches-parcours/cpge.html`).
Valeurs contractuelles issues du gate :

- **Le parti : la grille stricte du typographe, corrigée en rouge
  par-dessus.** La couche imprimée se cale au quadrillage fort (petits
  carreaux 18 px, ligne appuyée toutes les 5 = 90 px — c'est le papier
  ET la grille de mise en page) ; **seule la couche du correcteur a le
  droit d'être de travers.** C'est la CPGE : discipline, puis
  correction publique.
- **NUIT — le tableau noir** : salle `#0c100f`, ardoise vert-noir
  `#1b2422` (cadre aluminium `#333a36`), craie `#eef1ef` (13,966),
  fusain `#9fb0aa` (7,008), craie rouge `#e89286` (6,722 — corrections
  seules), carreaux peints `rgba(238,241,239,.07/.14)`, équations du
  programme TSI réel au fusain `rgba(238,241,239,.20)` à moitié
  mangées par l'éponge ; porte-craie et « NE PAS EFFACER »
  n'existent qu'en NUIT.
- **JOUR — la copie double sous néon** : formica `#8f9691`, copie
  blanc froid `#f2f4ef`, **trois encres** — impression noire `#1d211f`
  (14,704 : l'énoncé, la structure), **Bic bleu `#1e3f9f` (8,365 : la
  voix de l'étudiant)**, Bic en retrait `#44598f` (6,174), **rouge
  `#c0271c` (5,344 : le correcteur SEUL)** ; carreaux
  `rgba(110,130,185,.20/.34)`, marge de copie `rgba(198,68,80,.50)`,
  cadre réservé à la correction (JOUR seul) — le correcteur y écrit
  son verdict, sous le libellé imprimé.
- **La pliure de la copie double = le joint des deux panneaux du
  tableau en NUIT** — même géométrie, deux matières.
- **Fonte : Caveat (OFL) GATÉE**, réservée à la main du correcteur
  seule — quatrième fonte du dépôt, chargée par la route /parcours
  uniquement.
- Appareil sémantique : en-tête de copie = cartouche (+ les trois
  besoins de navigation), verdict manuscrit encerclé = résultat,
  parties I./II./III. = contexte/programme/travaux, barème =
  compétences, résultat encadré à la règle, tampon VALIDÉE = état ;
  la voix du correcteur (« Admis → ESTIA », ✓✓, « c'est le métier »)
  met en scène le résultat et l'état RÉELS — aucune note chiffrée
  inventée.
- **Langue de mouvement gatée** : l'encre s'écrit, la correction tombe
  APRÈS coup, décalée ; NUIT la craie trace et s'estompe.
  **Interactivité gatée** : JOUR souligner à la règle sous le
  pointeur, NUIT l'éponge efface et la craie se redessine ; le tampon
  se réimprime. Sous `reduce` et au tactile : tout posé.
- Textes jamais l'un sur l'autre ; les cadres peuvent se toucher.

## Addendum 2026-08-13 — retour sur planche Hokkaido v1 : directives nouvelles

Retour Hugo sur la planche Hokkaido v1 (gate non pris, planche revue en v2) :

- **« Les planches se ressemblent trop — le bleu foncé est présent
  partout. »** L'aizome de la NUIT Hokkaido doublait le cyanotype
  ESTIA. Règle générale qui en découle, valable pour MBDS et /work :
  **chaque univers tient SA famille de couleur — deux NUITS ne
  partagent jamais la même dominante.**
- **La ligne Hokkaido du tableau des univers est amendée** : NUIT =
  **la nuit de lanterne du festival de la neige** — urushi (laque
  brun-noir chaude `#1c120a`), un chōchin dessiné pendu du bord haut
  (son papier porte 雪), halo ambre, encre ivoire `#f4ecdd`, le trait
  de sumi-e s'écrit en neige, hanko vermillon `#e0684a`. Zéro bleu.
  JOUR inchangé dans l'esprit (neige, blanc sur blanc) mais les
  ombres passent au **gris-perle à peine bleuté** et le washi se
  fibre. Ratios v2 : NUIT 15,688 / 8,504 / hanko 5,480 · JOUR
  14,713 / 6,736 / hanko 6,070.
- **La disposition de la planche v1 est approuvée** (« j'aime bien la
  disposition ») — le renversement japonais/latin, les sections en
  kanji, le colophon 奥付, le sceau 済 sur le coin de l'estampe.
- **Les sept cours suivis entrent au récit** (fournis par Hugo) :
  Project Management (Kaizen methods, etc.), Theory and Practice of
  Algorithm, Frontier of Human Technologies, Human Computer
  Interaction, Accelerator Science, Transportation Planning,
  Intelligent Information System. Sur la planche : le mokuroku
  (目録), registre à numéraux kanji sous le tirage du campus. À la
  construction : **champ `cours[]` neuf dans `chapitres.ts`** (FR/EN,
  garde-fou de fidélité étendu), même mécanique que `photos`/`lien`
  pour ESTIA.
- **« Inspire-toi plus du Japon et d'Hokkaido, garde les kanji »** —
  signes entrés en v2 : le chōchin (NUIT), le washi fibré (JOUR),
  l'étoile du Kaitakushi (北辰, celle de la tour de l'horloge de
  Sapporo) en encre diluée au colophon — jamais en rouge, le hanko
  garde l'exclusivité de la chaleur d'encre.

## Addendum 2026-08-13 (suite) — retour sur planche Hokkaido v2

Second retour Hugo (planche revue en v3) :

- **Le schéma abstrait « le trait quitte le rail » est RETIRÉ** — « je
  ne comprends pas l'utilité de ce schéma ». Leçon pour tous les
  univers : les gestes de la planche restent FIGURATIFS (le chōchin,
  une silhouette), les métaphores de composition ne s'affichent pas.
- **La tour TV de Sapporo entre aux tirages** (« j'étais à Sapporo ») :
  vue du parc Ōdori, le soir, illuminée — Haseyu-, domaine public.
  Quatre tirages désormais → champ `photos[]` de chapitres.ts.
- **Les deux thèmes portent l'affect du semestre** : JOUR = **le froid
  de la ville en hiver** (l'arrivée en mars — ciel de neige, ombres
  bleu-glace claires `#9aa7b8`, sumi froid) · NUIT = **le côté
  agréable des nuits japonaises** (les soirs d'été — lanternes,
  éclairages, traditions ; l'urushi chaud de la v2 confirmé). Le
  colophon dit : « Nuit — nuits d'été · Jour — hiver ». Le froid
  CLAIR du JOUR n'est pas le bleu foncé retiré de la NUIT ; ratios
  JOUR v3 : 14,524 / 6,556 / hanko 6,115.
- **Un geste dessiné PAR THÈME, chacun dans sa matière** (demandé à la
  suite du retrait du schéma) : NUIT le **chōchin peint** (bord humide
  par déplacement fractal) · JOUR la **silhouette de la tour d'Ōdori
  tirée au trait** — ligne nette, aucun filtre, plate-forme et cadran
  opaques, posée dans une ligne de neige, debout dans le blanc du bas
  de colonne gauche face au registre des cours. Papier contre acier :
  **la matière dicte l'outil**, et les deux gestes s'excluent (un seul
  visible par thème). Règle réutilisable pour les univers restants.
