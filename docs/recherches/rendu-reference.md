# Jusqu'où le temps réel approche la référence

Recherche du ticket [#55](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/55) (carte [#42](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/42)), 2026-10-14.
Référence : [BMW Falling from Sky](https://www.youtube.com/shorts/5Wa0YnwZmv0), Patonkiii, publiée le 2026-05-06, tags `#blender #davinciresolve`.

## Recommandation

**Rester en temps réel, et dépenser l'effort sur trois leviers bon marché, dans cet ordre :**

1. **Un ciel visible en haute définition, séparé de l'éclairage.** Le dôme affiche aujourd'hui la HDRI 1k : à l'écran, chaque texel du ciel est étiré environ 11 fois. Un fond JPG/AVIF 4k (LDR, 2 à 3 Mo) sur le dôme, la HDR 1k gardée pour l'IBL. C'est le plus gros écart avec la référence et il ne coûte presque rien en images/s.
2. **Un étalonnage par LUT au lieu de la teinte `multiply` du dôme.** Le rose de la référence vient du grading DaVinci, pas du ciel : il baigne toute l'image (nuages, voiture, sol). Une passe `postprocessing` unique (tone mapping + LUT 3D + grain + vignette, fusionnés dans un seul `EffectPass`), plus un bloom léger.
3. **Le reste se paie au cas par cas** (profondeur de champ pour le zoom sur la voiture, paillettes de peinture en gros plan), chacun mesuré au banc.

**La vidéo pré-calculée n'est pas recommandée maintenant.** Elle ne vaudrait que pour l'acte de plongée du vol (4,6 s, déjà non interactif et déjà masqué par le voile crème), et seulement si le temps réel échoue au gate visuel. Contreparties détaillées plus bas.

**Ce qu'on n'atteindra pas à 60 i/s, dit franchement :** l'éclairage global path-tracé (ombres douces, rebonds de lumière entre voiture et nuages), le vrai flou de mouvement et les nuages volumétriques denses. Bonne nouvelle : la référence en use peu (voir ci-dessous).

## Ce que la référence doit vraiment au hors ligne

Observé sur la vidéo elle-même (téléchargée avec `yt-dlp`, planche de 10 images à 0,5 i/s, images isolées à 7,5 s et 12 s) :

| Constat | Conséquence pour nous |
|---|---|
| **1080 × 1920 à 60 i/s**, 17,2 s, 9,6 Mo en H.264 (format 299 de YouTube). Les variantes 30 i/s n'existent que jusqu'en 480p. `mpdecimate` ne retire aucune image sur 1034 : pas de doublons, ce sont 60 images distinctes par seconde. | La fluidité visée est 60 i/s : c'est déjà la cible de la carte #42 (16,7 ms par image). |
| Les deux modèles viennent de **Sketchfab** (description : « Car: Alex.Ka. Heli: Muhamad Mirza Arrafi »). | Même classe d'actifs que notre GT86 (export Sketchfab, voir [contenu-des-glb.md](contenu-des-glb.md)). Le réalisme ne vient pas du modèle. |
| Le ciel est une **photo de nuages nette**, avec un disque solaire bas. | Notre écart principal : dôme 1k flou. |
| **Tout** est rose (nuages, carrosserie, sol satellite) : signature d'un étalonnage global. | Une LUT sur toute l'image, pas une teinte sur le seul dôme. |
| La voiture porte un **covering mat à motifs** (lignes topographiques) : peu de reflets miroir. | Les reflets de la référence sont sages ; notre robe argent clearcoat en montre déjà plus. |
| À 7,5 s, les **pales du rotor sont nettes** : pas de flou de mouvement visible. | Le flou de mouvement n'est pas ce qui fait la référence. |
| Bandes noires obliques animées comme transition (montage DaVinci). | Faisable en DOM ou en shader plein écran, hors sujet rendu. |

Le moteur Blender (Cycles ou Eevee) n'est pas précisé par l'auteur.

## Ce qui existe déjà dans la scène

- **three 0.169.0**, **@react-three/fiber 9.7.0**, **@react-three/drei 10.7.8** (`package.json`). **Aucune bibliothèque de post-traitement installée** (ni `postprocessing`, ni `@react-three/postprocessing`).
- **Tone mapping** : rien n'est posé, donc le défaut de R3F s'applique, `ACESFilmicToneMapping` (`node_modules/@react-three/fiber/dist/events-*.cjs.dev.js`, ligne 15928 : `gl.toneMapping = flat ? NoToneMapping : ACESFilmicToneMapping`), sortie sRGB.
- **Canvas** : `dpr={[1, 1.5]}`, `antialias: true` (MSAA natif), `alpha: false`, `frameloop="always"` (`components/gt86/scene.tsx`).
- **Environnement** (`components/gt86/ciel.tsx`) : `<Environment files="/prototype/crepuscule.hdr" resolution={512} environmentIntensity={0.6}>` avec trois `Lightformer` cuits dans la cubemap, donc PMREM déjà en place. La HDRI est `qwantani_dusk_2_puresky` 1k (1,1 Mo).
- **Dôme visible** : sphère rayon 350, `meshBasicMaterial` avec la même HDR 1k en `map`, teintée `color="#d8927a"` (le commentaire le dit : « aucun puresky n'est rosé-orangé une fois tone-mappé »).
- **Carrosserie** : `MeshPhysicalMaterial` argent `#b4b9bf`, `metalness 0.6`, `roughness 0.22`, `clearcoat 1`, `clearcoatRoughness 0.08`, `envMapIntensity 2.4`. Verre fumé : clearcoat 1, opacité 0,8.
- Lumières directes : une directionnelle, une hémisphère, une ambiante.

### Le calcul du flou du ciel

Caméra du ciel : fov vertical 38° en 16:9, soit environ 63° en horizontal. Sur un écran 1920 px de large : **~30 px par degré**.
Une équirectangulaire couvre 360° :

| Largeur de la texture du dôme | Texels par degré | Étirement à l'écran | Poids HDR (Poly Haven) | Mémoire GPU en LDR RGBA8 + mips |
|---|---|---|---|---|
| 1k (actuel) | 2,8 | ×11 | 1,1 Mo | 5 Mo |
| 4k | 11,4 | ×2,7 | 17,6 Mo | ~43 Mo |
| 8k | 22,8 | ×1,3 | 67,7 Mo | ~170 Mo |

D'où la recommandation : **4k en JPG/AVIF LDR pour le dôme** (quelques Mo à télécharger, 43 Mo de VRAM), **la HDR 1k reste pour l'IBL** (l'éclairage n'a pas besoin de détail, la PMREM floute de toute façon). Le 8k est trop lourd pour un portfolio. Poly Haven fournit un JPG tonemappé en pleine définition (23 Mo pour `qwantani_dusk_2_puresky`) : il faut le réduire nous-mêmes à 4096 × 2048.

Aucune HDRI « sunrise-sunset / pure skies » de Poly Haven n'est rose (vérifié sur les vignettes de `belfast_sunset_puresky`, `kloppenheim_06_puresky`, `industrial_sunset_puresky`, `industrial_sunset_02_puresky`, `evening_road_01_puresky`, `qwantani_dusk_2_puresky`). Le rose se fabrique à l'étalonnage, comme dans la référence. `belfast_sunset_puresky` et `evening_road_01_puresky` ont des nuages plus texturés que notre ciel actuel : candidats pour un essai.

## Tableau technique

Coûts : **estimations d'ordre de grandeur** pour un GPU de bureau en 1080p, **pas des mesures**. Le headless ment sur les temps (mémoire projet) ; chaque ligne retenue se mesure avec `npm run banc:intro` sur le PC de Hugo, budget 16,7 ms par image.

| Technique | Gain visuel vers la référence | Coût estimé | Disponibilité (versions du dépôt) |
|---|---|---|---|
| **Fond de ciel 4k séparé de l'IBL** | **Très fort** : nuages nets, c'est l'écart n°1 | ~0 ms par image ; +2 à 3 Mo de téléchargement ; +40 Mo VRAM ; un upload de texture à chauffer (cf. #44) | three r169 natif (`TextureLoader`, ou `UltraHDRLoader` présent dans `examples/jsm/loaders`) ; drei `useEnvironment` lit aussi les gainmaps JPG/WebP (`@monogrid/gainmap-js`) |
| **Étalonnage LUT 3D** (rose global) | **Fort** : remplace la teinte du dôme, unifie voiture et ciel | <0,3 ms, fusionné avec le tone mapping dans un seul `EffectPass` | `postprocessing` 6.39.5 : `LUT3DEffect`, `LUTCubeLoader` (`.cube` exporté de DaVinci ou Photoshop) ; three r169 a aussi `LUTPass` |
| **Tone mapping AgX ou ACES** | Moyen : AgX tient mieux les hautes lumières saturées d'un couchant (moins de virage au jaune) | ~0 ms (déjà payé aujourd'hui) | three r169 : `AgXToneMapping = 6`, `NeutralToneMapping = 7` (`src/constants.js`) ; `postprocessing` : `ToneMappingMode.AGX` |
| **Bloom léger** (soleil, reflets du clearcoat) | Moyen | ~0,5 à 1 ms (chaîne mipmap à résolution réduite) | `postprocessing` `BloomEffect` ; three `UnrealBloomPass` |
| **Grain + vignette** | Moyen : casse le « trop propre » du CG, comme le grade de la référence | <0,1 ms (fusionnés dans le même `EffectPass`) | `NoiseEffect`, `VignetteEffect` |
| **Profondeur de champ** | Moyen, **seulement pour le zoom cinématographique** de la carte #42 ; la référence n'en montre pas sur les plans larges | ~1 à 2 ms | `DepthOfFieldEffect`, `BokehEffect` ; three `BokehPass` |
| **Paillettes de peinture** (normal map de flocons sous le clearcoat) | Faible à moyen, visible en gros plan ; la référence est un covering **mat** | ~0 ms ; une petite texture tuilée | `MeshPhysicalMaterial` r169 a `clearcoat`, `clearcoatNormalMap`, `anisotropy`, `iridescence`, `sheen`, `dispersion` ; pas de paramètre « flake » natif, il faut une normal map ou un `onBeforeCompile` |
| **Occlusion ambiante (N8AO / SSAO)** | Faible dans le ciel (rien autour de la voiture) ; utile dans la rue | ~1 à 3 ms | `@react-three/postprocessing` 3.2.0 embarque `n8ao` ; `SSAOEffect` |
| **Résolution de la PMREM 512 → 1024** | Faible : reflets un peu plus nets sur le verre | Coût unique au chargement, ~0 ms par image | drei `<Environment resolution>` (défaut 256, déjà monté à 512) |
| **Flou de mouvement** | Faible : **absent** des pales de la référence à 7,5 s | Élevé (buffer de vitesses par objet) | **Absent** de `postprocessing` 6.39.5 (aucun effet de vitesse dans le build) ; `AfterimagePass` de three n'est qu'une traînée, pas un vrai flou |
| **Éclairage global, ombres douces path-tracées, nuages volumétriques denses** | Ce qui reste d'écart après tout le reste | Hors budget 60 i/s | Hors temps réel (path tracer WebGL possible en image fixe, pas en animation fluide) |

### Câblage, si on ajoute le post-traitement

- Paquets : `postprocessing@6.39.5` (peer `three >= 0.168.0 < 0.187.0`, compatible r169) et `@react-three/postprocessing@3.2.0` (peers `react ^19`, `@react-three/fiber >= 9.7.0`, donc compatibles avec le 9.7.0 installé ; tire `n8ao` et `maath`).
- **Piège** : l'`EffectComposer` de `@react-three/postprocessing` force `gl.toneMapping = NoToneMapping` (dist/index.js, ligne 482). Sans `<ToneMapping>` explicite en fin de chaîne, l'image change d'aspect. Il faut le poser (AgX ou ACES) dans le même `EffectPass` que la LUT.
- Le composer rend en `HalfFloatType` avec `multisampling = 4` par défaut : le MSAA passe dans sa cible. `antialias: true` du Canvas devient inutile (double coût sinon).
- Un seul Canvas porte ciel, rue et habitacle : le composer touche tout. Activer ou doser les effets par état (`etat` de `scene.tsx`).
- Les programmes du composer sont **nouveaux** : ils doivent passer par la chauffe du #44 (`components/gt86/chauffe.ts`), sinon on réintroduit un gel à la première image.

## L'option inverse : une vidéo pré-calculée

L'idée : rendre une séquence dans Blender et la jouer à la place du temps réel.

**Où elle aurait du sens :** l'acte I du vol (`components/gt86/vol.tsx`, `DUREE = 4.6` s), la plongée de la voiture dans le banc de nuages. Il est déjà **non interactif**, à durée fixe, et la bascule vers la rue est déjà **cachée derrière le voile crème** du DOM. Le raccord est donc gratuit à la sortie.

**Où elle n'en a pas :** l'état CIEL (la voiture flottante, le survol qui change le curseur, le clic sur la carrosserie qui démarre tout). Une vidéo ne peut pas réagir au pointeur ; il faut le temps réel ici, donc le ciel temps réel doit de toute façon être beau. Le gain d'une vidéo ne porte que sur 2 à 4 secondes.

| Contrepartie | Détail |
|---|---|
| **Poids** | La référence pèse 9,6 Mo pour 17 s en 1080p60 H.264 (~4,6 Mbit/s). Pour 4 s à 1080p60 : ~2,5 Mo en H.264, ~1 Mo en AV1 (le 1080p60 AV1 de YouTube tourne à ~1,5 Mbit/s). Deux encodages à servir (AV1 + H.264 de repli). |
| **Format d'écran** | Une vidéo a un cadre fixe ; nos écrans de bureau varient (16:9, 16:10, ultra-large). `object-fit: cover` rogne les bords : il faut cadrer large au rendu. |
| **Raccord d'entrée** | La première image doit être identique à la dernière image temps réel : même caméra, même robe, même ciel, même tone mapping. Blender (AgX par défaut depuis 4.0) et three ne rendent pas pareil sans calage. Faisable sous un fondu court, pas en coupe franche. |
| **Production** | Refaire la scène dans Blender : importer le GLB, recréer le ciel, les nuages (volumétriques, chers à rendre), la lumière. Chaque retour de gate sur la robe ou le ciel se paie deux fois (Blender et three). Ordre de grandeur : 1 à 2 jours de mise en place, puis des heures de rendu par itération. |
| **Lecture** | Une `<video>` par-dessus la toile (le clic de départ vaut geste utilisateur, la lecture démarre) ; pendant la lecture, le GPU peut chauffer la rue en dessous. Risque : décodage matériel absent sur certaines machines, première image en retard. |
| **Accessibilité / repli** | Le repli sans WebGL / `reduce` existe déjà (hub 2D de la carte #42) : la vidéo ne le remplace pas. |

**Verdict :** à garder en réserve pour l'acte I si le gate visuel sur le temps réel amélioré échoue. Elle ne règle ni l'état CIEL ni la rue, qui restent en temps réel quoi qu'il arrive.

## Prochaine étape proposée

Un prototype gaté à l'œil de Hugo, mesuré au banc : fond de ciel 4k + `EffectPass` (AgX + LUT rose + grain + vignette) + bloom, comparé côte à côte à l'image actuelle et à une image de la référence.

## Sources

- La vidéo : formats listés par `yt-dlp -F` (format 299 : `1080x1920 60 avc1.64002A 4653k`), durée par `ffprobe` (17,233 s), doublons par `ffmpeg -vf mpdecimate` (1034 images gardées sur 1034), description et date par `yt-dlp --print`.
- three r169 : `node_modules/three/src/constants.js` (constantes de tone mapping, `REVISION = '169'`), `src/materials/MeshPhysicalMaterial.js` (anisotropy, iridescence, sheen, dispersion), `examples/jsm/postprocessing/` (`LUTPass`, `UnrealBloomPass`, `BokehPass`, `AfterimagePass`), `examples/jsm/loaders/` (`UltraHDRLoader`, `LUTCubeLoader`).
- @react-three/fiber 9.7.0 : `dist/events-b1bdeb1a.cjs.dev.js` ligne 15928 (tone mapping par défaut).
- @react-three/drei 10.7.8 : `core/Environment.js` ligne 90 (`resolution = 256`), `core/useEnvironment.js` (gainmaps JPG/WebP).
- `postprocessing` 6.39.5 et `@react-three/postprocessing` 3.2.0 : `npm view` (versions, peers) et le build lu dans l'archive `npm pack` (liste des effets, `ToneMappingMode.AGX`, `LUT3DEffect`, absence d'effet de vitesse ; `EffectComposer` lignes 365 et 482).
- Poly Haven : `https://api.polyhaven.com/assets?t=hdris&c=sunrise-sunset`, `https://api.polyhaven.com/files/qwantani_dusk_2_puresky` (poids 1k/2k/4k/8k, JPG tonemappé), vignettes `cdn.polyhaven.com/asset_img/thumbs/`.
- Le code : `components/gt86/scene.tsx`, `ciel.tsx`, `vol.tsx`, `chauffe.ts` sur `refonte-gt86` (38d5785).
