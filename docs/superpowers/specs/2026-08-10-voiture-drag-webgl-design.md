# La voiture manipulable à la souris — WebGL au drag — design

Date : 2026-08-10
Statut : à valider par Hugo — chantier GitHub #12
Demandé par Hugo le 2026-08-10, au côte-à-côte du ticket 18.

## But

Rendre la voiture de l'accueil **saisissable à la souris** sur desktop : au
drag, un rendu WebGL prend le relais de la séquence d'images **au même
azimut**, bascule invisible ; au relâchement, la séquence reprend là où la
main a laissé la voiture. La séquence 160 reste la représentation du scroll,
le socle et le repli — si une seule des gates de ce spec échoue, le chantier
ne sort pas et le site reste exactement ce qu'il est.

## Contexte — pourquoi la doctrine anti-3D ne tombe pas, elle se précise

`voiture.tsx:10-15` interdit la 3D temps réel, et son argument est un
argument de **régime** : « un canvas WebGL rendant un matériau réfléchissant
à chaque frame ajouterait une passe complète » — à chaque frame, PENDANT le
scroll, quand le décor, Lenis et les sections consomment déjà le fil
principal. Un drag est un autre régime : pendant la manipulation la page ne
défile pas, la parallaxe du décor est immobile, la respiration est suspendue
(décision 3), et le rendu 3D est déclenché par l'événement de pointeur — au
plus un rendu par frame quand la main bouge, **zéro** quand elle ne bouge
pas. C'est le motif marche/arrêt que `voiture.tsx:279-286` applique déjà à
sa boucle de respiration : rien ne tourne quand il n'y a rien à faire.

État vérifié au 2026-08-10 :

- Séquence en production : **160 WebP**, 4 224 588 o au total, max 29 954 o
  (`public/voiture/CREDIT.txt:29-32`) ; `NB = 160` (`voiture.tsx:67`),
  `POSE = 140` = azimut 315° (`voiture.tsx:97`), fenêtre 20/5
  (`voiture.tsx:436-437`), assiette CSS −12° (`voiture.tsx:98`).
- Le rendu d'origine : caméra fixe FOV 22 (`scene.html:29`), élévation 30°
  (commande de `CREDIT.txt:46-47`), `--depart` absent donc azimut de
  l'image i = **i × 2,25°** ; seule la voiture tourne. Studio aux neuf
  bandes (`scene.html:84-121`), ACESFilmic exposition 1 (`scene.html:67-68`),
  PMREM `fromScene(studio(), 0.02)` (`scene.html:124`), retouches
  `WhitePaintjob`/`Blue`/`Glass` (`scene.html:57-61`).
- Le modèle : `~/PP/modeles-3d/free_-_mclaren_p1_mso.glb`, **70 471 356
  octets** mesurés (`stat -c%s`), soit 67,2 Mio — 73 meshes, 34 textures,
  36 matériaux (spec P1 du 2026-08-07). Licence CC-BY-NC-SA-4.0.
- `three` n'est **pas** une dépendance du site (`package.json:11-20`) : le
  rendu se fait hors ligne, three 0.169 par CDN (`scene.html:11-16`).
- La couche `.voiture` est `position: fixed`, `z-index: 0`,
  **`pointer-events: none`** (`planche.css:3849-3863`) : aujourd'hui rien
  n'y est cliquable, et c'est ce qui protège le texte qu'elle traverse.
- Budget : cible 8,3 ms ; relevé de référence accueil p90 7,40 ms
  (2026-08-06, ticket 30) ; bruit inter-campagnes 2,72–7,07 % à code
  constant, seuil d'alerte **10 % de frames > 8,3 ms à plancher égal**
  (`tools/banc/SEUIL.md`), `--tete` obligatoire.

## Hors périmètre

