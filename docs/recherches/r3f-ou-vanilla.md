# R3F ou three vanilla — recherche du ticket #17

**Date** : 2026-08-13 · **Contexte** : Next 16.3.0, React 19.2.0 (épinglé), three 0.169.0 (épinglé), motion 12.43, Lenis.
**Question** : pour l'expérience multi-scènes pilotée par l'état React (nuages → rue → habitacle → écran média → GPS), migrer vers React Three Fiber v9 + drei, ou rester en three vanilla comme `voiture-drag.ts` ?

## Verdict

**React Three Fiber v9 + drei POUR LA NOUVELLE EXPÉRIENCE, sur sa route à elle, chargée `ssr: false` — et on ne touche pas à l'existant** (`voiture-drag.ts`, `world.tsx` restent vanilla : mesurés, livrés, aucun gain à les réécrire).

La raison tient en une phrase : cinq scènes couplées à l'état React avec un embed DOM dans la 3D et des rails de caméra, c'est très exactement le travail d'un réconciliateur — l'écrire vanilla, c'est réimplémenter fiber à la main (cycle de vie des scènes, disposal, synchronisation état→scène, CSS3DRenderer pour l'iframe Spotify). Le pattern vanilla du repo est excellent pour UN objet rendu à la demande ; il ne s'étend pas à cinq scènes sans construire l'infrastructure que fiber apporte toute faite.

## Compatibilité — vérifiée aux sources primaires

### fiber v9 × React 19.2 : compatibilité EXPLICITE, pas accidentelle

- `@react-three/fiber@9.7.0` (latest) déclare `react: ">=19 <19.3"` et `react-dom: ">=19 <19.3"` en peerDependencies — **19.2.0 exact est dans la plage**. Vérifié au registre npm (`npm view @react-three/fiber@latest peerDependencies`, 2026-08-13) et confirmé par le package.json du dépôt ([source](https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/package.json)).
- Le point dur avait un nom : React 19.2 a **incrémenté la version interne du réconciliateur**, incompatible avec 19.1. La release **v9.5.0 (30 déc. 2025)** l'a résolu en EMBARQUANT le réconciliateur dans fiber (comme react-dom le fait), ce qui rend fiber compatible de 19.0 à 19.2 ([notes de release](https://github.com/pmndrs/react-three-fiber/releases), v9.5.0 « React 19.2 support »). Donc : **installer ≥ 9.5.0, en pratique 9.7.0** (31 juil. 2026, dernière v9).
- **La borne haute `<19.3` est un vrai mur** : toute montée future de React à 19.3 devra attendre une release fiber. Le repo épingle react 19.2.0 exact — cohérent.
- `react-canary.d.ts` du repo n'est qu'une référence de TYPES (`/// <reference types="react/canary" />` pour `ViewTransition`) ; le runtime installé dans node_modules est react 19.2.0 stable, c'est lui que fiber résout. Aucun conflit : fiber livre ses propres types et ne touche pas aux déclarations canary.

### drei × React 19.2 / fiber v9

