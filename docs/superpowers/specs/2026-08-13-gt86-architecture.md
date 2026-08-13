# La colonne vertébrale de la GT86 — spec d'architecture

Résout le ticket [#25](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/25) de la carte [#15](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/15) — 2026-08-13.
S'appuie sur les recherches [#16](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/16) (GLB), [#17](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/17) (stack), [#18](https://github.com/Zokuzo/portfolio-hugo-juskowiak/issues/18) (Spotify) — détails sur les branches `research/*`.

## La stack

React Three Fiber **9.7.0** + drei **10.7.8** ; three reste épinglé **0.169.0** (compat vérifiée, #17). L'existant vanilla (`voiture-drag.ts`, `world.tsx`) ne bouge pas. Montage : page serveur → wrapper `"use client"` → `dynamic(() => import(...), { ssr: false })`. Le paquet 3D (+139 Ko gzip mesurés) ne charge que si l'expérience se monte.

## Où tout vit

- **`/` — la home en surcouche.** Le serveur rend la **version simple complète** (celle du mobile) : contenu indexable, repli déjà en place. Côté client, si la machine est *desktop capable*, l'expérience 3D se monte par-dessus en plein écran. Si le montage échoue (WebGL refusé, erreur de chargement), on retire la surcouche : la version simple est déjà là, le repli ne coûte rien.
- **Desktop capable** = `pointer: fine` ET viewport ≥ 1024 px ET WebGL2 créable ET pas de `prefers-reduced-motion` (l'expérience est un cinématique — sous reduce, la version simple EST la bonne réponse).
- **`/work`** (expériences pro) et **`/home`** (projets perso, hobbys, qualifications) : vraies routes 2D, SSR, **responsive** (le mobile y accède aussi), habillées nuit. À la bascule prod, la nouvelle `/work` **remplace** les fiches actuelles ; les anciennes fiches partent avec l'ancien monde.
- Langue : pattern existant — la bascule FR/EN change le contenu, jamais l'URL.

## La machine à états (une seule, côté client)

```
CIEL ──clic──▶ ATTERRISSAGE ──▶ SEUIL ──▶ HABITACLE ──▶ ÉCRAN-HUB
 │                │              (phares +      ▲          │
 └──── skip ──────┴──────────────  nom)         │          ├─ GPS ▶ CHOIX ▶ DÉPART(dest) ▶ router.push(/work|/home)
                                                └──────────┴─ MUSIQUES ▶ SPOTIFY (overlay) ▶ retour
```

- **Skip** (« passer », discret, présent de CIEL à SEUIL) → HABITACLE écran allumé. L'habitacle-hub est le menu du site.
- **L'intro se joue une fois par session** (`sessionStorage`) : retour navigateur ou nouvelle visite dans la session → HABITACLE direct.
- Les transitions sont des **rails de caméra** (courbes, damping) ; `frameloop="demand"` en pose, boucle active seulement pendant les transitions. Pas de portière animée dans le GLB (#16) : l'entrée dans l'habitacle est une mise en scène caméra — le storyboard exact appartient au ticket #24.
- Les destinations finales sont de **vraies navigations Next** (`router.push`), pas des états du canvas.

## Doctrine des écrans et du texte

- **Aucun texte porté par la 3D.** Tout texte lisible (nom au seuil, UI GPS, labels) est du **DOM en overlay** par-dessus le canvas : netteté native, bilingue par le dictionnaire existant, accessible au clavier.
- **Écran média** (#18) : à froid, le quad d'écran du modèle porte une texture statique. Interaction → la caméra cadre l'écran perpendiculairement → **overlay DOM à plat** (jamais de `<Html transform occlude>` pour un iframe). Sortie : démontage, dézoom.
- **Spotify** : façade click-to-load (les cookies ne partent qu'au clic — RGPD), thème sombre (`theme=0`), **playlist ou artiste** (le profil est refusé par oEmbed), extraits 30 s si le visiteur n'a pas de session Spotify — assumé. URL fournie par le ticket #19.
- **UI GPS** : même mécanique d'overlay, au ratio/résolution que fixera le choix d'écran (#23, #26).

## Les assets

- Pipeline `gltf-transform optimize` **structure préservée** (les nœuds cliquables et matériaux émissifs survivent — vérifié, #16) : GT86 14,55 Mo → **1,5–2,3 Mo**, PSP 35,41 Mo → **0,72 Mo** si retenue. Sorties WebP, dans `public/`.
- Décodeur (Draco ou meshopt) **auto-hébergé** — `useGLTF.setDecoderPath` local, jamais le CDN par défaut de drei ; pareil pour l'environnement : le studio maison (`tools/voiture/studio.mjs`), pas les presets CDN.
- **Préchargement en cascade** : le CIEL ne demande que la voiture + le ciel ; pendant le vol, `useGLTF.preload` de la rue et de l'habitacle ; `next/link` prefetch de `/work` et `/home`. Le clic d'atterrissage n'attend jamais.
- Phares : `emissiveIntensity` sur `LightsFront`/`RedGlow` (#16) + vraies lumières pour mordre la rue.

## Le chantier

- Branche **`refonte-gt86`**, coupée d'`origin/main` — les 29 commits univers non poussés de main ne montent pas dans les previews. Chaque gate œil Hugo = un push de branche → preview Vercel.
- La bascule prod (merge, sort des 29 commits, critère « prêt ») est un ticket à part.
