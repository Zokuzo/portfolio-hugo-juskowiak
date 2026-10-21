import * as THREE from "three"

/* LES SPOTS ÉCONOMES (#47). Dans three r169, chaque spot passe par le BRDF
   complet (diffus, GGX, et un second GGX sous le vernis) même quand il
   n'éclaire pas le pixel : hors du cône, au-delà de `distance`, ou à
   intensité 0 (néons et phares avant la cascade). getSpotLightInfo le sait
   déjà (directLight.visible) : on n'appelle RE_Direct que s'il est vrai.
   Une lumière invisible apporte exactement 0 : aucun effet visuel.

   Le correctif réécrit le TEXTE du chunk au chargement du module, avant
   toute compilation (importé en tête de scene.tsx, seul <Canvas> du site) :
   le nombre de programmes ne change pas. Seule la boucle des spots est
   touchée ; points, directionnelles, aires et ombres restent intactes. */

const BOUCLE_DES_SPOTS = "NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )"
const APPEL_DU_BRDF = "RE_Direct( directLight,"
const GARDE = "if ( directLight.visible ) "

function sauteLesSpotsEteints() {
  const chunk = THREE.ShaderChunk.lights_fragment_begin
  const boucle = chunk.indexOf(BOUCLE_DES_SPOTS)
  const appel = boucle < 0 ? -1 : chunk.indexOf(APPEL_DU_BRDF, boucle)
  if (appel < 0) {
    console.warn("spots-economes : boucle des spots introuvable dans lights_fragment_begin (three a changé ?), correctif ignoré")
    return
  }
  /* rechargement à chaud : le module se réévalue sur un chunk déjà garni */
  if (chunk.slice(appel - GARDE.length, appel) === GARDE) return
  THREE.ShaderChunk.lights_fragment_begin = chunk.slice(0, appel) + GARDE + chunk.slice(appel)
}

sauteLesSpotsEteints()
