# McLaren P1 — remplacement du modèle et arbitrage 120/160 — design

Date : 2026-08-07
Statut : validé en discussion, en attente de relecture écrite

## But

Remplacer la Toyota GT86 de la page d'accueil par la McLaren P1 MSO, en
livrée **carbone sombre** conforme au système mono-accent actuel, et trancher
par comparaison in situ la question du ticket 18 : la densification de la
séquence de 120 à 160 images se voit-elle à l'œil ? Si non, on garde 120 —
« doubler le poids pour rien serait le pire résultat ».

Ce chantier ferme le ticket 18 (dont le seul blocage était le `.glb`,
désormais fourni) et débloque le ticket 17 (garde-fou de budget).

Hors périmètre : le bi-thème clair/sombre (chantier ultérieur, dossier
d'instruction constitué le 2026-08-07 — les deux rapports d'exploration
pipeline et jetons), la livrée MSO blanche/bleue (réservée au thème clair),
le décor, la plaque, la 3D temps réel (exclue par `voiture.tsx:10-15` et par
la carte : une séquence d'images coûte un décodage et un `drawImage` au
changement d'index, un canvas WebGL coûterait une passe de rendu par frame
contre une marge mesurée de 0,90 ms sur l'accueil).

## 1 — Le modèle et sa licence

- Fichier : « FREE - McLaren P1 MSO » par bohmerang
  (`sketchfab.com/3d-models/free-mclaren-p1-mso-c7687064e08c4be9a0af88e98bcf0a8e`),
  `.glb` monolithique de 67,2 Mo, 73 meshes, 34 textures embarquées, 36
  matériaux aux noms propres (pas d'artefacts `.001` à la GT86).
- Licence : **CC-BY-NC-SA-4.0**, embarquée dans le fichier. Plus stricte que
  la CC-BY-4.0 de la GT86 (non commercial + partage à l'identique des
  adaptations), assumée par Hugo. Le circuit d'attribution existant est
  réutilisé tel quel : `public/voiture/CREDIT.txt` (attribution complète)
  et la ligne visible du pied de page `dict.ts:150-151`, FR **et** EN.
- Mention marque, sur le modèle de la note Toyota : « McLaren et P1 sont des
  marques de McLaren Automotive, citées à titre descriptif. Aucune
  affiliation. »
- Le `.glb` reste **hors du dépôt** (comme la GT86, jamais versionnée) mais,
  contrairement à elle, ne se perd pas : déplacé de `Téléchargements/` vers
  `~/PP/modeles-3d/`, chemin documenté dans `CREDIT.txt` avec la commande de
  régénération.

## 2 — Outillage : deux changements dans `scene.html`

- **Correctif texture** : aujourd'hui, `scene.html:223` fait `mat.map = null`
  dès qu'une retouche donne une couleur — écrit pour la GT86 qui n'avait
  aucune texture, destructeur sur un modèle qui en a 34. Le vidage de texture
  devient opt-in : une retouche ne vide `mat.map` que si elle porte
  `sansTexture: true`. Une ligne.
- **Table `RETOUCHES` réécrite pour la P1**, à partir de l'inventaire
  `--materiaux` :
  - `WhitePaintjob` → carbone sombre (le `CARRO` par défaut `#0b0e14`,
    metal ≈ 0,9, vernis), sans texture d'origine donc recolorisation sûre ;
  - `Blue` (l'accent MSO, teinte étrangère au système mono-accent) → carbone,
    lui aussi sans texture ;
  - `Glass` : vitrage teinté conservé ;
  - le reste (carbones, pneus, freins, jantes, intérieur — texturés) ajusté
    à l'essai, textures intactes.
  - Point de vigilance : les `Decals` MSO (texturés) sur carrosserie sombre.
    S'ils jurent, leurs meshes sont masqués par retouche. Décision à l'essai,
    à l'œil.

## 3 — La campagne de rendu

Élévation 30° et pose de départ conservées (solidaires d'`INCLINAISON` — le
piège est documenté dans `CREDIT.txt`). Dans l'ordre :

1. `node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb --materiaux`
   — inventaire réel avant toute retouche.
2. Essai `--nb=8 --dest=.scratch/planche-profonde/rendus/p1-essai` : réglage
   des retouches ; si le nez de la P1 ne pointe pas comme celui de la GT86,
   `--depart` compense (la convention tient : image 000 = plongée de face,
   pose 315° = trois-quarts avant) ; vérification qu'`INCLINAISON` −12°
   tient la nouvelle diagonale.
3. Deux passes complètes, **même encodeur forcé** (décision du ticket 18 :
   un côte-à-côte à encodeurs différents compare deux encodages, pas deux
   densités) :
   `--nb=120 --dest=.scratch/planche-profonde/rendus/p1-120` et
   `--nb=160 --dest=.scratch/planche-profonde/rendus/p1-160`, tous deux avec
   `--encodeur=ffmpeg --rendu=2000 --elevation=30 --poids=30000`.
   **Jamais `--dest` omis** : sans lui la commande écrase les 120 images de
   production (piège consigné au ticket 21).
4. Plafond de poids : la P1 est plus détaillée que la GT86. Si la dichotomie
   descend la qualité jusqu'à des artefacts visibles sur l'image la plus
   lourde, la décision (relever le plafond ou accepter) remonte à Hugo avec
   les chiffres — elle n'est pas prise en chemin.

## 4 — Le côte-à-côte et la promotion

Comparaison **en conditions réelles** : build de production, Chrome de la
machine, écran 120 Hz, au scroll sur le vrai site — pas de page témoin. Un
script jetable bascule le contenu de `public/voiture/` entre les deux
candidates ; pour la passe 160, `NB=160` / `POSE=140` basculent avec, en
non-committé. Hugo tranche à l'œil.

- **Si 120 gagne** : remplacement des fichiers, constantes intactes. Le
  ticket 18 se ferme sur « la densification ne se voit pas, on garde 120 ».
- **Si 160 gagne** : `NB = 160` (`voiture.tsx:67`), `POSE = 140`
  (`voiture.tsx:91`). Fenêtre de préchargement : `AVANT/ARRIERE = 20/5`
  **conservés** (empreinte mémoire constante ~104 Mo, portée angulaire
  60° → 45°) ; passage à 27/7 seulement si le côte-à-côte montre du pop-in
  en scroll rapide. Les six commentaires qui chiffrent « 120 » en dur
  (`voiture.tsx:23, 224, 231, 238, 341, 435`) sont réécrits.

Dans les deux cas : `CREDIT.txt` réécrit (attribution, fabrication, chemin
du modèle, commande, poids relevés), crédit visible `dict.ts` FR/EN, ajout
git **fichier par fichier** — jamais `git add -A` (règle de la carte : un
add global trancherait le ticket 26 sans décision).

## Fichiers touchés

| Fichier | Changement |
|---|---|
| `tools/voiture/scene.html` | vidage de texture opt-in (`sansTexture`), table `RETOUCHES` P1 |
| `public/voiture/*.webp` | séquence remplacée (120 ou 160 fichiers selon l'arbitrage) |
| `public/voiture/CREDIT.txt` | attribution P1 CC-BY-NC-SA, fabrication, chemin du modèle, commande |
| `components/proto/voiture.tsx` | si 160 : `NB`, `POSE`, fenêtre, six commentaires ; sinon rien |
| `components/proto/dict.ts` | ligne de crédit visible, FR et EN |
| `.scratch/planche-profonde/map.md` + `issues/18` | ticket 18 résolu avec la mesure, index mis à jour |

## Vérification

- `node tools/banc/frame.mjs <url> p1 --tete` sur l'accueil, build de
  production, comparé au relevé de référence (p90 7,40 ms du 2026-08-06)
  **à plancher de cadence égal seulement** — leçon du ticket 32 : préférer
  le % de frames au-dessus de 8,3 ms aux millisecondes brutes.
- `prefers-reduced-motion` : une seule image chargée (la pose), vérifié avec
  la nouvelle séquence.
- Poids total et image la plus lourde relevés et consignés dans `CREDIT.txt`
  (référence GT86 : 3,08 Mo, max 29 988 o).
- Attribution visible au navigateur, pied de page, FR et EN.
- Le contrat d'intégration de `voiture.tsx:22-25` tient : fond transparent,
  nommage `%03d.webp` sans trou depuis 000.
