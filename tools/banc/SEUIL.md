# Le seuil du banc — consigné à l'issue #5, le 2026-08-10

## L'unité qui compare, et la seule

**Pourcentage de frames au-dessus de 8,3 ms, à plancher de cadence
égal.** Jamais une comparaison de planchers : les planchers relevés le
même jour, même binaire, même méthode, vont de 8,40 ms à 33,30 ms
(issue #11) — un relevé à plancher inégal ne conclut à rien.

Les chiffres de ce banc ne se comparent pas non plus à ceux du relevé
du 2026-08-05 : l'origine du chronomètre a changé (voir l'en-tête de
`frame.mjs`).

## Le seuil d'alerte : 10 %

Une campagne dont **plus de 10 % des frames dépassent 8,3 ms** (à
plancher 8,40 ms) mérite une enquête avant tout commit qui touche au
défilement.

Pourquoi 10 : la bande de bruit mesurée le 2026-08-10 — trois
campagnes consécutives à plancher égal (8,40 ms) — va de **2,72 % à
7,07 %** sans qu'aucun code ait changé. Un seuil dans cette bande
mentirait une fois sur deux ; 10 % est le premier chiffre rond
au-dessus d'elle. À resserrer quand l'issue #11 aura expliqué et
réduit la variance.

## Pas de gate pre-commit, et c'est une décision

Un contrôle bloquant assis sur une mesure qui varie de 2,7 à 7,1 % à
code constant produirait des faux positifs en série et finirait
contourné. Le banc se lance à la main, en une commande :

```
npm run build && npx next start -p 3210 &
npm run banc -- http://localhost:3210/ accueil --tete
```

`--tete` n'est pas optionnel : Chrome headless composite en logiciel
et ne peut pas répondre à une question à 120 Hz.
