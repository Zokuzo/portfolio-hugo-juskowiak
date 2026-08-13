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

/* Les robes réfléchissantes à essayer — la première garde le matériau
   d'origine (teal texturé, mat). La teinte des autres vient d'une vraie
   peinture physique : métal + clearcoat, l'environnement s'y mire. */
export const ROBES = [
  { cle: "origine", nom: "Origine", teinte: "#3fd6c0" },
  { cle: "nacre", nom: "Blanc nacré", teinte: "#f0f2f3" },
  { cle: "onyx", nom: "Noir onyx", teinte: "#0b0b0e" },
  { cle: "grenat", nom: "Rouge grenat", teinte: "#a51325" },
  { cle: "nuit", nom: "Bleu nuit", teinte: "#1c2c5e" },
  { cle: "mauve", nom: "Mauve crépuscule", teinte: "#6f5698" },
  { cle: "argent", nom: "Argent", teinte: "#b4b9bf" },
] as const

export default function Voiture({ robe = "origine" }: { robe?: string }) {
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

  /* la peinture : on garde l'original sous le coude, on pose une robe
     physique par-dessus quand un swatch est choisi */
  const peinture = useMemo(() => {
    const choix = ROBES.find((r) => r.cle === robe)
    if (!choix || choix.cle === "origine") return null
    /* anodisé poli : plus de satiné — miroir métallique, le ciel se
       découpe dans la robe (gate : « métallisé voire anodisé ») */
    return new THREE.MeshPhysicalMaterial({
      color: choix.teinte,
      metalness: 1.0,
      roughness: 0.03,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 3.5,
    })
  }, [robe])

  useEffect(() => {
    const originaux = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()
    modele.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (mats.some((m) => m?.name === "Paint")) {
        originaux.set(mesh, mesh.material)
        if (peinture) mesh.material = peinture
      }
    })
    return () => {
      originaux.forEach((mat, mesh) => {
        mesh.material = mat
      })
    }
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
