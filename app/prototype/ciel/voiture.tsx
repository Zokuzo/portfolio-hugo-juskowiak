"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

/* L'expérience ne se monte pas sous reduce en prod (spec #25) ; ici on
   fige seulement les animations pour pouvoir quand même juger le rendu. */
export const REDUIT =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* LA robe — verdict du gate : Argent, anodisé poli, seul survivant du
   testeur de couleurs. Le teal texturé d'usine est resté dans l'historique. */
const ARGENT = "#b4b9bf"

export default function Voiture() {
  const { scene } = useGLTF("/prototype/gt86.glb")
  const groupe = useRef<THREE.Group>(null)

  const modele = useMemo(() => {
    /* Le GLB embarque un disque de sol semi-transparent (matériau `Floor`,
       recherche #16) qui n'a rien à faire dans le ciel — et qui fausse la
       bbox. On le retire avant de centrer. */
    const morts: THREE.Object3D[] = []
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (mats.some((m) => m?.name === "Floor")) morts.push(o)
      /* l'effet glass : on jette la texture du verre (elle portait le
         bandeau Rocket Bunny — neutralisé au gate) et on pose un vrai
         verre fumé poli, miroir du couchant, l'habitacle en transparence */
      for (const m of mats) {
        if (m?.name === "Glass") {
          const verre = m as THREE.MeshPhysicalMaterial
          verre.map = null
          verre.color.set("#161b21")
          verre.metalness = 0.55
          verre.roughness = 0.03
          verre.clearcoat = 1
          verre.clearcoatRoughness = 0.02
          verre.envMapIntensity = 3.5
          verre.transparent = true
          verre.opacity = 0.8
          verre.needsUpdate = true
        }
      }
    })
    morts.forEach((o) => o.removeFromParent())
    const centre = new THREE.Box3().setFromObject(scene).getCenter(new THREE.Vector3())
    scene.position.sub(centre)
    return scene
  }, [scene])

  /* anodisé poli : miroir métallique, le ciel se découpe dans la robe */
  const peinture = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: ARGENT,
        metalness: 1.0,
        roughness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 3.5,
      }),
    [],
  )

  useEffect(() => {
    /* la robe couvre la carrosserie ET la jante (étoile + lit extérieur) —
       pneus, freins et visserie restent d'origine */
    const PEINTS = ["Paint", "Stern", "Aussenbeet"]
    modele.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (mats.some((m) => PEINTS.includes(m?.name ?? ""))) {
        mesh.material = peinture
      }
    })
  }, [modele, peinture])

  useFrame((etat) => {
    if (REDUIT || !groupe.current) return
    const t = etat.clock.elapsedTime
    groupe.current.position.y = Math.sin(t * 0.55) * 0.16
    groupe.current.rotation.z = Math.sin(t * 0.32) * 0.022
    groupe.current.rotation.x = Math.sin(t * 0.45 + 1.3) * 0.014
  })

  return (
    /* extérieur : la respiration ; milieu : le cap ; intérieur : le piqué
       nez vers le bas de la photo de référence (verdict #21) */
    <group ref={groupe}>
      {/* cap : le −36° d'origine, −65° puis +10° au fil du gate */}
      <group rotation={[0, -Math.PI / 5 - (55 * Math.PI) / 180, 0]}>
        <group rotation={[1.0, 0, 0]}>
          <primitive object={modele} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload("/prototype/gt86.glb")
