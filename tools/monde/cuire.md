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

brume-corps.webp — 700×700 — basse fréquence anisotrope (x < y ⇒ blobs
étirés horizontalement = bancs), 2 octaves :

```
data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='700'%3E%3Cfilter id='a' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.0032 0.0055' numOctaves='2' seed='11' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .34 .34 .34 0 0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='table' tableValues='0 0 .06 .3 .72 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='700' height='700' filter='url(%23a)'/%3E%3C/svg%3E
```

brume-volutes.webp — 700×700 — fréquence moyenne, 4 octaves, table alpha
seuillée ⇒ traînées éparses :

```
data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='700'%3E%3Cfilter id='b' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.011 0.02' numOctaves='4' seed='29' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .34 .34 .34 0 0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='table' tableValues='0 0 0 .12 .45 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='700' height='700' filter='url(%23b)'/%3E%3C/svg%3E
```

grain.webp — 200×200 — bruit achromatique fin :

```
data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E
```
