# Remplacement McLaren P1 + arbitrage 120/160 — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Remplacer la Toyota GT86 de l'accueil par la McLaren P1 MSO en livrée carbone sombre, et fermer le ticket 18 en tranchant 120 contre 160 images par comparaison in situ.

**Architecture :** Le pipeline existant (`tools/voiture/rendu.mjs` + `scene.html`) rend le nouveau `.glb` vers des dossiers `.scratch` jetables ; deux passes complètes au même encodeur alimentent un côte-à-côte en build de production tranché par Hugo ; la gagnante est promue dans `public/voiture/` avec son attribution. Le composant `voiture.tsx` ne change que si 160 gagne.

**Tech Stack :** three.js 0.169 (CDN, réseau requis au rendu), Chrome headless SwiftShader, ffmpeg/libwebp, Next 16.3 (build de production pour le côte-à-côte).

**Spec :** `docs/superpowers/specs/2026-08-07-mclaren-p1-remplacement-design.md`

## Global Constraints

- **Jamais `git add -A`** — ajouter fichier par fichier (un add global trancherait le ticket 26 sans décision).
- **Jamais `rendu.mjs` sans `--dest`** — sans lui, la commande écrase les 120 images de production (piège du ticket 21).
- **Même encodeur pour toute passe comparée** : `--encodeur=ffmpeg`, explicite, sur les deux passes complètes.
- **Aucun fait inventé** : tout chiffre écrit dans un commentaire ou `CREDIT.txt` (poids, tailles, comptes) est MESURÉ sur les fichiers produits, jamais extrapolé.
- **Commentaires en français, ils disent le POURQUOI.**
- **`prefers-reduced-motion: reduce`** : le contrat une-seule-image de `voiture.tsx` doit tenir avec la nouvelle séquence.
- **Aucune teinte nouvelle** : carrosserie carbone `#0b0e14`, accent bleu MSO neutralisé. Le blanc et le bleu MSO sont réservés au futur thème clair.
- **Élévation 30° et pose 315° conservées** — solidaires d'`INCLINAISON` (`voiture.tsx:86-89`) : ne jamais changer l'un sans l'autre.
- **Le `.glb` (67 Mo) n'entre JAMAIS dans le dépôt** — ni dans `.scratch/` (le ticket 26 pourrait le versionner).
- **Budget 8,3 ms** : comparer en % de frames au-dessus du seuil, à plancher de cadence égal seulement (ticket 32).
- Deux gates humains : le plafond de poids (Tâche 5) et le côte-à-côte (Tâche 6) remontent à Hugo, ils ne se tranchent pas seuls.

---

### Tâche 1 : Mettre le modèle à l'abri

**Files:**
- Aucun fichier du dépôt. Déplacement hors repo uniquement.

**Interfaces:**
- Produces : le chemin stable `~/PP/modeles-3d/free_-_mclaren_p1_mso.glb`, consommé par toutes les commandes de rendu et cité par `CREDIT.txt` (Tâche 7).

- [ ] **Step 1 : Déplacer le fichier**

```bash
mkdir -p ~/PP/modeles-3d
mv ~/Téléchargements/free_-_mclaren_p1_mso.glb ~/PP/modeles-3d/
```

- [ ] **Step 2 : Vérifier l'intégrité**

