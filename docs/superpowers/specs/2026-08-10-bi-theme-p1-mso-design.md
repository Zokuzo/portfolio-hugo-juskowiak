# Bi-thème — clair McLaren P1 MSO / sombre conservé — design

Date : 2026-08-10
Statut : proposé, en attente d'arbitrage Hugo (chantier GitHub #13)

## But

Donner au document un thème clair aux couleurs de la McLaren P1 MSO — papier
blanc, encre carbone, accent bleu MSO qui REMPLACE le rouge — sans toucher un
pixel du thème sombre actuel, qui reste le défaut.

L'issue #13 conditionne l'implémentation aux correctifs des tickets 20 et 31.
Le ticket 31 (le retour sur la card) est en cours de traitement ce jour même
dans une autre session : ce spec n'en dépend pas, mais l'implémentation
attendra sa fermeture. Les deux rapports d'exploration du 2026-08-07 cités
par l'issue ne sont plus sur disque — chacune de leurs affirmations a donc
été RE-VÉRIFIÉE contre le code au 2026-08-10 ; c'est l'objet de la section
suivante, et aucun chiffre de ce spec n'est repris d'un rapport disparu.

## État vérifié au 2026-08-10

Recomptages faits sur `app/planche.css` (3 931 lignes ce jour — le fichier
bouge, la carte interdit de citer un compte sans le refaire).

1. **« ~94 % des couleurs passent par les jetons » — confirmé : 93,8–94,1 %.**
   303 consommations `var(--…)` de jetons de couleur (y compris l'alias
   `--focus: var(--paper)`), contre 19 valeurs de couleur écrites en dur à des
   sites d'usage, plus 1 jeton local (`--floor-line`, `planche.css:458`)
   défini hors du bloc de `.proto-root`. Les masques de `.floor-plane`
   (`planche.css:440-441`) ne comptent pas : un `mask-image` ne lit que
   l'alpha, ces « couleurs » sont neutres au thème. S'y ajoutent, hors CSS,
   3 attributs `stroke` en dur dans `components/proto/world.tsx:189,196,202`.
   La liste complète des sites est au §6.

2. **« Deux précédents de bloc de redéfinition » — confirmé, et précisé.**
   `@media (prefers-contrast: more)` redéfinit 6 jetons sur `.proto-root`
   (`planche.css:1572-1581`) ; `@media (forced-colors: active)` en redéfinit
   14 **et ajoute 2 règles de site** (`.t-axis text`, `.p-void` —
   `planche.css:1586-1615`). Un troisième bloc contextuel existe
   (`max-width: 720px`, `planche.css:1625-1628`) mais ne redéfinit qu'une
   mesure (`--gutter`). Le précédent forced-colors est le modèle exact de ce
   chantier : des jetons, plus une poignée de surcharges de site assumées.

3. **« Les 6 gris, ~101 sites » — confirmé.** Le bloc NEUTRES déclare six
   gris entre l'encre et le papier : `--g-100/300/500/700/800` et `--steel`
   (`planche.css:27-32`). Sites relevés : g-100 27, g-300 26, g-500 34,
   g-700 14 — soit **101** dans `planche.css`, plus un `var(--g-700)` dans
   `components/proto/plaque.tsx:199`. `--g-800` n'a **aucun** site
   (défini, jamais consommé) ; `--steel` en a un seul, la rampe chrome.
   `--off` (4 sites) est gris aussi mais rangé aux états non chromatiques.

4. **« Le grain est en `mix-blend-mode: screen` » — confirmé.**
   `.p-grain { mix-blend-mode: screen }`, `planche.css:601`. La texture
   `/monde/grain.webp` est mesurée ce jour au bruit clair : luminance
   119–216, moyenne 176,5/255 (ffmpeg signalstats) — cuite pour `screen`.

5. **La loi encre/lampe — retrouvée, citée.** En tête de fichier,
   `planche.css:4-12` : « `--sig` l'ENCRE, elle ne vit que sur `--paper` /
   `--sig-hot` la LAMPE, elle ne vit que sur `--ink` […] LOI : SUR LE NOIR,
   LE ROUGE S'ALLUME — IL N'ÉCRIT JAMAIS. POUR ÉCRIRE EN ROUGE, POSER
   D'ABORD DU PAPIER. » Les deux états ne se touchent jamais (1,164:1 l'un
   contre l'autre). Sites : `--sig-hot` 24, `--sig` 3 (`::selection`,
   `.ref`, `.count`).

