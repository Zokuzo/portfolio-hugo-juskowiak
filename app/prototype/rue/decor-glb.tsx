"use client"

import { useEffect, useMemo } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

/* Le décor sourcé (variantes B/C/D du gate #22) : un GLB optimisé posé tel
   quel. La bbox part en console au montage — c'est la sonde qui donne
   l'échelle et le centre pour caler la voiture dans chaque décor. */
export default function DecorGlb({
  fichier,
  echelle = 1,
  position = [0, 0, 0],
  rotationY = 0,
  sonde,
  nuit,
}: {
  fichier: string
  echelle?: number
  position?: [number, number, number]
  rotationY?: number
  /* centre de la sonde de sol : imprime en console la hauteur du premier
     impact d'un rayon vertical, sur une grille de ±10 m — c'est la carte
     qui dit où une voiture peut poser ses roues */
  sonde?: [number, number, number]
  /* la ville s'habite : les vitrages du décor s'allument de l'intérieur
     (émissif chaud voilé par leur propre texture — patchwork de fenêtres) */
  nuit?: boolean
}) {
  const { scene } = useGLTF(fichier)

  const modele = useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      /* les décors d'auteurs arrivent avec des réglages disparates — on
         normalise ce qui coûte : pas d'ombres, frustum culling actif */
      mesh.castShadow = false
      mesh.receiveShadow = false
      if (nuit) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of mats) {
          const mat = m as THREE.MeshStandardMaterial
          if (mat?.name?.includes("Glass")) {
            mat.emissive?.set("#ffca7a")
            if (mat.map) mat.emissiveMap = mat.map
            mat.emissiveIntensity = 0.8
            mat.needsUpdate = true
          }
        }
      }
    })
    return scene
  }, [scene, nuit])

  useEffect(() => {
    const boite = new THREE.Box3().setFromObject(modele)
    const taille = boite.getSize(new THREE.Vector3())
    const centre = boite.getCenter(new THREE.Vector3())
    console.log(
      `[decor] ${fichier} bbox taille=(${taille.x.toFixed(1)}, ${taille.y.toFixed(1)}, ${taille.z.toFixed(1)}) centre=(${centre.x.toFixed(1)}, ${centre.y.toFixed(1)}, ${centre.z.toFixed(1)}) minY=${boite.min.y.toFixed(2)}`,
    )
    if (!sonde) return
    modele.parent?.updateWorldMatrix(true, true)
    const ray = new THREE.Raycaster()
    const bas = new THREE.Vector3(0, -1, 0)
    for (let dz = -24; dz <= 24; dz += 3) {
      let ligne = `z=${String(sonde[2] + dz).padStart(4)} |`
      for (let dx = -24; dx <= 24; dx += 3) {
        ray.set(new THREE.Vector3(sonde[0] + dx, 60, sonde[2] + dz), bas)
        const impact = ray.intersectObject(modele, true)[0]
        ligne += (impact ? (60 - impact.distance).toFixed(1) : "·").padStart(6)
      }
      console.log("[sol] " + ligne)
    }
    let entete = "[sol] x =    |"
    for (let dx = -24; dx <= 24; dx += 3) entete += String(sonde[0] + dx).padStart(6)
    console.log(entete)
  }, [modele, fichier, sonde])

  return (
    <group position={position} rotation-y={rotationY} scale={echelle}>
      <primitive object={modele} />
    </group>
  )
}
