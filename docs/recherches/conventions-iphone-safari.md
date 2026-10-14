# Les conventions iPhone et Safari pour le site mobile

Recherche du ticket [#49](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/49) — 2026-10-14.
Cible : iPhone 14 (Safari iOS 26), site Next.js 16 responsive, DA Y2K qui s'arrondit **sous 768 px seulement**.
Sources primaires : Apple HIG (lue via ses JSON `developer.apple.com/tutorials/data/design/human-interface-guidelines/*.json`), blog WebKit, MDN, caniuse, docs Next.js embarquées (`node_modules/next/dist/docs/`), README Lenis.

Légende : **[source]** = fait vérifié dans la source citée · **[reco]** = recommandation dérivée, à gater à l'œil.

## TL;DR — à appliquer

1. `export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" }` dans `app/layout.tsx`, puis `env(safe-area-inset-*)` partout où un élément touche un bord. Ne **jamais** mettre `userScalable: false` / `maximumScale: 1`.
2. Hauteurs plein écran : `min-height: 100svh` (stable) ; `dvh` seulement pour un élément qui doit suivre la barre Safari ; jamais `100vh` seul.
3. Cibles tactiles **≥ 44 × 44 px** (zone de frappe, pas forcément le visuel).
4. Arrondis : `border-radius` classique (le squircle CSS `corner-shape` n'existe dans aucun Safari stable). Rayons concentriques : rayon intérieur = rayon extérieur − marge.
5. Lenis : ne pas lisser le toucher (`syncTouch` reste à `false`) — sur iPhone, le défilement inertiel natif est la référence ; `backdrop-filter` avec parcimonie (1–2 surfaces, jamais sur une liste qui défile) ; View Transitions `fiche-<slug>` OK sur iOS 18+.

## 1. Rayons iOS (rayon continu / squircle)

- **[source]** iOS dessine ses coins en « rayon continu » (courbure lissée, proche d'une superellipse). Côté web, la propriété qui le permettrait, `corner-shape: squircle | superellipse()`, **n'est supportée par aucun Safari stable ni iOS Safari jusqu'à 27.2** ; seule la Technology Preview macOS l'a. — https://caniuse.com/mdn-css_properties_corner-shape
- **[source]** Apple ne publie pas de valeurs de rayon en points pour le web ; le HIG parle de styles de boutons qui partagent « le même rayon de coin et la même marge interne » (cohérence), pas de chiffres. — https://developer.apple.com/design/human-interface-guidelines/buttons
- **[reco]** Utiliser `border-radius` (arc de cercle). À taille de téléphone, la différence avec un squircle est visible seulement sur les très grandes cartes ; si un élément-héros le mérite, `corner-shape` peut être ajouté en amélioration progressive (`@supports (corner-shape: squircle)`), sans rien casser ailleurs.
- **[reco]** Une échelle de tokens courte, déclarée **uniquement** dans `@media (max-width: 767.98px)` (le desktop garde `0`) :
  - `--rayon-s: 8px` (pastilles, champs), `--rayon-m: 14px` (boutons, tuiles), `--rayon-l: 22px` (cartes / fiches), `--rayon-pilule: 999px`.
  - Concentricité : un enfant à `padding` `p` dans un parent de rayon `R` prend `R − p` (min. 4 px). C'est ce qui donne le « natif » aux cartes imbriquées.
- **[reco]** Pour garder le « Y2K » côté prototype B (biseaux), un biseau `clip-path: polygon(...)` et un rayon ne se combinent pas sur le même coin : choisir l'un ou l'autre par coin.

## 2. Safe area et `viewport-fit=cover`

- **[source]** `viewport-fit=cover` : « le viewport est mis à l'échelle pour remplir l'écran de l'appareil. Il est fortement recommandé d'utiliser les variables safe area inset ». Sans `cover`, Safari garde la page dans la zone sûre (insets ≈ 0). — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport
- **[source]** `env(safe-area-inset-top|right|bottom|left)` valent `0` sur un écran rectangulaire, une valeur en px sinon ; `env()` accepte un repli (`env(safe-area-inset-bottom, 0px)`) ; Baseline depuis janvier 2020. — https://developer.mozilla.org/en-US/docs/Web/CSS/env
- **[source]** Next.js 16 : le type `Viewport` accepte `viewportFit?: 'auto' | 'cover' | 'contain'` (`node_modules/next/dist/lib/metadata/types/extra-types.d.ts`) ; l'export `viewport` se met dans un `layout`/`page`.
- **[source]** HIG : respecter la safe area est « essentiel » pour que le matériel (Dynamic Island) et l'UI système n'obstruent pas contenu et contrôles. — https://developer.apple.com/design/human-interface-guidelines/layout
- **[source]** MDN : `user-scalable=no` empêche les malvoyants de zoomer, WCAG exige au moins ×2 ; iOS 10+ ignore `maximum-scale` par défaut. L'exemple de la doc Next (`maximumScale: 1, userScalable: false`) est donc à **ne pas** recopier.
- **[reco]** Motif :
  ```css
  .barre-basse { padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); }
  .entete     { padding-top:    calc(8px  + env(safe-area-inset-top, 0px)); }
  .page       { padding-inline: max(16px, env(safe-area-inset-left, 0px)) max(16px, env(safe-area-inset-right, 0px)); }
  ```

## 3. Unités `svh` / `lvh` / `dvh`

- **[source]** `svh/lvh/dvh` supportés sur iOS Safari depuis 15.4. — https://caniuse.com/viewport-unit-variants
- **[reco]** `100svh` pour les écrans « plein cadre » (hub `/`) : stable, ne saute pas quand la barre Safari se replie. `100dvh` recalcule pendant le scroll → relayout, à réserver à un overlay plein écran (menu ouvert). `100vh` sur iOS = la grande hauteur (`lvh`), donc du contenu caché sous la barre au chargement.
- Repère iPhone 14 : écran 2532 × 1170 px à 460 ppi, facteur 3 → **viewport CSS 390 × 844** (moins la barre Safari). — https://support.apple.com/kb/SP873

## 4. Cibles tactiles 44 pt

- **[source]** « En règle générale, un bouton a besoin d'une zone de frappe d'au moins 44x44 pt » (60 × 60 en visionOS). Prévoir aussi un état pressé : sans lui, le bouton « semble ne pas répondre ». — https://developer.apple.com/design/human-interface-guidelines/buttons
- **[reco]** 1 pt iOS = 1 px CSS dans Safari → `min-height: 44px; min-width: 44px` sur liens/boutons de navigation ; pour un lien texte petit, agrandir la zone par `padding` ou un `::after` absolu plutôt que la police. État pressé : `:active` (et `-webkit-tap-highlight-color: transparent` si on dessine le sien).

## 5. Barre d'onglets basse vs barre Safari

- **[source]** HIG iOS 26 : « une barre d'onglets flotte au-dessus du contenu en bas de l'écran » (Liquid Glass) ; viser **5 onglets ou moins**. — https://developer.apple.com/design/human-interface-guidelines/tab-bars
- **[source]** Safari iOS 26 a cessé d'utiliser `<meta name="theme-color">` ; la teinte des barres vient du fond de `html`/`body`, et un élément `position: fixed` (dialog, popover, barre) peut l'écraser. Rapport WebKit [300965](https://bugs.webkit.org/show_bug.cgi?id=300965) (REGRESSION iOS 26, dialog backdrop) — résolu, version du correctif non confirmée. Aucun article officiel WebKit ne documente ce comportement (le billet [Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) n'en parle pas) → **fiabilité moyenne, à tester sur l'iPhone**.
- **[reco]** Le site n'a que 3 destinations (accueil, TRAVAIL, MAISON) : une barre basse fixe ferait doublon avec la barre d'URL de Safari, elle aussi en bas sur iOS 26. Préférer une **entête compacte** + liens dans le hub. Si une barre basse est retenue au prototype : `position: fixed; bottom: 0` + `padding-bottom: env(safe-area-inset-bottom)`, et donner à `html`/`body` la couleur de fond voulue pour la teinte Safari (ne pas compter sur `theme-color`).

## 6. `backdrop-filter` (verre dépoli) et son coût

- **[source]** Safari 18 : plus besoin du préfixe `-webkit-`. — https://webkit.org/blog/15443/news-from-wwdc24-webkit-in-safari-18-beta/ · Baseline 2024 (MDN).
- **[source]** Piège : le flou ne voit que ce qui est derrière lui jusqu'au plus proche **backdrop root** (`opacity < 1`, `filter`, `mask`, `clip-path`, autre `backdrop-filter`, `mix-blend-mode`, ou `will-change` sur ces propriétés). Un parent en `opacity: .9` rend le flou invisible. — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter
- MDN et WebKit ne publient **pas** de chiffres de coût. **[reco]** Le flou est recalculé à chaque image où le fond bouge : 1–2 surfaces floues fixes (entête, éventuelle barre) restent raisonnables ; jamais sur chaque carte d'une liste qui défile. Rayon de flou modéré (`blur(12px–20px)` + `saturate(1.4)`). Garder les deux déclarations (`-webkit-backdrop-filter` puis `backdrop-filter`) tant que la cible inclut iOS 17. Mesurer au prototype B.

## 7. View Transitions sur Safari (morph `fiche-<slug>`)

- **[source]** View Transitions même document : Safari / iOS Safari **18.0+**. — https://caniuse.com/view-transitions · https://webkit.org/blog/15443/news-from-wwdc24-webkit-in-safari-18-beta/
- **[source]** Safari 18.2 ajoute les transitions entre documents (`@view-transition`), `view-transition-name: auto`, les classes et types de transition. — https://webkit.org/blog/16301/webkit-features-in-safari-18-2/
- **[source]** Next.js 16 : `<ViewTransition>` de React marche dans l'App Router sans configuration ; elle utilise les types et `view-transition-class`, « certaines animations peuvent se comporter différemment dans Safari » ; sans support, la page change sans animer. — `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`
- **[source]** Safari 26.0 corrige un `<canvas>` qui disparaissait une image pendant une view transition, et fait de `will-change: view-transition-name` un backdrop root. — https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- **[reco]** Le morph `fiche-${slug}` existant (`components/proto/etudes.tsx`, `experience.tsx`, `atelier.tsx`) est reconduisible sur mobile tel quel (iOS 18+). Vérifier à l'œil sur iPhone ; les noms doivent rester uniques par page.

## 8. Défilement inertiel et Lenis sur iOS

- **[source]** Lenis : `syncTouch` vaut `false` par défaut ; l'activer « peut être instable sur iOS < 16 » ; Lenis « tourne sur le scroll natif ». — https://github.com/darkroomengineering/lenis
- Constat dans le dépôt : `components/proto/smooth.tsx` crée Lenis avec `touchMultiplier: 1.7` et **sans** `syncTouch` → au doigt, le défilement reste natif (vérifié dans `node_modules/lenis/dist/lenis.mjs` : sans `syncTouch`, un événement tactile retombe sur le scroll natif, ligne `if (!(this.options.syncTouch && isTouch || …))`) ; mais la boucle rAF tourne en permanence, pour rien sur téléphone.
- **[reco]** Sur téléphone, ne pas monter `<Smooth />` du tout (ou ne lancer la boucle que si `matchMedia("(pointer: fine)")`) : l'inertie native d'iOS est celle que l'utilisateur attend, et une boucle rAF permanente coûte de la batterie. Pas de `syncTouch: true`.
- **[reco]** Pour les effets liés au scroll, préférer les scroll-driven animations CSS (`animation-timeline: view()`), supportées depuis Safari 26 et calculées hors du thread JS. — https://webkit.org/blog/17333/webkit-features-in-safari-26-0/

## 9. `prefers-reduced-motion`

- **[source]** HIG : « rendre le mouvement optionnel ». — https://developer.apple.com/design/human-interface-guidelines/motion
- **[source]** La doc Next (`view-transitions.md`, « Respecting reduced motion ») coupe les animations de view transition sous `@media (prefers-reduced-motion: reduce)`, en suggérant de garder les fondus et retirer les déplacements.
- **[reco]** Sous `reduce` : morph `fiche-<slug>` → simple fondu ; pas de parallaxe ; Lenis déjà coupé (fait dans `smooth.tsx`).

## 10. Fontes et poids

- **[source]** HIG : texte iOS par défaut **17 pt**, minimum **11 pt** ; une fonte à graisse fine doit être plus grande que ces tailles ; permettre un agrandissement du texte (idéalement jusqu'à 200 %). — https://developer.apple.com/design/human-interface-guidelines/typography · https://developer.apple.com/design/human-interface-guidelines/accessibility
- Constat : les fontes passent par `next/font/google` (auto-hébergées au build) — Michroma, Silkscreen sur /work et /home ; Archivo, JetBrains Mono, Noto Sans JP au layout.
- **[reco]** Corps de texte mobile ≥ 16 px (en dessous, Safari zoome au focus d'un champ), 17 px pour le texte courant ; Michroma/Silkscreen (affichage, pixel) réservées aux titres et étiquettes ≥ 12 px ; tailles en `rem` pour suivre le réglage de taille du texte. Charger seulement les graisses utilisées (chaque graisse = un fichier).

## Questions ouvertes (à trancher au prototype)

- La teinte des barres Safari iOS 26 avec un élément fixe : à constater sur l'iPhone de Hugo (comportement non documenté officiellement).
- Coût réel du `backdrop-filter` du prototype B sur iPhone 14 : à mesurer à l'écran (le headless ment sur les temps).