Tous les ratios de contraste de ce spec sont calculés par la méthode WCAG 2
et le calcul est ÉTALONNÉ : il reproduit au millième les quinze ratios déjà
écrits dans `planche.css` (17,596 ; 14,218 ; 8,393 ; 5,127 ; 1,696 ; 1,174 ;
5,169 ; 3,404 ; 3,962 ; 4,441 ; 2,429 ; 1,491 ; 2,658 ; 1,011 ; 1,164).

## Hors périmètre

La 3D manipulable à la souris (chantier #12, budget de frame différent) ; le
contenu des fiches et des feuilles ; un troisième thème ; le renommage des
jetons (`--ink`/`--paper` gardent leurs noms, voir §2) ; toute retouche
visuelle du thème sombre — il doit sortir de ce chantier identique à l'œil.

## 1 — Le bloc de redéfinition : forme et place

Le thème clair est **un bloc de redéfinition de jetons sur `.proto-root`,
plus une poignée de surcharges de site**, sur le modèle exact du bloc
forced-colors (14 jetons + 2 règles, `planche.css:1586-1615`).

- **Sélecteur à spécificité nulle ajoutée** : le bloc s'écrit sous
  `@media (prefers-color-scheme: light)` (option a du §8) ou sous
  `:where(html.clair) .proto-root` (options b/c) — `:where()` maintient la
  spécificité à celle du bloc de base (0,1,0). Sans cette précaution, un
  `html.clair .proto-root` (0,2,1) **battrait les blocs forced-colors et
  prefers-contrast**, qui doivent garder le dernier mot.
- **Ordre dans le fichier** : le bloc clair se place APRÈS le bloc de jetons
  de base et AVANT les blocs `prefers-contrast` et `forced-colors`, pour que
  ces deux-là gagnent par ordre à spécificité égale.
- Le bloc `prefers-contrast: more` actuel est réglé pour le sombre
  (`--g-500: #8f949e` est un gris CLAIR) : il lui faut une contrepartie
  claire, sinon un visiteur en contraste renforcé + thème clair reçoit des
  valeurs calibrées pour l'encre. Six valeurs à recalculer contre le papier,
  même méthode qu'au §5.
- `html,body { background: #07080b }` (`planche.css:107-110`) vit HORS de
  `.proto-root` et ne peut pas consommer les jetons : le bloc clair porte sa
  règle jumelle.

## 2 — Fond et écriture : l'inversion pure des neutres

- Fond du thème clair : `--ink: #f2f0ec` — **le papier du système,
  inchangé**. Écriture : `--paper: #07080b` — l'encre du système.
- POURQUOI l'inversion pure : le ratio WCAG est symétrique dans la paire,
  donc le couple écriture/fond conserve EXACTEMENT ses 17,596:1 sans une
  valeur neuve ; et la contrainte de la carte — aucune teinte nouvelle —
  est tenue à la lettre, le thème clair n'introduisant que des neutres
  recalculés et un seul bleu (§3).
- Les NOMS ne bougent pas. `--ink` veut dire « le fond », `--paper`
  « l'écriture » — des rôles, plus des matières. En clair, les noms mentent
  (`--ink` est blanc) : c'est le prix pour ne toucher AUCUN des 303 sites
  consommateurs, et il s'écrit en un commentaire dans le bloc. Un renommage
  repo-entier serait un diff de plusieurs centaines de lignes pour zéro
  pixel.
- Variante si Hugo veut « l'encre carbone » au sens littéral : l'écriture en
  `#0b0e14` — le CARRO de la carrosserie sombre (`scene.html:35`) — donne
  16,972:1. Écart avec l'inversion pure : 0,6 point, indiscernable ; à
  trancher d'un mot.
- Second lit : `--ink-2` (1,025:1 contre le fond en sombre) devient
  `#edebe7` (1,046:1 contre le papier — un cran vers l'encre, même geste de
  décollement). `--g-800` (lit neutre, 0 site aujourd'hui) suit au §5.

## 3 — Le bleu MSO remplace le rouge (verrou mono-accent)

Le bleu ne s'AJOUTE pas au rouge : dans ce thème, il le remplace. Un thème,
un accent — le verrou de `planche.css:56-66` tient dans les deux mondes.

Le point de départ est **la teinte du modèle 3D**, lue ce jour dans le
`.glb` (`~/PP/modeles-3d/free_-_mclaren_p1_mso.glb`, matériau `Blue`,
`baseColorFactor` linéaire [0, 0.2171, 0.8]) : **#0080e7** en sRGB, sans
texture — la même valeur que la table `RETOUCHES` neutralise pour le sombre.

Ratios calculés, au chiffre près :

| Jeton clair | Candidat | Ratio | Rôle et seuil |
|---|---|---|---|
| `--sig-hot` | `#0080e7` (le bleu du modèle, tel quel) | 3,520 sur papier · 4,821 sur carbone | marque d'état non textuelle, seuil 3:1 (WCAG 1.4.11) — passe sur les deux substrats |
| `--sig` | `#0066b7` (le même bleu, assombri à iso-teinte) | 5,148 sur papier | texte accentué, seuil 4,5:1 — parité avec les 5,169 du rouge |
| `--sig-dim` | `#a4ccea` | 1,488 sur papier · dim→hot 2,366 | le lit anti-vibration, parité avec 1,491 |
| `--sig-ember` | `#f0efec` | 1,010 sur papier | la braise : chaleur sans couleur, parité avec 1,011 |
| `--sig-rail` | `rgba(0,128,231,0.30)` | composite 1,446 sur papier | même alpha qu'en sombre (composite sombre : 1,272) |
| `--sig-veil` | `rgba(0,102,183,0.10)` | composite 1,151 sur papier | le voile (sombre : 1,039) |
| `--sig-glow` | `transparent` (proposé) | — | voir §4 : la lampe n'éblouit pas en plein jour |

**Le bleu du modèle ne passe PAS le seuil texte sur papier** (3,520 < 4,5) —
il est dit, et c'est pour ça que `--sig` est son assombrissement `#0066b7`
et non le bleu brut. À l'inverse, le bleu brut écrit légalement sur le
carbone (4,821 ≥ 4,5), ce que le §4 exploite. Les deux bleus ne se touchent
jamais (1,462:1 l'un contre l'autre — au contact, un bug de rendu, même
diagnostic qu'en sombre à 1,164).

## 4 — La loi encre/lampe, ré-arbitrée pour le papier

En sombre, le sol du document est l'encre : la lampe y est l'état courant,
et l'encre n'existe que sur les deux cartouches papier. En clair, le sol EST
le papier : l'accent chaud perd son substrat. La loi ne meurt pas, elle se
transpose :

> SUR LE PAPIER, LE BLEU DÉSIGNE — IL N'ÉCRIT EN VIF JAMAIS.
> POUR ALLUMER LE BLEU, POSER D'ABORD DU CARBONE.

- Les 24 sites de `--sig-hot` (rails, plans de coupe, index, cotes) restent
  des marques NON textuelles : le bleu vif `#0080e7` y passe le seuil 3:1
  sur papier (3,520). Rien à réécrire, la redéfinition suffit.
- Les cartouches `.ref` et `.count` s'inversent : les deux seuls îlots
  papier du document sombre (`planche.css:1145-1147` en plafonne le nombre à
  DEUX) deviennent les deux seuls îlots carbone du document clair — le lit
  `var(--paper)` devient carbone tout seul, et c'est là, et là seulement,
  que le bleu vif écrit : 4,821 ≥ 4,5. Surcharge de site n° 1 :
  `color: var(--sig-hot)` sur `.ref`/`.count` dans le bloc clair (sans elle,
  l'encre bleue sur carbone tombe à 3,297 — échec).
- `::selection` (`planche.css:128-131`) garde son lit `--sig` mais son texte
  doit être le clair du thème : surcharge n° 2, `color: var(--ink)` — texte
  papier sur bleu foncé, 5,148. Sans elle : carbone sur bleu foncé, 3,297 —
  échec.
- `--sig-glow` : un halo lumineux n'existe pas en plein jour — sur papier,
  un glow est une bavure. Proposé `transparent`, comme le fait déjà le bloc
  forced-colors (`planche.css:1593`) ; la barre de progression garde ses
  deux autres canaux (rail + lit). Si Hugo tient à une lueur, candidat de
  repli : le bleu vif à alpha réduit, réglé à l'œil.
- `--focus` reste l'alias de `--paper` : l'anneau devient carbone, vérifié
  contre les fonds du thème — 16,972 sur papier, 4,821 sur le bleu vif,
  seuil 3:1 (WCAG 2.4.11). La propriété du sombre (« vérifié contre TOUS
  les fonds ») survit à l'inversion.

## 5 — Les six gris et les filets, recalculés contre le papier

Les ratios de rôle sont la contrainte ; les teintes exactes sont des
candidats (cast froid conservé — « le froid porte la machine »,
`planche.css:21`), ajustables à la relecture tant que les ratios tiennent.

| Jeton | Sombre (ratio vs encre) | Clair candidat (ratio vs papier) |
|---|---|---|
| `--g-100` | `#dcd9d3` (14,218) | `#1e2126` (14,185) |
| `--g-300` | `#a3a8b2` (8,393 — plancher du 9 px) | `#434549` (8,440) |
| `--g-500` | `#7c818c` (5,127 — plancher absolu du texte) | `#646567` (5,126) |
| `--g-700` | `#33383f` (1,696 — filet, jamais de glyphe) | `#bbbab9` (1,703) |
| `--g-800` | `#191c22` (1,174 — lit neutre, 0 site) | `#e0dfdb` (1,172) |
| `--steel` | `#171b2e` (bande sombre du chrome) | suit la décision rampe, §7 |
| `--off` | `#4a4f57` (2,429) | `#9b9b9b` (2,442) |

Les filets `--line/--line-2/--line-3` sont des `rgba` : on égale la DENSITÉ
COMPOSITE, pas l'alpha. Composites sombres contre l'encre : 1,206 / 1,522 /
2,642. Candidats clairs sur base `rgb(23,27,46)` (le steel, encre froide) :
alphas **0,095 / 0,205 / 0,430** → composites 1,206 / 1,524 / 2,641 contre
le papier. Le 1,206 n'est pas décoratif : c'est le ratio que le commentaire
du tracé cite pour distinguer le plan du bâti (`planche.css:1444-1448`) —
il se conserve à l'identique.

## 6 — Ce qui ne passe pas par les jetons : les sites à traiter

L'inventaire du recomptage n° 1, exhaustif. Trois familles :

**a) Une valeur récurrente à promouvoir en jeton** — le lit
`rgba(226,232,240,0.08)` apparaît 5 fois (`.node .chip` :1368, `.ov-mark`
:1762, `.fp-lang [aria-pressed]` :2293, `.fp-mark` :2305, `.at-code` :3630).
Un jeton (`--chip`, nom à confirmer au style du fichier) + une redéfinition
claire. La promotion se prouve INERTE en sombre avant d'être committée
(méthode du ticket 22 : chaque changement prouvé sans effet au CSS compilé).

**b) Des valeurs uniques : règle jumelle dans le bloc clair** (ou jeton si
un second usage apparaît) —

| Site | Valeur sombre | Devenir en clair |
|---|---|---|
| `html,body` :109 | `#07080b` | règle jumelle papier (§1) |
| `.chrome` :235 | text-stroke `rgba(255,255,255,0.22)` | arête d'encre — suit la décision rampe, §7 |
| `.chrome-bed::before` :252 | `rgba(226,232,240,0.055)` | lueur froide → version encre, avec la rampe |
| `.p-void` :360-361 | 2 lobes `rgba(255,255,255,…)` | lobes d'encre sur papier, OU suppression en clair (la lumière du soir n'existe pas en plein jour) — à trancher, voir Hugo |
| `--floor-line` :458 | `rgba(226,232,240,0.42)` | jeton local : redéfinition jumelle sur `.floor-grid` |
| `.p-dust` :555 | `rgba(242,240,236,0.5)` | poussière d'encre |
| `.p-scrim` :567 | 2 × `rgb(7 8 11 / …)` | voile de papier (il assoit le plancher de contraste, rôle inchangé) |
| `.node.on rect` :1376 | stroke `rgba(226,232,240,0.62)` | trait d'encre à densité équivalente |
| `.node.on .chip` :1394 | `rgba(226,232,240,0.16)` | idem |
| `.tel-b0/b1/b2` :2922-2928 | alphas 0,022 / 0,045 / 0,07 | escalier d'encre, mêmes rapports |

**c) Des corrections valables dans les DEUX thèmes** —
`.ov-bore-hole` :1948 porte `rgba(226,232,240,0.34)` qui est exactement la
valeur de `--line-3` : remplacer par `var(--line-3)` (et le site suit les
thèmes gratuitement). Les 3 attributs `stroke` de `world.tsx:189,196,202`
passent en classes stylées dans `planche.css` — un attribut de présentation
SVG ne consomme pas de `var()` et resterait clair sur papier.