- `@react-three/drei@10.7.8` (latest) : `react: "^19"`, `react-dom: "^19"`, `@react-three/fiber: "^9.0.0"`, `three: ">=0.159"` (npm, 2026-08-13). **Tout est satisfait.** drei 10 est la lignée React 19 (la v9 de drei était la lignée React 18, cf. [pmndrs/drei#2260](https://github.com/pmndrs/drei/issues/2260)).

### three : **0.169 épinglé RESTE** — aucune montée requise

- fiber v9 : `three: ">=0.156"` ; drei 10 : `three: ">=0.159"`. **0.169.0 satisfait les deux.** Le pipeline voiture (studio.mjs, séquence, Draco) n'a pas à bouger.
- Attention au futur : la branche **v10 de fiber (alpha) exige `three >=0.185`** ([package.json branche master](https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/package.json)). La montée de major fiber, un jour, forcera la montée de three. Pas maintenant.

### Ce Next 16.3 (docs lues dans `node_modules/next/dist/docs/`)

- `next/dynamic` avec `{ ssr: false }` **ne marche que dans un Client Component** — interdit en Server Component, l'erreur est explicite (`01-app/02-guides/lazy-loading.md`). Le montage sera donc : page serveur → wrapper `"use client"` → `dynamic(() => import("./scene"), { ssr: false })`.
- `ssr: false` est le BON réglage ici, pas un pis-aller : le réconciliateur de fiber déclare `supportsHydration: false` ([reconciler.tsx](https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/core/reconciler.tsx)) — un canvas plein écran n'a rien à hydrater, le serveur n'a rien d'utile à en dire. Zéro risque d'écart d'hydratation par construction.
- Les docs d'installation de fiber recommandent `transpilePackages: ['three']` pour Next ≥13.1 ([installation.mdx](https://github.com/pmndrs/react-three-fiber/blob/master/docs/getting-started/installation.mdx)) — à vérifier au premier build : avec three ≥0.160 en ESM propre et Turbopack, c'est souvent superflu.
- Le React vendu par Next pour l'App Router est un canary CÔTÉ SERVEUR (RSC) ; les Client Components, eux, résolvent le react de node_modules = 19.2.0 stable, celui que fiber peer-check. Un canvas `ssr: false` ne vit QUE côté client.

## Coût bundle — MESURÉ, pas estimé

esbuild `--bundle --minify`, three 0.169.0 partout, react/react-dom externes (déjà payés par la page), 2026-08-13 :

| Entrée | brut | gzip | delta gzip |
|---|---|---|---|
| vanilla : `three` + GLTFLoader + DRACOLoader (= imports de `voiture-drag.ts`) | 552 Ko | **142 Ko** | — |
| + `@react-three/fiber` 9.7.0 (Canvas, useFrame, useLoader) | 832 Ko | **225 Ko** | +83 Ko |
| + drei 10.7.8 (Html, Environment, useGLTF, CameraControls, ScrollControls) | 1 021 Ko | **281 Ko** | +139 Ko vs vanilla |

Lecture honnête : **R3F+drei double le JS 3D (+139 Ko gzip)**. Mais les 142 Ko de three sont payés dans les deux cas, et TOUT le paquet vit derrière le `dynamic(..., { ssr: false })` de la route de l'expérience : la home continue de payer **zéro octet de 3D** tant qu'on ne saisit pas la voiture — la doctrine de `voiture.tsx` est intacte. Le tree-shaking de drei est réel : seuls les composants importés entrent au bundle (les 5 mesurés coûtent 57 Ko gzip, pas la bibliothèque entière).

## Ce que drei apporte CONCRÈTEMENT ici

- **`<Html>` — l'embed Spotify sur l'écran 3D — c'est LE morceau décisif.** `<Html transform occlude>` projette du DOM réel (donc une iframe interactive) en matrix3d dans la perspective de la scène, avec occlusion par la géométrie et callback `onOcclude` ([docs/misc/html.mdx](https://github.com/pmndrs/drei/blob/master/docs/misc/html.mdx)). L'équivalent vanilla est CSS3DRenderer + second renderer synchronisé + occlusion à la main — le morceau le plus coûteux à écrire soi-même.
- **`<MotionPathControls>` — les rails de caméra.** Chemins en courbes de Bézier/Catmull-Rom, damping, `focusObject` ([docs/controls/motion-path-controls.mdx](https://github.com/pmndrs/drei/blob/master/docs/controls/motion-path-controls.mdx)). Les transitions nuages → rue → habitacle sont des rails ; vanilla, c'est `THREE.CubicBezierCurve3` + lerp maison à chaque transition.
- **`useGLTF`** : GLTF + Draco intégrés, `useGLTF.preload()`. ⚠️ **Par défaut le décodeur Draco vient d'un CDN Google** — contraire à la doctrine « pas de CDN au runtime » de `voiture-drag.ts`. Obligatoire : `useGLTF.setDecoderPath("/voiture/draco/")` — le décodeur est déjà auto-hébergé dans public/ ([docs/loaders/gltf-use-gltf.mdx](https://github.com/pmndrs/drei/blob/master/docs/loaders/gltf-use-gltf.mdx)).
- **`<Environment>`** : ⚠️ les presets viennent aussi d'un CDN — les docs drei le déconseillent en production. Le repo a MIEUX : son studio maison (`tools/voiture/studio.mjs` + PMREMGenerator), partagé avec le pipeline. À garder tel quel dans la scène fiber (`scene.environment` posé en imperatif via `onCreated` ou un `useEffect`) : mêmes couleurs que la séquence, par construction.
- **`frameloop="demand"` + `invalidate()`** (fiber, pas drei) : le rendu à la demande — zéro frame quand rien ne bouge, la boucle s'arrête d'elle-même ([scaling-performance.mdx](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx), [loop.ts](https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/core/loop.ts)). C'est la doctrine rend-sur-événement de `voiture-drag.ts`, fournie par le framework.

## Versions à installer

```
npm i @react-three/fiber@^9.7.0 @react-three/drei@^10.7.8
```

three reste `0.169.0` épinglé, `@types/three` `0.169.0` idem. react/react-dom 19.2.0 inchangés.

## Risques connus (et leurs parades)

1. **Plafond `react <19.3`** : une montée de React attendra fiber. Parade : react est épinglé 19.2.0 ; noter le couple dans le commit qui installe.
2. **CDN par défaut** (Draco de `useGLTF`, presets d'`<Environment>`) : parade ci-dessus — `setDecoderPath` local + studio maison au lieu des presets.
3. **`<Html occlude>` × iframe Spotify** : l'occlusion « blending » a des artefacts connus (flou en mode transform selon devices, pointer-events à travers l'iframe). Parade : prototyper l'écran média EN PREMIER — c'est le seul morceau où drei peut décevoir.
4. **Bug `createPortal` sous React 19** ([fiber#3486](https://github.com/pmndrs/react-three-fiber/issues/3486)) : ne pas changer dynamiquement le conteneur d'un portal de scène.
5. **StrictMode** : la v9 a des breaking changes en Strict Mode (double-invocation qui révèle les effets non nettoyés — [guide de migration v9](https://github.com/pmndrs/react-three-fiber/blob/master/docs/tutorials/v9-migration-guide.mdx)). C'est une feature, mais les scènes devront nettoyer leurs effets proprement.
6. **fiber v10 exigera three ≥0.185** : la dette de montée de three est différée, pas annulée.
7. **Budget frame** : la doctrine de `voiture.tsx` (pas de 3D temps réel en concurrence avec le décor) reste vraie SUR LA HOME. L'expérience multi-scènes vit sur sa route, sans le décor `world` — le canvas y EST la page. `frameloop="demand"` pendant les poses, boucle active seulement pendant les transitions.

## Ce qui ne change PAS

- `voiture.tsx` / `voiture-drag.ts` : le régime drag vanilla reste. Le réécrire en fiber coûterait la re-validation de tous les chiffres du banc pour zéro gain visible.
- `world.tsx` : du DOM composité, pas du WebGL — hors sujet.
- Le pipeline `tools/voiture/` et le modèle Draco auto-hébergé : réutilisés tels quels par la scène fiber.
