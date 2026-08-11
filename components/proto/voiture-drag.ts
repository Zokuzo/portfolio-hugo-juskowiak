/* ==================================================================
   RÉGIME DRAG (#12) — la scène WebGL de la voiture, chargée
   DYNAMIQUEMENT au premier geste avéré, jamais avant : le visiteur
   qui ne saisit pas ne paie ni three, ni ce module, ni le modèle.

   Le studio, les retouches et la caméra viennent du module PARTAGÉ
   avec le pipeline (tools/voiture/studio.mjs) : il n'y a pas deux
   studios, donc pas de teinte nouvelle par construction — le client
   réaffiche les mêmes couleurs, sur fond alpha.

   Le rendu est À LA DEMANDE : rend() n'est appelé que par l'événement
   de pointeur, au plus une fois par frame, zéro quand la main ne
   bouge pas. Aucune boucle ici.

   LE MODÈLE EST COMPRESSÉ DRACO, pas meshopt — arbitré aux chiffres le
   2026-08-11 : meshopt plafonne à 11 Mo sur cette géométrie (1,55 M de
   sommets), Draco descend à 5,8 Mo sans simplification. Son décodeur
   WASM (~300 Ko, chargé avec ce chunk) est servi depuis notre
   public/voiture/draco/ — pas de CDN au runtime. */
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { studio, retouches, regleRenderer, prepareModele, appliqueRetouches, placeCamera,
         FOV, FLOU_PMREM, INTENSITE_ENV } from "../../tools/voiture/studio.mjs"

/* Le cadre de recadrage de la séquence en production — l'union des
   pixels opaques sur les 160 vues, IRREJOUABLE ici (CREDIT.txt,
   campagne du 2026-08-11). Appliqué au viewport de la caméra : sans
   lui la voiture serait à la bonne pose mais pas à la bonne place
   dans la toile. */
export const CADRE = { x: 0.14017, y: 0.16378, c: 0.71967 }

const MODELE = "/voiture/modele-web.glb"

export type SceneDrag = {
  rend(azimutDeg: number, elevationDeg: number): void
  taille(largeur: number, hauteur: number): void
  info(): { geometries: number; textures: number }
  estPerdu(): boolean
  detruit(): void
}

export async function creeScene(toile: HTMLCanvasElement, surPerte?: () => void): Promise<SceneDrag | null> {
  /* Chaque échec rend null, sans un message : le drag azimut-seul sur
     la séquence reste, et c'est le repli permanent — le même
     renoncement propre que le composant applique à sa séquence. */
  let renderer: THREE.WebGLRenderer
  try {
    /* SANS MSAA, et c'est mesuré : avec antialias, le drag tenait à
       6,9 ms de p50 sur l'iGPU de référence — la moitié du budget pour
       le seul rendu. La toile est déjà sur-échantillonnée à DPR 1,5
       (voiture.tsx), ce qui fait office d'anti-aliasing ; c'est le
       gate humain au raccord qui juge les arêtes, pas ce commentaire. */
    renderer = new THREE.WebGLRenderer({ canvas: toile, alpha: true, antialias: false })
  } catch {
    return null
  }
  renderer.setPixelRatio(1) // les pixels sont gérés par taille(), comme la toile 2D
  regleRenderer(THREE, renderer)

  const scene = new THREE.Scene()
  scene.background = null
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 5000)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(studio(THREE), FLOU_PMREM).texture
  scene.environmentIntensity = INTENSITE_ENV
  const voiture = new THREE.Group()
  scene.add(voiture)

  const loader = new GLTFLoader()
  const draco = new DRACOLoader()
  draco.setDecoderPath("/voiture/draco/")
  loader.setDRACOLoader(draco)
  let gltf
  try {
    gltf = await loader.loadAsync(MODELE)
  } catch {
    draco.dispose()
    renderer.dispose()
    return null
  }
  const rayon = prepareModele(THREE, gltf.scene)
  appliqueRetouches(gltf.scene, retouches())
  voiture.add(gltf.scene)

  camera.setViewOffset(1, 1, CADRE.x, CADRE.y, CADRE.c, CADRE.c)

  let perdu = false
  toile.addEventListener("webglcontextlost", (e) => {
    e.preventDefault()
    perdu = true
    surPerte?.()
  })

  /* Échauffement HORS du geste : compile les shaders, téléverse les
     textures et la géométrie — la première saisie ne paiera que le
     rendu. C'est aussi ce qui rend info() honnête. */
  placeCamera(THREE, camera, rayon, 30)
  renderer.render(scene, camera)

  return {
    rend(azimutDeg, elevationDeg) {
      if (perdu) return
      voiture.rotation.y = THREE.MathUtils.degToRad(azimutDeg)
      placeCamera(THREE, camera, rayon, elevationDeg)
      renderer.render(scene, camera)
    },
    taille(l, h) {
      if (toile.width !== l || toile.height !== h) renderer.setSize(l, h, false)
    },
    info: () => ({ geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }),
    estPerdu: () => perdu,
    detruit() {
      draco.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
