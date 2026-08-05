# Cuisson des textures du monde

Les bruits du décor (`--fog-body`, `--fog-wisp`, `--grain-tex` dans
`app/planche.css`) sont servis en WebP statiques depuis `/public/monde/`.
Leurs SOURCES restent les SVG feTurbulence ci-dessous : pour retoucher une
texture, modifier le SVG puis recuire — jamais éditer le WebP.

Pourquoi cuits : Firefox recalcule un filtre feTurbulence à chaque
rasterisation de la couche qui le porte (mesuré en centaines de ms par
occurrence), là où Chromium le met en cache. Une image se décode une fois.

## Recuire

Dans un navigateur (ou un script canvas) : charger chaque data-URI dans une
`Image`, la dessiner sur un canvas à sa taille native, exporter
`toDataURL("image/webp", q)` — q = 0,85 pour les brumes (floues), 0,99 pour
le grain (fin). Écrire dans `public/monde/`.

## Sources

Seul le grain est encore servi. Les deux textures de brume
(brume-corps.webp, brume-volutes.webp) ont été retirées avec la brume
elle-même — leurs recettes restent dans l'historique git de ce fichier
si la brume revient un jour.

grain.webp — 200×200 — bruit achromatique fin :

```
data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E
```
