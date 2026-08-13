"use client"

import { useMemo } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

/* La GT86 posée dans la rue — même GLB et même robe Argent que le ciel
   (verdict #21), mais à plat sur ses roues et PHARES ALLUMÉS : la
   recherche #16 a montré que Car_20 (matériau LightsFront, émissif blanc
   pur) est le glow pilotable — allumer = monter emissiveIntensity. */
const ARGENT = "#b4b9bf"

export default function VoitureRue(props: { position?: [number, number, number]; rotationY?: number }) {
  const { scene } = useGLTF("/prototype/gt86.glb")

  const modele = useMemo(() => {
    /* même robe qu'au #21 : un matériau NEUF remplace la peinture — muter
       la couleur ne suffit pas, la texture teal d'usine multiplierait */
    const peinture = new THREE.MeshPhysicalMaterial({
      color: ARGENT,
      metalness: 1.0,
      roughness: 0.06,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.0,
    })
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      /* le disque de sol du GLB (recherche #16) n'a rien à faire ici */
      if (mats.some((m) => m?.name === "Floor")) mesh.visible = false
      if (mats.some((m) => ["Paint", "Stern", "Aussenbeet"].includes(m?.name ?? ""))) {
        mesh.material = peinture
      }
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial
        if (mat?.name === "Glass") {
          const verre = mat as THREE.MeshPhysicalMaterial
          verre.map = null
          verre.color.set("#161b21")
          verre.metalness = 0.55
          verre.roughness = 0.03
          verre.clearcoat = 1
          verre.envMapIntensity = 1.2
          verre.transparent = true
          verre.opacity = 0.8
          verre.needsUpdate = true
        }
        /* les feux : croisement allumé, veilleuses arrière en braise —
           hors tone mapping pour que l'optique crève l'écran */
        if (mat?.name === "LightsFront") {
          mat.emissive?.set("#fff3dc")
          mat.emissiveIntensity = 8
          mat.toneMapped = false
        }
        /* la LED vit DANS le phare (verdict Hugo — pas de barre flottante) :
           l'optique s'allume de sa propre texture en carte d'émission,
           le dessin réel du phare fait la signature */
        if (mat?.name === "HeadlightsTex") {
          mat.emissive?.set("#bcd6f0")
          mat.emissiveMap = mat.map
          mat.emissiveIntensity = 1.6
          mat.needsUpdate = true
        }
        if (mat?.name === "RedGlow" || mat?.name === "BrakeLight") {
          mat.emissiveIntensity = 0.6
        }
        /* la livrée d'usine vit encore dans les textures des accessoires
           (garnish de malle, aileron) et rougeoie magenta la nuit — on la
           neutralise, verdict robe unique du #21 */
        if (mat?.name === "Taillightbody") {
          mat.map = null
          mat.color.set("#150c0e")
          mat.roughness = 0.35
          mat.needsUpdate = true
        }
        if (mat?.name === "Carbon") {
          mat.map = null
          mat.color.set("#1c1c20")
          mat.roughness = 0.5
          mat.needsUpdate = true
        }
      }
    })
    /* posée sur ses roues : le bas de la bbox affleure l'asphalte (y=0) */
    const boite = new THREE.Box3().setFromObject(scene)
    scene.position.set(
      -(boite.min.x + boite.max.x) / 2,
      -boite.min.y,
      -(boite.min.z + boite.max.z) / 2,
    )
    return scene
  }, [scene])

  return (
    <group position={props.position ?? [0, 0, 0]} rotation-y={props.rotationY ?? 0}>
      <primitive object={modele} />
    </group>
  )
}

useGLTF.preload("/prototype/gt86.glb")
