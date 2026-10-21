# DA unique de la fusion mobile (le site sous 768 px, revue seule à /da/m/ab)

Une seule voix par rôle. Si un écran a besoin d'un deuxième langage, c'est l'écran qui a tort.

1. Titres : Saira italique 800, capitales, aplat d'encre (`--encre`). Aucun dégradé, aucune lueur.
2. Texte : la police de texte du site (`--f-display`), en `--encre` ou `--encre-2`.
3. Étiquette secondaire : le mono en capitales espacées, et lui seul. Les katakana ne gardent qu'UN accent : le nom de Hugo au-dessus du titre de l'accueil.
4. Accent : une couleur (`--accent`), toujours en aplat (ligne choisie, onglet du dock, trait d'onglet, puce, bouton). Jamais en couleur de texte : le texte posé dessus prend `--accent-encre`.
5. Cartes : surface pleine (`--surface`) cernée d'un filet fin (`--filet`), rayon 18 px. Pas d'ombre décalée, pas de biseau.
6. Icônes d'apps : les stickers garage, sans tuile, liseré `--sticker-lisere`, contour `--sticker-contour`, couleurs lues dans les tokens `--sticker-*` et `--accent`. Pas d'ombre portée. `--sticker-signal` (le jaune des panneaux) reste neutre, sauf dans `nuit-rose` : l'accent est la seule couleur.
7. Figures Hairline : trait fin monochrome à l'encre, plaque `--surface`.
8. La plaque HUGOJSK : une seule fois, dans la barre du haut. Elle garde la police de la plaque 3D (c'est le logo), mais se trace à l'encre, sans dégradé, et son badge GT86 prend l'accent.
9. Largeur : l'app est une colonne mobile de 440 px max, centrée sur `--hors-cadre`, dock et feuille compris.

## Tokens (posés sur `.racine`, redéfinis sous `html.clair`)

Fond et texte : `--fond`, `--surface`, `--encre`, `--encre-2`, `--filet`, `--voile`, `--hors-cadre`.
Accent : `--accent`, `--accent-encre`.
Stickers : `--sticker-contour`, `--sticker-lisere`, `--sticker-papier`, `--sticker-fonce`, `--sticker-metal`, `--sticker-signal`.

Décliner une palette = redéfinir ces tokens sur `.racine` (et sous `html.clair`), rien d'autre.

## Palettes (`?palette=<nom>`, revue à /da/m/palettes)

Cinq jeux de tokens, chacun en sombre et en clair (`.racine[data-palette]` dans `ab.module.css`, liste dans `palettes.ts`). Défaut : `silver-s13`, choisie par Hugo le 2026-10-21.

- `papier-encre` : noir et blanc de magazine, un seul rouge signal. La plus sobre.
- `silver-s13` : gris acier de la GT86 silver, bleu électrique.
- `nfsu-orange` : asphalte de nuit, orange sodium (orange brûlé de jour).
- `menthe-y2k` : violet profond et menthe ; de jour, le violet devient l'accent.
- `nuit-rose` : la référence d'avant, violet nuit et rose.

Sur l'aplat d'accent, le texte reste plein (`--accent-encre`, sans opacité) : estompé, il tombe sous l'AA.