- Mobile et tactile — exclus par ce spec, pas remis à plus tard : pas de
  souris (le drag y serait un geste tactile qui **se dispute la page avec le
  scroll**, le contraire d'une bascule invisible), et un budget mémoire déjà
  tendu (la fenêtre d'ImageBitmap pèse ~104 Mo, recherche 05 §4 — y ajouter
  un modèle 3D décodé en mémoire GPU sur un mobile milieu de gamme n'a pas
  été mesuré et ne le sera pas dans ce chantier). La séquence reste la seule
  représentation sur tout appareil sans `(hover: hover) and (pointer: fine)`.
- Le zoom / dolly au drag : changer la distance caméra casserait l'échelle
  du raccord et n'apporte rien derrière un titre.
- La rotation au scroll, sa pose, son ressort, son flottement : rien de
  `voiture.tsx` côté scroll ne change de comportement.
- Le bi-thème et la livrée MSO claire (chantier #13).
- Toute animation de la voiture qui ne serait pas la conséquence directe du
  geste.

## 1 — Deux toiles dans la même couche, la séquence reste maîtresse

Le canvas WebGL est une **seconde toile dans le même élément `.voiture`**,
même taille, empilée sur la toile 2D. La bascule est un échange de
visibilité **sec** — pas de fondu croisé : à azimut identique un fondu
n'ajoute rien, et s'il masquait un écart il le cacherait au lieu de le
corriger (le fondu enchaîné a déjà été rejeté au côte-à-côte du 2026-08-10
pour dédoublement des arêtes, `voiture.tsx:124-127`).

Pourquoi le même élément : le conteneur porte l'assiette, la dérive et le
fondu (`voiture.tsx:600`) — les deux toiles en héritent donc à l'identique,
et le raccord ne dépend que du contenu rendu. Et surtout, pas d'ancêtre
transformé nouveau devant un `position: fixed` — le piège que `page.tsx` et
`voiture.tsx:284-287` documentent déjà.

Le fondu reste actif pendant le drag : si le visiteur molette en tenant la
voiture, la page défile et la voiture s'estompe comme d'habitude — le fondu
est un repère de position, pas une décoration (`planche.css:3888-3891`).

## 2 — Le déclencheur : rien ne se télécharge sans un geste de saisie

Le `.glb` optimisé et le chunk three.js ne partent **jamais** vers un
visiteur qui ne drague pas. Le déclencheur est le **premier geste de drag
avéré** : un mousedown sur un pixel opaque de la voiture, suivi d'un
déplacement au-delà d'un seuil de quelques pixels. Pas le mousedown nu — un
clic pour poser le focus ou dissiper une sélection ne doit pas coûter des
mégaoctets.

Les deux autres candidats sont rejetés par la géométrie de la page :

- **Hover** : la voiture occupe `min(72vw, 78vh)` au centre de l'écran
  (`planche.css:3850`) — le curseur la traverse pour aller n'importe où.
  Un hover-déclencheur téléchargerait pour à peu près tout le monde.
- **Idle** : télécharge pour tout le monde, par définition.

L'affordance, elle, est gratuite : curseur `grab` quand le pointeur survole
un pixel **opaque** de l'image courante (un `getImageData` d'un pixel sur la
toile 2D — pas de coût mesurable), `grabbing` pendant le geste. Aucun texte
nouveau ; si Hugo veut un indice écrit, il passe par `dict.ts`, FR et EN
(voir « à trancher »).

**Pendant que le modèle arrive, le drag répond quand même** : le geste
pilote la séquence elle-même, en azimut, au cran de 2,25° — le même calcul
d'offset que la décision 3, zéro octet nouveau, et les crans de 2,25° ne se
voient pas en mouvement (ticket 18). La promotion vers le WebGL attend le
**relâchement** : jamais de changement de régime en cours de geste — la main
qui découvre soudain un axe de plus au milieu d'un mouvement, c'est une
surprise, pas une bascule invisible. Ce mode séquence est aussi le **repli
permanent** : contexte WebGL refusé, `webglcontextlost`, chargement en
échec — le drag azimut-seul reste, sans un message d'erreur.

## 3 — Le protocole de bascule et la réconciliation au relâchement

**Ce que le drag manipule.** Deux axes : l'**azimut**, libre (rotation de
l'objet sur Y, comme au pipeline — « seule la voiture tourne »,
`CREDIT.txt:29`), et l'**élévation**, bornée autour des 30° du rendu
(bornes à régler à l'œil au prototype). L'axe d'élévation est ce qui
justifie le WebGL : un drag azimut-seul est déjà possible avec la séquence
(décision 2) et ne vaudrait pas un modèle de plusieurs mégaoctets.

**À la saisie** : la toile WebGL prend le relais à l'azimut exact de l'index
affiché (`index × 2,25°`, DEPART = 0), élévation 30°, même cadre (décision
4). La respiration s'arrête et l'assiette se repose à `INCLINAISON` — la
mécanique d'arrêt existe (`voiture.tsx:307-315`) : une chose que la main
tient ne flotte pas.

**Pendant le geste** : la séquence ne rend plus, mais sa **veille continue
et suit l'azimut du drag** — la fenêtre 20/5 se recentre sur le cran le plus
proche de l'angle courant, pour que l'image du relâchement soit déjà décodée
quand on en aura besoin. Coût borné : la fenêtre glisse, l'empreinte mémoire
ne bouge pas ; au pire un tour complet télécharge les 160 (4,2 Mo), ce que
le scroll fait déjà.

**Au relâchement** : l'inertie décroît (coupée sous `reduce`, décision 6),
l'élévation revient à 30° — elle le **doit** : la séquence n'existe qu'à
cette élévation — puis l'azimut s'aimante au cran de 2,25° le plus proche
(ajustement ≤ 1,125°, sous ce que le ticket 18 a montré invisible en
mouvement) et la toile 2D reprend, sur cette image-là.

**L'angle laissé par la main PERSISTE.** Le delta entre l'azimut de
relâchement et l'azimut que le scroll dicte devient un **offset en crans**
ajouté au calcul d'index (`voiture.tsx:243`) : la voiture reste où on l'a
posée, et le scroll continue de la tourner à partir de là. Pas de retour
élastique vers l'azimut du scroll : ramener l'objet annulerait le geste
qu'on vient d'offrir, et exigerait une animation de plus — sous `reduce`,
une animation impossible. L'offset absorbe aussi un scroll survenu pendant
le geste : au relâchement on recalcule le delta contre la valeur courante
du ressort, rien d'autre.

## 4 — Le studio aux neuf bandes ne s'écrit qu'une fois

Le risque central du chantier est un écart visible au raccord. La parade
n'est pas de « reproduire » le studio côté client, c'est de **ne plus avoir
deux studios** : la fonction `studio()`, la table `RETOUCHES`, les réglages
de rendu (ACESFilmic, exposition 1, `outputColorSpace` sRGB, PMREM à 0.02,
`environmentIntensity` 1, clear alpha 0) sortent de `scene.html` vers un
module partagé (`tools/voiture/studio.mjs`, qui reçoit `THREE` en paramètre
pour ne jamais dupliquer le moteur), consommé par la page de rendu ET par le
composant client. « Deux copies, c'est une copie qui pourrit » — c'est la
règle que `rendu.mjs:58-59` s'applique déjà à `trouveChrome`. Le serveur
statique de `rendu.mjs` gagne un alias pour servir ce module à `scene.html`.

**La version de three est épinglée à l'exacte** de l'importmap
(`three@0.169.0`, `scene.html:13`) : three change sa gestion de la couleur
d'une version à l'autre, et un pipeline en 0.169 contre un client en 0.1xx
serait un raccord qui dérive sans qu'aucun code n'ait bougé.

**Le cadre est une constante consignée, pas un recalcul.** Le recadrage des
images est l'union des pixels opaques sur les 160 vues (`scene.html:150-176`)
— irrejouable au client. `rendu.mjs:188-189` affiche déjà ce cadre à chaque
campagne ; il n'a pas été consigné pour la séquence en production. Il le
devient (relevé par une exécution de l'outil, consigné dans `CREDIT.txt` et
dans le code client), et le client l'applique par le viewport de la caméra
(`setViewOffset` ou équivalent). Sans lui, la voiture 3D serait à la bonne
pose mais pas à la bonne place dans la toile — le raccord le plus bête qui
soit.

Ce qui restera différent malgré tout, à juger à l'œil au raccord (gate
humain) : le pipeline rend en 2000×2000 puis réduit à 1000×1000 —
« l'antialiasing le moins cher » (`scene.html:27`) — quand le client rendra
à `DPR_MAX` 1,5 avec MSAA. Un léger écart d'arêtes est possible ; c'est le
côte-à-côte au raccord qui dit s'il se voit, pas ce document.