Run : `stat -c %s ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb`
Expected : `70471356` (l'octet près — c'est la taille lue dans l'en-tête GLB le 2026-08-07).

Pas de commit : rien ne change dans le dépôt.

---

### Tâche 2 : `scene.html` — vidage de texture opt-in et masquage

**Files:**
- Modify : `tools/voiture/scene.html:223` (application des retouches, bloc `:213-228`)

**Interfaces:**
- Produces : deux champs de retouche optionnels — `sansTexture: true` (vide `mat.map`) et `masquer: true` (rend le matériau invisible) — consommés par la table `RETOUCHES` (Tâche 3) et le réglage à l'essai (Tâche 4).

Pourquoi : la ligne actuelle fait `mat.map = null` dès qu'une couleur est donnée. Écrit pour la GT86 qui n'avait aucune texture (no-op), destructeur sur la P1 qui en a 34. Le masquage sert de sortie de secours pour les `Decals` MSO si elles jurent sur carrosserie sombre.

- [ ] **Step 1 : Remplacer la ligne d'application**

Dans `tools/voiture/scene.html`, remplacer la ligne :

```js
      if (r.couleur !== undefined) { mat.color.setHex(parseInt(r.couleur, 16)); mat.map = null }
```

par :

```js
      /* Vider la texture est OPT-IN : d'office, recolorer un matériau
         texturé détruirait sa texture — la GT86 n'en avait aucune, la
         P1 en a 34. `masquer` éteint un matériau entier (les Decals
         d'une livrée qu'on ne garde pas) sans toucher à la géométrie. */
      if (r.couleur !== undefined) { mat.color.setHex(parseInt(r.couleur, 16)); if (r.sansTexture) mat.map = null }
      if (r.masquer) mat.visible = false
```

- [ ] **Step 2 : Vérifier que la page se charge encore**

Run : `node -e "const s=require('fs').readFileSync('tools/voiture/scene.html','utf8'); if(!s.includes('r.sansTexture')||!s.includes('r.masquer')) process.exit(1)"`
Expected : sortie silencieuse, code 0. (Le vrai contrôle fonctionnel est le `--materiaux` de la Tâche 3, qui exécute tout le chemin de chargement.)

- [ ] **Step 3 : Commit**

```bash
git add tools/voiture/scene.html
git commit -m "$(cat <<'EOF'
Le vidage de texture devient opt-in — la GT86 n'en avait aucune, la P1 en a 34

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 3 : `scene.html` — table `RETOUCHES` de la P1

**Files:**
- Modify : `tools/voiture/scene.html:38-57` (en-tête du bloc + table)

**Interfaces:**
- Consumes : `sansTexture`/`masquer` (Tâche 2), `CARRO` (`scene.html:35`, défaut `0b0e14`) et `RUGO` (`:36`, défaut `0.14`).
- Produces : la table P1 initiale que la Tâche 4 règle à l'œil.

- [ ] **Step 1 : Inventaire réel des matériaux**

Run : `node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb --materiaux`
Expected : la liste des 36 matériaux, contenant exactement `WhitePaintjob`, `Blue` et `Glass` (les trois de la table ci-dessous), plus `Decals`, `Carbon`, `Carbon1`, `Carbon2`, `tires`, `Rims`, etc. Si `WhitePaintjob`, `Blue` ou `Glass` manquent à l'appel, STOP : la table ci-dessous viserait dans le vide — corriger les clés d'après l'inventaire avant de continuer.

- [ ] **Step 2 : Réécrire l'en-tête et la table**

Remplacer le bloc `scene.html:38-57` (commentaire `RETOUCHES MATÉRIAUX` + table GT86) par :

```js
/* ── RETOUCHES MATÉRIAUX ──────────────────────────────────────────
   Propres au modèle McLaren P1 MSO de bohmerang. Contrairement à la
   GT86, le .glb arrive TEXTURÉ (34 textures) : on ne recolore que les
   matériaux de couleur pure qui portent la livrée. La carrosserie
   blanche et l'accent bleu MSO passent au carbone sombre parce que le
   système du site est mono-accent : le bleu y serait une teinte
   étrangère, et une carrosserie blanche un phare derrière le titre.
   La livrée MSO d'origine est réservée au futur thème clair.
   Aucun des trois matériaux ci-dessous ne porte de texture — les 34
   textures du modèle restent donc toutes intactes. Si on change de
   modèle, on réécrit ce tableau, c'est le seul endroit.
   ───────────────────────────────────────────────────────────────── */
const RETOUCHES = {
  "WhitePaintjob": { couleur: CARRO,    metal: 0.90, rugo: RUGO, vernis: 1 },
  "Blue":          { couleur: "121317", metal: 0.30, rugo: 0.45 }, // accent MSO neutralisé
  "Glass":         { couleur: "04060a", metal: 0.00, rugo: 0.06 }, // vitrage teinté, même geste que la GT86
}
```

- [ ] **Step 3 : Contrôle statique**

Run : `node -e "const s=require('fs').readFileSync('tools/voiture/scene.html','utf8'); for(const k of ['WhitePaintjob','Blue','Glass']) if(!s.includes('\"'+k+'\"')) process.exit(1); if(s.includes('body.001')) process.exit(2)"`
Expected : code 0 — les trois clés P1 présentes, plus aucune clé GT86.

- [ ] **Step 4 : Commit**

```bash
git add tools/voiture/scene.html
git commit -m "$(cat <<'EOF'
La table de retouches passe à la P1 — trois matériaux recolorés, 34 textures intactes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 4 : Rendu d'essai et réglage à l'œil

**Files:**
- Modify (si le réglage l'exige) : `tools/voiture/scene.html` (table `RETOUCHES`)
- Sorties jetables : `.scratch/planche-profonde/rendus/p1-essai/`

**Interfaces:**
- Produces : les drapeaux de rendu définitifs (`--depart=<n>` si l'orientation le demande, valeurs `--carrosserie`/`--rugosite` si ajustées) — **tout drapeau ajouté ici doit se retrouver à l'identique dans les passes complètes (Tâche 5) et dans la commande consignée de `CREDIT.txt` (Tâche 7)**.

- [ ] **Step 1 : Rendre 8 images d'essai**

```bash
node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb \
  --nb=8 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg \
  --dest=.scratch/planche-profonde/rendus/p1-essai
```

Expected : 8 WebP (`000.webp` → `007.webp`) dans le dossier `--dest`, aucune écriture dans `public/voiture/`.

- [ ] **Step 2 : Contrôler les 8 vues à l'œil**

Ouvrir les 8 images (au besoin `ffmpeg -i NNN.webp NNN.png` pour un aperçu). Contrôles, dans l'ordre :

1. **Orientation** : l'image `000` doit être la plongée de face (convention GT86). À 8 images, `007` = azimut 315° = le trois-quarts avant. Si le nez de la P1 pointe ailleurs, ajouter `--depart=<degrés>` et re-rendre jusqu'à retrouver la convention.
2. **Livrée** : carrosserie carbone sombre, aucune surface bleue, aucune surface blanche. Sinon, l'inventaire de la Tâche 3 a manqué un matériau de livrée — l'ajouter à `RETOUCHES`.
3. **Decals MSO** : si les décalcomanies (matériau `Decals`, texturé) jurent sur la carrosserie sombre, ajouter `"Decals": { masquer: true }` à la table et re-rendre.
4. **Assiette** : sur `007`, la diagonale naturelle doit rester proche des ~28° de la GT86 (c'est ce que `INCLINAISON = -12` redresse à 40°). Si elle s'en écarte nettement, noter l'angle mesuré — il servira à ajuster `INCLINAISON` à la promotion (Tâche 7), jamais l'élévation de rendu.
5. **Matière** : reflets des neuf bandes lisibles sur la carrosserie, vitrage sombre, pas d'effet jouet. Ajuster `metal`/`rugo`/`--rugosite` par petites touches et re-rendre.

Boucler Step 1 ↔ Step 2 jusqu'à satisfaction. C'est un réglage à l'œil, prévu par le spec.

- [ ] **Step 3 : Commit des retouches finales (si la table a bougé)**

```bash
git add tools/voiture/scene.html
git commit -m "$(cat <<'EOF'
Réglage à l'essai — la P1 trouve sa matière sous les neuf bandes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Tâche 5 : Les deux passes complètes

**Files:**
- Sorties jetables : `.scratch/planche-profonde/rendus/p1-120/` et `.scratch/planche-profonde/rendus/p1-160/`

**Interfaces:**
- Consumes : les drapeaux définitifs de la Tâche 4 (les commandes ci-dessous les supposent absents ; les AJOUTER si l'essai en a produit).
- Produces : deux séquences candidates complètes + leurs poids mesurés (max et total, consommés par `CREDIT.txt` et les commentaires de `voiture.tsx` en Tâche 7).

- [ ] **Step 1 : Passe 120**

```bash
node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb \
  --nb=120 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg \
  --dest=.scratch/planche-profonde/rendus/p1-120
```

- [ ] **Step 2 : Passe 160**

```bash
node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb \
  --nb=160 --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg \
  --dest=.scratch/planche-profonde/rendus/p1-160
```

Les deux passes sont longues (SwiftShader, 280 rendus 2000×2000) : les lancer séquentiellement, en tâche de fond.

- [ ] **Step 3 : Contrôle de complétude et de poids**

```bash
for d in p1-120 p1-160; do
  ls .scratch/planche-profonde/rendus/$d/*.webp | wc -l
  du -cb .scratch/planche-profonde/rendus/$d/*.webp | tail -1
  ls -S .scratch/planche-profonde/rendus/$d/*.webp | head -1 | xargs stat -c "%n %s"
done
```

Expected : 120 et 160 fichiers exactement, sans trou de `000` à `119`/`159` ; image la plus lourde ≤ 30 000 octets. **Noter les trois chiffres de chaque passe** (compte, total, max) : ils entrent dans `CREDIT.txt` et les commentaires en Tâche 7.

- [ ] **Step 4 : GATE — plafond de poids**

Si la dichotomie a dû descendre la qualité au plancher (q=30) : ouvrir l'image la plus lourde, chercher les artefacts. S'il y en a de visibles, **STOP : remonter à Hugo avec les chiffres** (poids atteint, qualité, alternative : relever `--poids`). La décision n'est pas prise en chemin — c'est écrit dans le spec.

Pas de commit : tout est dans `.scratch/`.

---

### Tâche 6 : Le côte-à-côte in situ — GATE HUGO

**Files:**
- Create : `.scratch/planche-profonde/rendus/bascule.sh` (jetable, non committé)
- Modify (temporairement, NON committé) : `components/proto/voiture.tsx:67,91` pour la candidate 160

**Interfaces:**
- Produces : la décision 120 ou 160, consommée par la Tâche 7.

- [ ] **Step 1 : Écrire le script de bascule**

```bash
cat > .scratch/planche-profonde/rendus/bascule.sh <<'EOF'
#!/bin/sh
# bascule.sh <120|160> — remplace la séquence servie par la candidate.
# CREDIT.txt n'est pas touché : seuls les .webp basculent.
set -e
[ -d ".scratch/planche-profonde/rendus/p1-$1" ] || { echo "candidate p1-$1 absente"; exit 1; }
rm public/voiture/*.webp
cp ".scratch/planche-profonde/rendus/p1-$1"/*.webp public/voiture/
echo "public/voiture -> p1-$1 ($(ls public/voiture/*.webp | wc -l) images)"
EOF
chmod +x .scratch/planche-profonde/rendus/bascule.sh
```

- [ ] **Step 2 : Candidate 120**

```bash
.scratch/planche-profonde/rendus/bascule.sh 120
npx next build && npx next start
```

`voiture.tsx` reste tel quel (`NB=120`, `POSE=105`). Hugo scrolle l'accueil sur son écran 120 Hz, note son impression.

- [ ] **Step 3 : Candidate 160**

Éditer `components/proto/voiture.tsx` — deux constantes, **sans committer** :
ligne 67 : `const NB = 160` · ligne 91 : `const POSE = 140`

```bash
.scratch/planche-profonde/rendus/bascule.sh 160
npx next build && npx next start
```

Hugo compare au scroll, alterne avec la candidate 120 autant que nécessaire (re-basculer = re-builder seulement quand les constantes changent ; la bascule de fichiers seule ne demande pas de rebuild, `public/` est servi tel quel — mais les constantes DOIVENT correspondre aux fichiers servis, sinon 404 ou tour tronqué).

Surveiller aussi pendant la 160 : du **pop-in** en scroll rapide (la fenêtre 20/5 couvre 45° au lieu de 60°) — cette observation décide de l'arbitrage fenêtre en Tâche 7.

- [ ] **Step 4 : GATE — Hugo tranche**

Deux sorties, et la règle du ticket 18 : **si la différence ne se voit pas, 120 gagne** — « doubler le poids pour rien serait le pire résultat ». Consigner la décision (et l'observation pop-in) avant de passer à la Tâche 7. En cas de choix 120, remettre les constantes de `voiture.tsx` (`git checkout components/proto/voiture.tsx`).

Pas de commit : le site est dans un état de test.

---

### Tâche 7 : Promotion de la gagnante

**Files:**
- Modify : `public/voiture/*.webp` (remplacement complet)
- Modify : `public/voiture/CREDIT.txt` (réécriture)
- Modify : `components/proto/dict.ts:143-152` (commentaire + lignes `legal`)
- Modify (branche 160 seulement) : `components/proto/voiture.tsx`

**Interfaces:**
- Consumes : la décision de la Tâche 6, les poids mesurés de la Tâche 5, les drapeaux définitifs de la Tâche 4.

- [ ] **Step 1 : Remplacer la séquence**

```bash
.scratch/planche-profonde/rendus/bascule.sh <gagnante>   # 120 ou 160
ls public/voiture/*.webp | wc -l                          # 120 ou 160, aucun trou
```

- [ ] **Step 2 : Réécrire `CREDIT.txt`**

Contenu complet (remplacer `<N>` par 120 ou 160, `<DERNIERE>` par 119 ou 159, `<PAS>` par 3° ou 2,25°, `<MAX>` et `<TOTAL>` par les poids MESURÉS en Tâche 5, et compléter la commande avec les drapeaux de la Tâche 4 s'il y en a) :

```
Séquence 360° de la page d'accueil — 000.webp à <DERNIERE>.webp
===============================================================

Les <N> images de ce dossier sont un rendu réalisé pour ce site à partir
d'un modèle 3D tiers. Le modèle est sous licence Creative Commons
Attribution - NonCommercial - ShareAlike : elle impose de créditer
l'auteur partout où le travail est partagé, interdit l'usage commercial
et exige que les adaptations restent sous la même licence. C'est l'objet
de ce fichier.

Attribution requise par la licence
----------------------------------
This work is based on "FREE - McLaren P1 MSO"
(https://sketchfab.com/3d-models/free-mclaren-p1-mso-c7687064e08c4be9a0af88e98bcf0a8e)
by bohmerang (https://sketchfab.com/bohmerang)
licensed under CC-BY-NC-SA-4.0
(http://creativecommons.org/licenses/by-nc-sa/4.0/)

Fabrication
-----------
Rendu three.js dans Chrome headless, studio noir éclairé par neuf bandes
lumineuses, sans lumière diffuse ni ombre au sol. La carrosserie blanche
et l'accent bleu MSO sont re-teintés carbone sombre pour le système
mono-accent du site ; les 34 textures d'origine sont conservées partout
ailleurs (la livrée MSO est réservée au futur thème clair). <N> images à
<PAS>, caméra fixe à 30° d'élévation, seule la voiture tourne. Rendu en
2000×2000 puis réduit à 1000×1000, encodé en WebP avec alpha (ffmpeg,
libwebp) sous un plafond de 30 Ko par image — la plus lourde pèse
<MAX> octets, la séquence entière <TOTAL> octets.

Le modèle source vit hors du dépôt (67 Mo) :
    ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb

Pour régénérer la séquence :
    node tools/voiture/rendu.mjs ~/PP/modeles-3d/free_-_mclaren_p1_mso.glb \
      --nb=<N> --rendu=2000 --elevation=30 --poids=30000 --encodeur=ffmpeg

L'élévation à 30° n'est pas un réglage de goût : la changer impose de
revoir INCLINAISON dans components/proto/voiture.tsx.

McLaren et P1 sont des marques de McLaren Automotive Limited, citées ici
à titre descriptif. Aucune affiliation.
```

- [ ] **Step 3 : Le crédit visible — `dict.ts`**

Remplacer le bloc `components/proto/dict.ts:143-152` par :

```ts
  /* — mention légale de pied —
     Le crédit du modèle 3D n'est pas décoratif : la McLaren P1 de la
     séquence est sous CC BY-NC-SA 4.0, qui EXIGE de nommer l'auteur
     partout où l'œuvre est partagée. L'attribution complète, avec les
     liens, vit dans public/voiture/CREDIT.txt — une ligne de pied ne
     peut pas porter trois URL sans se saborder. */
  legal: {
    fr: "Planche technique — document de présentation · Hugo Juskowiak · Ingénieur Full Stack & IA · France · FR/EN/ES/JP · REF.0043-B · REV.2 · 2026 · Modèle 3D McLaren P1 : bohmerang — CC BY-NC-SA 4.0",
    en: "Technical plate — presentation document · Hugo Juskowiak · Full Stack & AI Engineer · France · FR/EN/ES/JP · REF.0043-B · REV.2 · 2026 · McLaren P1 3D model: bohmerang — CC BY-NC-SA 4.0",
  },
```

(La ligne `ref:` qui suit ne change pas.)

- [ ] **Step 4 — BRANCHE 120 : rien d'autre**

`voiture.tsx` est déjà revenu à son état committé (fin de Tâche 6). Vérifier :
Run : `git status --short components/proto/voiture.tsx`
Expected : aucune sortie.
Vérifier aussi le commentaire de poids `voiture.tsx:341` (« imposerait 3 Mo avant le premier pixel ») contre le `<TOTAL>` mesuré : s'il s'écarte de plus de ~15 %, corriger le chiffre du commentaire avec la valeur mesurée. Passer au Step 6.

- [ ] **Step 5 — BRANCHE 160 : `voiture.tsx`**

Les deux constantes sont déjà en place depuis la Tâche 6 (`NB = 160` l.67, `POSE = 140` l.91). Compléter :

1. Ligne 67, le commentaire : `// images de la séquence, une tous les 2,25°`
2. Bloc « LA POSE DE DÉPART » (l.70-90) : remplacer « L'image 105 (azimut 315°) » par « L'image 140 (azimut 315°) ».
3. Contrat d'intégration (l.23) : « se nomment 000.webp à 159.webp ».
4. Commentaire du décodage (l.218-224) : la mesure historique reste vraie — la dater au lieu de la réécrire. Après « Sur 378 frames de traversée, les 120 changements d'index tombent une frame sur trois », ajouter « (mesuré sur la séquence de 120 images d'alors) ».
5. l.231 : « 160 bitmaps de 1000×1000 feraient 640 Mo » (160 × 4 Mo — arithmétique, pas une mesure).
6. l.238 : « Une rotation de 360° reparcourt les 160 ».
7. l.340-341 : « à 160 images, exiger la séquence complète imposerait <TOTAL arrondi en Mo> avant le premier pixel » — le chiffre MESURÉ de la Tâche 5.
8. l.348-349 : recalculer « six cents kilooctets » : 25 voisines × poids moyen mesuré, arrondi honnête.
9. l.434-435 : « ne jamais avoir besoin des 159 autres images. Une seule requête au montage au lieu de cent soixante. »
10. **Fenêtre** (l.317-318) : si la Tâche 6 a vu du pop-in en scroll rapide, passer à `AVANT = 27` / `ARRIERE = 7` et le dire dans le commentaire au-dessus (l.300-316) : la fenêtre garde ~60° de portée, l'empreinte monte à ~136 Mo. Sinon, garder 20/5 et noter dans ce même commentaire que la portée est passée de 60° à 45°, mesurée sans pop-in.
11. `INCLINAISON` (l.92) : si la Tâche 4 a mesuré une diagonale différente sur la pose, ajuster la valeur et le commentaire (l.83-84) avec l'angle réel.

- [ ] **Step 6 : Build de contrôle**

Run : `npx next build`
Expected : build vert. Puis `npx next start`, ouvrir l'accueil : la P1 tourne au scroll, part du trois-quarts avant, aucun 404 dans l'onglet réseau.

- [ ] **Step 7 : Commit — fichier par fichier**

```bash
git add public/voiture/*.webp public/voiture/CREDIT.txt
git add components/proto/dict.ts
# branche 160 seulement :
git add components/proto/voiture.tsx
git commit -m "$(cat <<'EOF'
La P1 remplace la GT86 — carbone sombre, l'arbitrage du ticket 18 est rendu

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

(Si 160 gagne : `git rm` n'est pas nécessaire, `000-119` sont écrasées et `120-159` s'ajoutent ; le `git add public/voiture/*.webp` couvre les deux cas.)

---

### Tâche 8 : Vérification et clôture

**Files:**
- Modify : `.scratch/planche-profonde/issues/18-densification-percue.md` (résolution)
- Modify : `.scratch/planche-profonde/map.md` (index « Décisions prises », brouillards liés)

**Interfaces:**
- Consumes : la décision et les mesures des Tâches 5-7.

- [ ] **Step 1 : Budget de frame**

Build de production toujours servi (`npx next start`), puis :

Run : `node tools/banc/frame.mjs http://localhost:3000 p1 --tete`
Expected : comparer au relevé de référence du 2026-08-06 (accueil p90 7,40 ms, 6,13 % de frames au-dessus du seuil) **en % de frames au-dessus de 8,3 ms, et seulement à plancher de cadence égal** — si le banc annonce un plancher différent du témoin, refuser de conclure (leçon des tickets 30/32) et relancer plutôt que d'inventer un ✓. Une séquence d'images au même format ne doit rien changer : un écart net est un signal à chercher, pas à noter.

- [ ] **Step 2 : `prefers-reduced-motion`**

Dans Chrome, DevTools → Rendering → émuler `prefers-reduced-motion: reduce`, recharger l'accueil, filtrer le réseau sur `/voiture/` :
Expected : **une seule requête** (la pose de départ), la voiture figée sur le trois-quarts avant, aucun mouvement au scroll.

- [ ] **Step 3 : L'attribution visible**

Au navigateur, pied de page, FR puis EN (bascule de langue) :
Expected : « Modèle 3D McLaren P1 : bohmerang — CC BY-NC-SA 4.0 » / « McLaren P1 3D model: bohmerang — CC BY-NC-SA 4.0 ». Plus aucune mention GT86 :
Run : `grep -rn "GT86\|Mpgs" components/ app/ public/voiture/CREDIT.txt tools/voiture/scene.html`
Expected : aucune sortie.

- [ ] **Step 4 : Fermer le ticket 18**

Dans `issues/18-densification-percue.md` : `Status: resolved`, et la réponse avec les chiffres — quelle candidate a gagné, ce que le côte-à-côte a montré, les poids finaux, l'observation pop-in et l'arbitrage fenêtre. Dans `map.md` : une ligne dans « Décisions prises » (gist + lien), retirer « le `.glb` chez Hugo » des blocages du ticket 17, et noter dans le brouillard bi-thème que la séquence claire se re-rendra avec les mêmes réglages (seul le studio change).

Pas de commit : `.scratch/` n'est pas suivi (ticket 26 ouvert).

- [ ] **Step 5 : Nettoyage**

```bash
rm -rf .scratch/planche-profonde/rendus/p1-essai
# garder p1-120 et p1-160 jusqu'à la mise en ligne vérifiée, puis :
# rm -rf .scratch/planche-profonde/rendus/p1-120 p1-160 bascule.sh
```

Le perdant reste sur disque tant que le site n'est pas déployé et vérifié en production — re-rendre 160 images coûte des heures, un `rm` coûte une seconde.
