"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

/* L'expérience ne se monte pas sous reduce en prod (spec #25) ; ici on
   fige seulement les animations pour pouvoir quand même juger le rendu. */
export const REDUIT =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

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
    })
    morts.forEach((o) => o.removeFromParent())
    const centre = new THREE.Box3().setFromObject(scene).getCenter(new THREE.Vector3())
    scene.position.sub(centre)
    return scene
  }, [scene])

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
      <group rotation={[0, -Math.PI / 5, 0]}>
        <group rotation={[1.0, 0, 0]}>
          <primitive object={modele} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload("/prototype/gt86.glb")
