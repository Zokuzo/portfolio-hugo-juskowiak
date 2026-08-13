# Ce que les deux GLB contiennent vraiment

Recherche du ticket [#16](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/16) — 2026-08-13.
Sources primaires : les fichiers eux-mêmes (`ressources/foxs_rocketbunny_gt86.glb`, `ressources/psp_street.glb`), inspectés avec `@gltf-transform/cli` 4.4.2 (`inspect` + `optimize` mesurés) et un script Node lisant le chunk JSON du GLB (arbre de nœuds, facteurs émissifs, modes alpha).

## GT86 Rocket Bunny (`foxs_rocketbunny_gt86.glb`, 14,55 Mo)

Export Sketchfab 14.15.0, glTF 2.0, extension `KHR_materials_clearcoat` (sur le verre). **Aucune animation, aucun skin, aucune caméra.** 49 nœuds, 39 meshes, 38 matériaux, ~202 k sommets uploadés.

### Arbre de scène

```
Sketchfab_Scene › Sketchfab_model › Root
├── Car        (21 meshes Car_0..Car_20, un par matériau)
├── Glass      (Glass_0)
├── Paint      (Paint_0 carrosserie, Paint_1 joints widebody)
├── Exhaust    (intérieur noir + sorties)
├── Circle     (Circle_0 : disque de sol semi-transparent, mat "Floor" BLEND)
├── Screws     (visserie widebody)
├── Dash       (Dash_0, mat "DashboardArtwork")
└── Wheels     (Wheels_0..Wheels_9 : jantes, pneus, disques, étriers)
```

### Réponses aux questions

- **Portière conducteur : NON séparée.** Le découpage est par *matériau*, pas par pièce : toute la carrosserie est un seul mesh `Paint_0` (31,6 k triangles). Ouvrir une portière exige une chirurgie de mesh (Blender) ou une transition caméra à travers la vitre.
- **Habitacle : OUI, entièrement modélisé.** Matériaux dédiés : `MoreInterior`, `InteriorBlack`, `InteriorStuff`, `Carbon`, `SilverPlastic`, `Pedals`, `DashboardArtwork` (planche de bord), `Speedo` (combiné d'instruments, **émissif** avec texture), `Speedoneedle` (aiguille, émissif rouge `[0.62,0,0]`).
- **Écran central : OUI, et c'est un cadeau.** `Car_16`, matériau `Display` — **un quad de 2 triangles / 4 sommets**, émissif `[1,1,1]` avec `emissiveTexture` propre (512×256 partagée baseColor+emissive). Parfait pour un écran cliquable natif : raycast sur `Car_16`, swap de la texture par une `CanvasTexture`/`VideoTexture`.
- **Vitres : OUI transparentes.** `Glass` en `alphaMode: BLEND` + clearcoat → l'habitacle est visible à travers. Le disque de sol `Floor` est aussi en BLEND (ombre au sol intégrée — à supprimer probablement).
- **Phares : meshes ET matériaux distincts.** Avant : `Car_4` (`HeadlightsTex`, texturé non émissif — les optiques) et `Car_20` (`LightsFront`, **émissif blanc `[1,1,1]`** sans texture — le glow allumable). Arrière : `Car_7` (`Taillightbody`), `Car_17` (`BrakeLight`, non émissif), `Car_19` (`RedGlow`, **émissif orangé `[1,0.69,0]`**), `Car_8` (`Indicator`), `Car_9` (`Lights2`). Allumer/éteindre = jouer sur `emissiveIntensity` de 2–3 matériaux, zéro modélisation.
- **Textures :** 21 PNG (64² → 4096²), toutes baseColor sauf 1 normal map (pneu), 1 metallicRoughness (verre), 2 émissives (Display, Speedo). Deux quasi vides (207 o en 1024², 36,7 Ko en 4096² — aplats que `optimize` convertit en facteurs). VRAM naïve ~180 Mo avant redimensionnement.

## PSP street (`psp_street.glb`, 35,41 Mo)

Export Sketchfab 16.45.0, glTF 2.0, aucune extension. **Aucune animation.** 27 nœuds, 12 meshes, **2 matériaux seulement** (`Base` opaque, `Glass` BLEND), **4 367 sommets** en tout. Échelle réelle (~18,8 cm de large). Les 35 Mo sont **entièrement dans 7 PNG 4096×4096** (normal map seule : 10,4 Mo ; atlas AO/roughness : 9,4 Mo).

### Arbre de scène

```
case
├── case_Base_0      (coque)
├── button, pad, stick, trigger, on-off, power, mineusb   (chacun son mesh, mat Base)
├── d-button, d-pad  (mat Glass, translucides)
├── glass            (vitre d'écran, mat Glass BLEND)
└── display          (display_Base_0 : quad 6 sommets, mat Base émissif)
```

### Réponses aux questions

- **Écran : quad séparé** (`display_Base_0`, 6 sommets) → raycast natif trivial. Mais il partage le matériau `Base` (atlas 4096 avec `emissiveTexture`) : pour un écran vivant, cloner le matériau sur ce seul mesh et y mettre sa propre texture (attention, les UV pointent vers la zone écran de l'atlas — le plus simple est de remapper les UV du quad sur 0–1 ou de superposer un quad maison).
- **Boutons : tous séparés** (croix, d-pad, stick, gâchettes, power…) → animables individuellement en code (aucune animation embarquée, tout est à faire à la main — ce sont des transforms simples).
- **Transparence :** `Glass` (vitre écran + boutons translucides) en BLEND.

## Poids atteignables (mesurés, pas estimés)

`npx @gltf-transform/cli optimize`, sorties WebP. « Structure préservée » = `--flatten false --join false --palette false --simplify false` (garde tous les nœuds nommés cliquables — vérifié : les 49/27 nœuds, noms et émissifs survivent).

| Variante | GT86 (14,55 Mo) | PSP (35,41 Mo) |
| --- | --- | --- |
| `optimize` défaut (meshopt, simplify, join, textures ≤2048, WebP) | **1,66 Mo** | **0,70 Mo** |
| Structure préservée (meshopt, textures ≤2048, WebP) | **2,31 Mo** | **0,72 Mo** |
| Structure préservée, Draco au lieu de meshopt (GT86) | 1,53 Mo | — |

- KTX2 (`etc1s`/`uastc`) **non mesuré** : exige KTX-Software (`ktx`/`toktx`), absent de la machine. WebP est de toute façon meilleur en octets transférés ; KTX2 ne gagnerait que la VRAM (~4–6× moins que du PNG décodé) au prix d'un fichier ~2–3× plus gros que WebP. À reconsidérer seulement si la VRAM mobile coince.
- Meshopt exige `MeshoptDecoder` côté three.js (`GLTFLoader.setMeshoptDecoder`), Draco le `DRACOLoader` (~300 Ko de décodeur WASM). Meshopt décode plus vite ; l'écart de poids (2,31 vs 1,53 Mo) vient surtout du fait que Draco compresse mieux les gros meshes non simplifiés.

## Décisions en aval

1. **Transition portière→habitacle :** pas de portière séparée ni d'animation → écarter l'ouverture de portière telle quelle. Options : caméra qui traverse la vitre (transparente, donc plausible), fondu, ou découpe de la portière dans Blender depuis `Paint_0` (coûteux).
2. **Écran cliquable :** les DEUX modèles ont un quad d'écran dédié et raycastable (`Car_16` côté GT86, `display_Base_0` côté PSP). Le GT86 est même plus simple (matériau `Display` déjà isolé avec sa propre texture émissive). Le choix natif-vs-PSP est libre techniquement.
3. **Budget de chargement : ~3 Mo pour les deux modèles réunis** en préservant toute la structure cliquable (2,31 + 0,72), ~2,4 Mo en laissant `optimize` simplifier/joindre. Très loin des 48 Mo actuels — le lazy-load des deux univers 3D est confortable.