Neutres au thème, aucun changement : les masques `.floor-plane` :440-441
(l'alpha seul compte) et les deux règles du bloc forced-colors :1609,1613
(le système reprend la main dans les deux thèmes).

## 7 — La rampe chrome sur papier

`--chrome-ramp` est un jeton (2 consommations : le titre et la pièce
isométrique) : redéfinissable en bloc. Mais ses valeurs ne s'inversent pas
mécaniquement — le problème est mesuré : la bande `#ffffff` fait 1,138:1
contre le papier, un spéculaire invisible, et le rapport bande claire /
bande sombre du sombre (17,036, cité `planche.css:196-200`) n'est pas
atteignable en plein jour sans bandes quasi noires.

Décision de méthode, pas de valeurs : la rampe claire garde sa STRUCTURE
(mêmes arrêts en `em`, même cyclicité — tout ce que `.chrome`, `.f-num` et
`.ov-face` supposent) et déplace sa PLAGE vers le sombre — le plancher reste
`--steel` (14,968 contre papier), le plafond descend vers ~`#b6b6bd`
(1,772 contre papier, assez pour se voir, assez peu pour rester un reflet).
Les onze arrêts se règlent à l'œil au navigateur, comme la matière de la P1
s'est réglée à l'essai — c'est prévu par ce spec, et le gate est visuel :
le chiffre en chrome doit encore se lire comme du métal, pas comme une
rayure grise. Le `text-stroke` de `.chrome` et la lueur de `.chrome-bed`
suivent le même réglage.

## 8 — Le mécanisme de bascule : les options et leurs coûts réels

Vraie décision pour Hugo — aucune n'est imposée par la technique.

- **(a) `prefers-color-scheme` seul.** Le bloc s'écrit en `@media`, forme
  identique aux deux précédents du fichier. Coût : zéro JS, zéro stockage,
  zéro FOUC (le média s'applique au premier rendu), zéro écart
  d'hydratation (le HTML servi ne change pas). Limite : le visiteur ne
  choisit pas — Hugo démontre en basculant l'OS.
- **(b) Interrupteur manuel seul.** Coût réel : un script inline dans le
  `<head>` qui pose la classe AVANT la première peinture (sans lui, flash
  sombre→clair à chaque chargement — le site est statique, le serveur ne
  connaît pas le choix) ; `suppressHydrationWarning` sur `<html>` (la
  classe serveur diffère de celle posée par le script) ; `localStorage`
  (un cookie ne servirait à rien en rendu statique) ; un bouton avec ses
  chaînes `dict.ts` FR **et** EN, cible clavier, focus visible.
  Emplacement naturel : la topbar, à côté du `.langtoggle` — le précédent
  de bascule visible du site. `<html>` porte déjà `className="dark"`
  (`layout.tsx:63`), lu par la `@custom-variant` de `globals.css` : la
  classe de thème s'accroche là.
- **(c) Les deux** : média par défaut, interrupteur qui écrase (3 états ou
  2). Coûts de (b) plus la logique d'état.

Séquençage proposé, si utile à la décision : (a) livre le chantier CSS
entier et se démontre ; (b/c) s'ajoute ensuite sans rien réécrire du bloc
— seul le sélecteur du bloc change (`@media` → `:where(html.clair)`, §1).

## 9 — Le grain passe en `multiply`

`screen` éclaircit sur l'encre ; sur papier le même grain doit ASSOMBRIR.
Le bloc clair porte `mix-blend-mode: multiply` sur `.p-grain` (une règle de
site, comme les deux du bloc forced-colors).

La texture actuelle est biaisée claire (119–216, moyenne 176,5 — mesuré au
§ vérifications) : sous `multiply` à opacité 0,085, elle pose le grain PLUS
un voile moyen de ~2,6 % ((1 − 176,5/255) × 0,085). Si ce voile se voit, la
retouche se fait DANS la texture et jamais en `filter` (interdit et mesuré,
`planche.css:586-597`) : la source SVG du grain est dans
`tools/monde/cuire.md`, un `feComponentTransfer` la recentre et on recuit
une seconde image (`--grain-tex` est un jeton, le bloc clair pointerait
`grain-clair.webp`). Décision à l'œil, texture unique d'abord.

Au passage : le commentaire `planche.css:292-294` cite « grain, poussière »
en `screen` alors que `.p-dust` ne porte aucun blend — à rafraîchir.

## 10 — La seconde séquence voiture

La livrée MSO blanche/bleue est RÉSERVÉE au thème clair depuis le spec P1
(`2026-08-07-mclaren-p1-remplacement-design.md`, hors périmètre) et le plan
consigne que « la séquence claire se re-rendra avec les mêmes réglages
(seul le studio change) » (plan P1, Tâche 8 Step 4).

- **Rendu** : même pipeline, mêmes drapeaux que la séquence promue
  (`--nb=160 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg`),
  même pose 140 / assiette −12 — les constantes de `voiture.tsx` sont
  SOLIDAIRES du rendu (`voiture.tsx:92-95`) et servent aux deux séquences.
  Ce qui change dans `scene.html` : la table `RETOUCHES` claire ne retouche
  NI `WhitePaintjob` NI `Blue` (la livrée d'origine est le but — le blanc
  du modèle est le défaut glTF, le bleu est le `#0080e7` du §3) ; et le
  `studio()` s'inverse — boîte claire, bandes SOMBRES : sur une carrosserie
  blanche, c'est la bande sombre qui dessine l'arête (« une arête ne se
  voit que si elle a une bande à réfléchir », `scene.html:76-83`, le
  principe survit au signe). Un drapeau `--studio=clair` sélectionne le jeu,
  pour que la commande consignée dans `CREDIT.txt` reste rejouable ; réglage
  à l'essai `--nb=8`, à l'œil, comme la Tâche 4 du plan P1. Toujours
  `--dest`, jamais sans (piège du ticket 21).
- **Cohabitation** : la séquence sombre reste à `public/voiture/*.webp`
  (déplacer 160 binaires ne rapporte rien et déjoue `CREDIT.txt` et le
  contrat d'intégration) ; la claire entre dans `public/voiture/clair/`,
  160 fichiers `000-159.webp`, couverts par la règle `*.webp binary` du
  `.gitattributes`. `CREDIT.txt` gagne une seconde section Fabrication —
  même licence CC-BY-NC-SA, même attribution, la séquence claire est une
  adaptation de plus du même modèle.
- **Poids** : la référence sombre est re-mesurée ce jour — **4 224 588
  octets pour 160 fichiers, max 045.webp à 29 954 o** (identique à la
  décision du ticket 18). La claire est ATTENDUE du même ordre (~4,2 Mo :
  même plafond de 30 Ko/image, même dichotomie de qualité) mais sera
  MESURÉE à la passe — une carrosserie blanche ne compresse pas forcément
  comme une carbone, et ce spec n'invente pas le chiffre. Le dépôt grossit
  d'autant ; la PAGE, elle, ne grossit pas (point suivant).
- **On ne télécharge QUE la séquence du thème actif**, et c'est une
  propriété DÉJÀ ACQUISE du composant : `voiture.tsx` ne charge rien en
  bloc — chaque image part d'un `fetch(SRC(i))` à la demande
  (`voiture.tsx:365-368`), sous une fenêtre de 20/5 voisines
  (`voiture.tsx:436-437`), et une seule image sous `reduce`
  (`voiture.tsx:472`). Il suffit que `SRC` préfixe le chemin selon le thème
  lu au montage. Bascule à mi-session : remonter le composant par une clé
  (`key={theme}`) — le démontage ferme déjà tous les bitmaps
  (`voiture.tsx:474-478`) ; coût d'une bascule, le refenêtrage, ~660 Ko.
- **Dosage** : l'opacité 0,72 de la toile (`planche.css:3871`) est calibrée
  pour du carbone sur encre. Une carrosserie blanche sur papier à 0,72
  risque de s'effacer — le dosage clair se règle à l'œil, jeton ou règle
  jumelle selon la valeur retenue.
- Au passage : `rendu.mjs:2-4` dit encore « la séquence en production en
  compte 120 » — périmé depuis le ticket 18, à corriger en touchant l'outil.

## Fichiers touchés

| Fichier | Changement |
|---|---|
| `app/planche.css` | bloc clair (jetons + surcharges §4/§6/§9), jeton `--chip`, `.ov-bore-hole` → `var(--line-3)`, contrepartie claire du bloc contraste, commentaires §9 |
| `app/layout.tsx` | classe de thème sur `<html>` + script anti-FOUC (selon §8) |
| `components/proto/world.tsx` | 3 attributs `stroke` → classes |
| `components/proto/voiture.tsx` | `SRC` par thème, remontage par clé, commentaires |
| `components/proto/dict.ts` | libellés de l'interrupteur FR/EN (si §8 b/c) |
| `tools/voiture/scene.html` | `studio()` clair derrière `--studio`, table `RETOUCHES` claire |
| `tools/voiture/rendu.mjs` | transmission de `--studio`, commentaire « 120 » corrigé |
| `public/voiture/clair/*.webp` | 160 images neuves |
| `public/voiture/CREDIT.txt` | seconde fabrication, poids mesurés |
| `tools/controles/` | contrôle de contrastes rejouable (proposé : le calcul étalonné de ce spec) |

## Vérification

- **Contrastes** : chaque valeur retenue re-passe le calcul étalonné ; les
  seuils du tableau §3/§5 sont des gates, pas des intentions. Le calcul
  entre dans `tools/controles/` pour être rejouable.
- **Le sombre ne bouge pas** : chaque promotion de jeton (§6a, §6c) est
  prouvée inerte sur le CSS compilé avant commit (méthode du ticket 22) ;
  contrôle visuel final du thème sombre.
- **Budget** : `node tools/banc/frame.mjs <url> bi-theme-clair --tete` sur
  le build de production en clair, comparé en % de frames au-dessus de
  8,3 ms, à plancher de cadence égal seulement (leçon des tickets 30/32).
  Un thème est du CSS recalculé une fois : un écart net est un signal à
  chercher, pas à noter.
- **`reduce`** : `node tools/controles/controle-reduce.mjs` rejoué en
  clair ; une seule requête `/voiture/` sous `reduce`, la pose figée.
- **Réseau** : en clair, aucune requête vers `public/voiture/*.webp`
  racine ; en sombre, aucune vers `clair/` ; à la bascule, l'autre fenêtre
  part et l'ancienne ne fuit pas.
- **FOUC** (si §8 b/c) : rechargement à froid en thème non-défaut, aucun
  flash.
- **À l'œil, gates Hugo** : le studio clair à l'essai 8 images ; la rampe
  chrome (du métal, pas une rayure) ; le grain en `multiply` (du grain, pas
  un voile) ; le dosage de la voiture claire.

## Points de vigilance

- La spécificité du bloc clair contre forced-colors et prefers-contrast
  (§1) — le piège est silencieux, il ne casse que chez les visiteurs qui
  cumulent les préférences.
- Les cartouches inversés restent plafonnés à DEUX (`planche.css:1145-1147`
  : la règle des îlots vaut dans les deux sens).
- L'escalier clair est plus court que le sombre (dim→hot 2,366 contre
  2,658) : le bleu vif plafonne à 3,520 sur papier là où la lampe rouge
  faisait 3,962 sur encre. Assumé et documenté, pas caché.
- `--g-800` n'a aucun site : il se recalcule quand même (jeton public du
  bloc), mais personne ne verra une erreur — le contrôle de contrastes le
  couvre.
- Les lobes de `.p-void` et le sort du glow sont des décisions d'ambiance,
  pas de mécanique : ils sont listés chez Hugo, pas tranchés ici.

## Ce qui reste à trancher par Hugo

1. **Le mécanisme de bascule** (§8 : a, b ou c) — et, si interrupteur,
   confirmation de son emplacement en topbar près du `.langtoggle`.
2. **L'écriture claire** : inversion pure `#07080b` (proposée) ou carbone
   littéral `#0b0e14` (16,972:1) — un mot suffit.
3. **Le sort du glow en clair** : `transparent` (proposé) ou lueur bleue
   atténuée réglée à l'œil.
4. **Les lobes d'atmosphère de `.p-void` en clair** : version encre, ou
   suppression (pas de lumière du soir en plein jour).
5. **Les réglages à l'œil qui gate** : studio clair, onze arrêts de la
   rampe chrome, grain `multiply` (recuisson ou non), dosage de la voiture
   claire.