## 5 — Le `.glb` : optimisé, mesuré, et vérifié contre la séquence

Point de départ mesuré : 70 471 356 octets. Cible de l'issue : ~5-8 Mo.
**C'est un objectif, pas une promesse** — aucun poids final ne s'écrit avant
la mesure sur le fichier produit.

- **Outil** : `gltf-transform` (CLI), utilisé hors ligne dans `tools/`,
  comme le reste du pipeline — jamais une dépendance du site.
- **Premier geste : `gltf-transform inspect`** — savoir où vivent les
  67 Mio (géométrie contre 34 textures) avant de choisir quoi presser.
  Toute affirmation « les textures dominent » sans cet inventaire serait
  un fait inventé.
- **Leviers, dans l'ordre du moins destructeur** : élagage (`prune`,
  meshes jamais visibles — l'intérieur derrière un vitrage `#04060a` est
  candidat, à vérifier image contre image, pas sur intuition), soudure et
  quantification, compression géométrie (meshopt ou Draco — meshopt
  pressenti pour éviter le décodeur WASM séparé de Draco, **poids des
  décodeurs à mesurer avant de trancher**), textures redimensionnées et
  transcodées (KTX2 ou WebP — la voiture vit derrière un titre à opacité
  0,72, en retrait : la résolution de texture utile est basse, à établir
  au côte-à-côte).
