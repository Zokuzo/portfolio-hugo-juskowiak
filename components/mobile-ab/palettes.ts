/* Les palettes de ab.module.css (.racine[data-palette]) : seules les
   couleurs changent. Fichier sans "use client" : la revue serveur
   (app/da/m/palettes) lit la même liste que la fusion. */
export const PALETTES = ["silver-s13", "nuit-rose", "papier-encre", "nfsu-orange", "menthe-y2k"] as const
export type Palette = (typeof PALETTES)[number]
export const PALETTE_PAR_DEFAUT: Palette = "silver-s13"
