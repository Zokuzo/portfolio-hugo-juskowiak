/* Le modulo négatif de JavaScript a déjà mordu ce composant une fois
   (voir le commentaire d'`index` dans voiture.tsx) : l'arithmétique du
   drag est extraite dans geste.mjs pour être prouvée ici, au node --test.
   Lancement : node --test tools/voiture/geste.test.mjs */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mod, azimutVersIndex, offsetAuRelachement } from "../../components/proto/geste.mjs"

test("mod ramène les négatifs dans [0, nb)", () => {
  assert.equal(mod(-1, 160), 159)
  assert.equal(mod(320, 160), 0)
  assert.equal(mod(-161, 160), 159)
})

test("azimutVersIndex aimante au cran le plus proche (ajustement ≤ 1,125°)", () => {
  assert.equal(azimutVersIndex(0, 160), 0)
  assert.equal(azimutVersIndex(1.124, 160), 0)        // sous le demi-cran : image 0
  assert.equal(azimutVersIndex(1.126, 160), 1)        // au-dessus : image 1
  assert.equal(azimutVersIndex(315, 160), 140)        // la pose de départ, azimut 315°
  assert.equal(azimutVersIndex(-2.25, 160), 159)      // un cran en arrière : la voisine
  assert.equal(azimutVersIndex(3600 + 315, 160), 140) // dix tours plus loin : même image
})

test("offsetAuRelachement : l'angle laissé par la main persiste", () => {
  const P = { nb: 160, pose: 140 }
  // relâché sur la pose de départ : offset nul
  assert.equal(offsetAuRelachement(140 * 2.25, P), 0)
  // relâché trois crans plus loin : offset 3
  assert.equal(offsetAuRelachement(143 * 2.25, P), 3)
  // un tour arrière complet : offset nul, jamais négatif
  assert.equal(offsetAuRelachement((140 - 160) * 2.25, P), 0)
})