- **La vérification qui ne pardonne pas** : re-rendre les 160 images avec
  le pipeline existant depuis le `.glb` optimisé, et les comparer aux 160
  de production (diff d'image chiffré + contrôle à l'œil). Un modèle
  optimisé qui ne reproduit pas la séquence ne peut pas raccorder au drag
  non plus — ce contrôle attrape l'élagage trop gourmand et la texture
  trop pressée **avant** d'écrire une ligne de client.
- **Où il vit** : servi au visiteur, donc dans `public/voiture/`, donc
  **committé** — comme les 160 WebP. La règle « le `.glb` n'entre jamais
  dans le dépôt » (plan P1) visait le fichier source de 67 Mio, qui reste
  dehors ; le dérivé web est un asset de production. Règle `binary`
  explicite dans `.gitattributes` (le piège CRLF est arbitré ainsi pour
  les WebP). **Attention licence** : publier le `.glb`, c'est redistribuer
  le modèle adapté — CC-BY-NC-SA le permet avec attribution (que
  `CREDIT.txt` porte déjà et qui sera étendue au fichier), mais ça rend le
  modèle optimisé téléchargeable par quiconque. Ce point remonte à Hugo,
  il ne se tranche pas ici.
- **Gate de poids** : si l'optimisation ne descend pas sous ~8 Mo sans
  écart visible à la vérification ci-dessus, la décision (accepter plus
  lourd, dégrader, abandonner) remonte à Hugo avec les chiffres.

## 6 — La coupure `reduce` : la main reste, tout ce qui continue sans elle se coupe

