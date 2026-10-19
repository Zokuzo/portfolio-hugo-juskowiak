import { useEffect, useRef, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
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
    /* Seule la variante hors écran se compile ici : rien de la rue ne se
       peint à l'écran, tout passe par la cible du composer (#46, #59),
       sortie linéaire sans tone mapping. Une cible posée pendant la
       compilation produit cette variante ; rendEnSolo n'y ajoute que la
       préparation du pilote pour le format de la cible. */
    gl.setRenderTarget(horsEcran)
    return gl.compileAsync(sujet, camera, scene).finally(() => horsEcran.dispose())
  } finally {
    gl.setRenderTarget(cibleAvant)
    scene.visible = sceneVisible
    sujet.visible = sujetVisible
  }
}

/* LA CIBLE DE CHAUFFE (#46, #59) : la scène se peint dans la cible
   flottante multiéchantillonnée du composer (rendu.tsx), pas à l'écran.
   Le rendu en solo s'y fait donc aussi : sans ça, la bascule ciel vers
   rue gelait 220 ms (banc headless) alors qu'aucun programme ne
   s'ajoutait, le temps que le pilote prépare ses variantes pour ce
   format de cible. Nulle tant que le composer n'a pas signalé sa
   chauffe, et après son démontage. */
let cibleDeChauffe: THREE.WebGLRenderTarget | null = null
export function chauffeDans(cible: THREE.WebGLRenderTarget | null) {
  cibleDeChauffe = cible
}

/* Un rendu de `sujet` seul, TOUT montré et sans culling : textures et
   tampons de géométrie partent au GPU maintenant, plus au premier passage
   dans le champ ni au premier allumage (cônes des phares, néons, poussière
   de l'impact naissent cachés). Les lumières, toujours montées, gardent
   leur nombre : forcer `visible` ne change pas la topologie. Ce que la
   compilation n'a pas prévu (la face arrière des verres double face,
   peinte en passe séparée) s'y compile aussi, derrière le voile. À appeler
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
  const cibleAvant = gl.getRenderTarget()
  if (cibleDeChauffe) gl.setRenderTarget(cibleDeChauffe)
  try {
    gl.render(scene, camera)
  } finally {
    if (cibleDeChauffe) gl.setRenderTarget(cibleAvant)
    restaure.forEach((r) => r())
  }
}

/* LA CHAUFFE D'UN GROUPE MONTÉ (#44) : tous ses programmes se compilent
   EN PARALLÈLE dès le montage, avec SA topologie de lumières
   (compileEnSolo), puis un rendu en solo téléverse textures et
   géométries (rendEnSolo). `surChaude` tombe une image plus tard : le GPU
   a digéré le rendu en solo, sinon la première image découverte attendait
   derrière lui (70 ms au banc). */
export function useChauffeEnSolo(groupe: RefObject<THREE.Object3D | null>, surChaude?: () => void) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const chauffe = useRef<"froide" | "compilee" | "rendue" | "chaude">("froide")
  useEffect(() => {
    if (!groupe.current) return
    let annule = false
    compileEnSolo(gl, scene, camera, groupe.current).then(() => {
      if (!annule && chauffe.current === "froide") chauffe.current = "compilee"
    })
    return () => {
      annule = true
    }
  }, [gl, scene, camera, groupe])
  useFrame(() => {
    /* le rendu en solo attend la cible du composer : peint à l'écran, il
       compilait pour rien les variantes sRVB (10 programmes de plus) */
    if (chauffe.current === "compilee" && groupe.current && cibleDeChauffe) {
      chauffe.current = "rendue"
      rendEnSolo(gl, scene, camera, groupe.current)
    } else if (chauffe.current === "rendue") {
      chauffe.current = "chaude"
      surChaude?.()
    }
  })
}
