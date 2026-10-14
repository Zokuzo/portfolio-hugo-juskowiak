import * as THREE from "three"

/* LA CHAUFFE EN SOLO : ticket #44 de la carte #42.

   La rue se monte INVISIBLE pendant le ciel. Or three r169 ne collecte que
   les lumières VISIBLES (`compile()` et `render()` passent par
   `traverseVisible`), et le nombre de lumières entre dans la clé de chaque
   programme : compilée telle quelle, la rue l'était avec l'éclairage du
   ciel (dir 1, spot 0) au lieu du sien (dir 0, spot 9), et tout se
   recompilait en synchrone à la bascule (gel de 5,4 s mesuré au banc #43).
   Ces deux gestes montrent au renderer la rue SEULE, comme à la bascule,
   le temps d'un appel synchrone : aucune image ne peint cet état. */

/* Compile en parallèle (KHR_parallel_shader_compile) les programmes de
   `sujet` avec SA topologie de lumières, contre la VRAIE scène (brume et
   environnement entrent aussi dans la clé). `scene.visible = false` vide
   la collecte côté scène : la passer telle quelle compterait deux fois les
   lumières du sujet, qui en fait partie. */
export function compileEnSolo(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  sujet: THREE.Object3D,
): Promise<unknown> {
  const sceneVisible = scene.visible
  const sujetVisible = sujet.visible
  scene.visible = false
  sujet.visible = true
  const cibleAvant = gl.getRenderTarget()
  const horsEcran = new THREE.WebGLRenderTarget(1, 1)
  try {
    const versEcran = gl.compileAsync(sujet, camera, scene)
    /* le verre du décor (KHR_materials_transmission) déclenche la passe de
       transmission : les opaques y sont redessinés dans une cible hors
       écran, sortie linéaire sans tone mapping, donc une DEUXIÈME variante
       de chaque programme. Une cible posée pendant la compilation la
       produit aussi. */
    gl.setRenderTarget(horsEcran)
    const versTransmission = gl.compileAsync(sujet, camera, scene)
    return Promise.all([versEcran, versTransmission]).finally(() => horsEcran.dispose())
  } finally {
    gl.setRenderTarget(cibleAvant)
    scene.visible = sceneVisible
    sujet.visible = sujetVisible
  }
}

/* Un rendu de `sujet` seul, TOUT montré et sans culling : textures et
   tampons de géométrie partent au GPU maintenant, plus au premier passage
   dans le champ ni au premier allumage (cônes des phares, néons, poussière
   de l'impact naissent cachés). Les lumières, toujours montées, gardent
   leur nombre : forcer `visible` ne change pas la topologie. Ce que la
   compilation n'a pas prévu (la face arrière du verre double face, que la
   transmission retourne) s'y compile aussi, derrière le voile. À appeler
   dans un useFrame : le rendu normal de R3F repeint la même image juste
   après, l'écran ne voit jamais ce rendu. */
export function rendEnSolo(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  sujet: THREE.Object3D,
) {
  const restaure: (() => void)[] = []
  const pose = <K extends "visible" | "frustumCulled">(o: THREE.Object3D, cle: K, valeur: boolean) => {
    const avant = o[cle]
    if (avant === valeur) return
    o[cle] = valeur
    restaure.push(() => {
      o[cle] = avant
    })
  }
  for (const o of scene.children) if (o !== sujet) pose(o, "visible", false)
  sujet.traverse((o) => {
    pose(o, "visible", true)
    pose(o, "frustumCulled", false)
  })
  try {
    gl.render(scene, camera)
  } finally {
    restaure.forEach((r) => r())
  }
}