La doctrine du défilement (`planche.css:1522-1533`, tranchée à l'issue #9)
distingue le mouvement que le défilement CAUSE (coupé) de l'état qu'il EST
(gardé, transitions instantanées). Le drag est un troisième cas, et le plus
simple : un mouvement que la **main** cause et suit en direct. C'est de
l'interaction, pas une animation — au même titre que le défilement lui-même,
que `reduce` n'a jamais désactivé. **Le drag reste donc possible sous
`reduce`.** Le refuser reviendrait à retirer une capacité à quelqu'un qui a
demandé moins de mouvement, pas moins de contrôle.

Ce qui se coupe est tout ce qui continuerait **après** que la main s'arrête :

- l'**inertie** au relâchement — c'est une animation offerte, pas un geste ;
- le **retour d'élévation** vers 30° — instantané au lieu d'animé (« seul le
  passage d'un état à l'autre devient instantané », la doctrine mot pour
  mot) ;
- la respiration, déjà coupée (`voiture.tsx:295`).

Réseau sous `reduce` : le montage continue de ne charger qu'une image
(`voiture.tsx:466-472`). Pendant un drag, la veille suit l'azimut comme en
mode normal — ces requêtes servent le geste demandé, pas un mouvement offert
— et un relâchement sur un azimut nouveau charge l'image de ce cran. Le
`.glb`, lui, obéit au même déclencheur qu'ailleurs : le geste, rien d'autre.

## 7 — Le coût de bundle : zéro octet avant le geste

`three` entre dans `package.json` — et il faut le dire en face :
`scene.html:7-10` refusait cette dépendance parce que le besoin était
ponctuel (fabriquer des images une fois). Le besoin devient du runtime,
l'argument tombe ; ce qui ne tombe pas, c'est l'exigence que le visiteur qui
ne drague pas n'en paie **rien**.

- **Import dynamique, chunk séparé** : tout le régime drag (three, loaders,
  studio partagé, logique de geste) vit dans un module chargé au premier
  geste avéré — le même déclencheur que le `.glb`. `voiture.tsx` n'en garde
  que l'écoute du geste et l'offset d'index.
- **Ce que ça pèse** : le seul chiffre sourcé du dépôt est
  `three.module.js` 0.169 **non minifié, non compressé : 1 304 820 octets**
  (mesuré au curl le 2026-08-05, recherche 05). Le poids réel du chunk
  (minifié + gzip, avec `GLTFLoader` et le décodeur meshopt ou Draco selon
  la décision 5) est **à mesurer au prototype** — aucune fourchette
  inventée ici.
- **Gate mesurable** : le JS initial de l'accueil ne grossit pas d'un octet
  (`next build` avant/après, First Load JS comparé), et un rechargement +
  scroll complet sans drag ne déclenche **aucune** requête vers le chunk ni
  le `.glb` (onglet réseau).

## 8 — Le banc comme gate : pas de 8,3 ms, pas de sortie

Le banc actuel ne mesure que le défilement (`frame.mjs:167-183`, molette).
Il gagne un **scénario drag** : mousedown au centre de la voiture en haut de
page (fondu = 1), série de `mouseMoved` en CDP balayant plusieurs tours et
l'axe d'élévation, relâchement, plusieurs passes — même sonde, même
protocole, `--tete` obligatoire (un compositeur logiciel ne répond pas à une
question posée à 120 Hz, `SEUIL.md`).

Les gates, dans les termes de `SEUIL.md` (jamais des millisecondes brutes
entre planchers inégaux) :

1. **Pendant le drag** : ≤ 10 % de frames au-dessus de 8,3 ms, à plancher
   de cadence égal au témoin. Sinon le prototype ne sort pas — la séquence
   160 reste seule, et le chantier se ferme sur un relevé, pas sur un
   regret.
2. **Hors du drag** : le relevé scroll de l'accueil ne régresse pas
   au-delà de la bande de bruit connue (2,72–7,07 %) — le chantier doit
   coûter zéro tant que personne ne saisit la voiture.
3. **Après le premier drag** : le relevé scroll ne régresse pas non plus —
   le contexte WebGL gardé en mémoire (pour que la re-saisie soit
   instantanée) ne doit rien coûter au fil principal quand il ne rend pas ;
   `renderer.info` (géométries, textures) est relevé et consigné au
   prototype pour connaître l'empreinte GPU réelle — chiffre à mesurer,
   pas à estimer.

Un interrupteur sur le modèle de `SEQUENCE_LIVREE` (`voiture.tsx:33-41`)
permet de retirer le régime drag sans toucher au reste — le repli n'est pas
une promesse, c'est un booléen.

## Points de vigilance

- **`pointer-events: none` ne bouge pas** (`planche.css:3862`). La saisie
  s'écoute au **document** : mousedown dont la cible n'est ni un lien ni un
  élément interactif, ET dont le point tombe sur un pixel opaque de la
  toile (test alpha à un pixel). Rendre la couche cliquable lui ferait
  gober la sélection de texte et les liens des trois feuilles qu'elle
  traverse — le contraire de « en retrait, pas en concurrence »
  (`planche.css:3869-3870`).
- **Parité clavier : assumée absente, et argumentée.** La voiture est
  décorative et `aria-hidden` (`voiture.tsx:566`) ; le drag n'expose aucune
  information ni fonction qui n'existe pas déjà (la rotation est au
  scroll, accessible au clavier).
  > MISE À JOUR 2026-08-11 (#13, retour Hugo) : la rotation au scroll a
  > été retirée — le cran de 2,25° se voyait au défilement lent — la
  > rotation n'existe plus qu'au drag. L'argument se reformule sans
  > changer de conclusion : la voiture reste décorative et aria-hidden,
  > le drag n'expose toujours aucune information — il n'y a simplement
  > plus d'équivalent scroll dont réclamer la parité. Pas d'équivalent clavier à inventer pour
  une manipulation bonus d'un élément décoratif — mais si un jour le drag
  devient porteur d'information, cette phrase devient fausse et le
  chantier rouvre.
- **Perte de contexte WebGL** (`webglcontextlost`) : retour silencieux au
  mode séquence, jamais un écran vide ni une erreur console permanente —
  le même esprit que le renoncement propre de `voiture.tsx:24-25`.
- **Un seul contexte WebGL** sur la page, créé au premier geste, jamais
  recréé en boucle.
- **Aucune teinte nouvelle par construction** : le client rend le même
  studio, les mêmes retouches, sur fond alpha — il n'introduit pas une
  couleur, il réaffiche les mêmes.
- **Chaînes** : ce spec n'ajoute aucun texte visible. Si un indice
  d'affordance apparaît, il passe par `dict.ts`, FR **et** EN.
- **Jamais `git add -A`** ; le `.glb` optimisé s'ajoute fichier par
  fichier avec sa règle `.gitattributes`.

## Fichiers touchés (anticipation, l'implémentation précisera)

| Fichier | Changement |
|---|---|
| `package.json` | `three` épinglé `0.169.0` (même version que l'importmap de `scene.html`) |
| `components/proto/voiture.tsx` | écoute du geste, offset d'index persistant, bascule de toiles, interrupteur |
| nouveau module client (chargé dynamiquement) | régime drag : three, loaders, scène, inertie, réconciliation |
| `tools/voiture/studio.mjs` (nouveau) | studio + retouches + réglages de rendu extraits, partagés outil/client |
| `tools/voiture/scene.html` | consomme le module partagé au lieu de sa copie |
| `tools/voiture/rendu.mjs` | alias de service du module partagé ; consignation du cadre |
| `public/voiture/modele-web.glb` (nom à fixer) | le `.glb` optimisé, committé |
| `public/voiture/CREDIT.txt` | le fichier distribué, sa fabrication, le cadre consigné |
| `.gitattributes` | règle `binary` pour `*.glb` |
| `app/planche.css` | la seconde toile, les curseurs `grab`/`grabbing` |
| `tools/banc/` | scénario drag |

## Vérification

- **Séquence témoin** : les 160 images re-rendues depuis le `.glb` optimisé
  contre les 160 de production — diff chiffré consigné, contrôle à l'œil.
- **Banc** : les trois gates de la décision 8, `--tete`, plancher égal,
  en % de frames au-dessus de 8,3 ms.
- **Réseau** : rechargement + scroll complet sans drag → zéro requête vers
  le chunk et le `.glb` ; sous `reduce` au montage → une seule image.
- **Raccord — gate humain** : Hugo saisit et relâche sur build de
  production, écran 120 Hz ; si l'œil voit la bascule, ça ne sort pas.
- **`reduce`** : drag possible, aucun mouvement après le relâchement
  (inertie nulle, élévation reposée instantanément), et l'accueil sans
  drag reste à une image chargée.
- **Bundle** : First Load JS de l'accueil identique avant/après.
- **Licence** : `CREDIT.txt` couvre le `.glb` distribué ; l'attribution
  visible du pied de page (`dict.ts`) est déjà en place et ne change pas.

## Ce qui reste à trancher par Hugo

1. ~~**Publier le `.glb` optimisé**~~ — **tranché par Hugo le 2026-08-10 :
   oui, publier.** Le modèle ne lui appartient pas (« FREE - McLaren P1
   MSO » par bohmerang) : le servir n'expose aucun bien propre, et
   CC-BY-NC-SA autorise la redistribution de l'adaptation avec
   l'attribution que `CREDIT.txt` porte déjà et qui sera étendue au
   fichier.
2. **Les bornes de l'axe d'élévation** (autour des 30° du rendu) : à
   régler à l'œil au prototype — trop d'amplitude montre le dessous et le
   toit, des vues que le studio n'a jamais eu à flatter.
3. **Si le poids optimisé dépasse ~8 Mo** sans écart visible à la séquence
   témoin : accepter, presser plus fort, ou abandonner — avec les chiffres
   sur la table.
4. **Un indice d'affordance écrit**, ou le curseur `grab` seul ? (S'il y a
   un texte : `dict.ts`, FR et EN.)
