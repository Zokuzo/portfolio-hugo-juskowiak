"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { halo } from "./rue"

/* La vie nocturne de la city procédurale (verdict Hugo : « donner vie à la
   ville en gardant le réalisme »). Les lampadaires du décor s'allument :
   positions relevées en capture (les mâts du GLB sont fusionnés, aucun nom
   à cibler). Quatre spots RÉELS près de la mise en scène — la lumière
   accroche la voiture et le sol — et des lampes économes ailleurs (halo
   d'ampoule + flaque de lumière peinte), doctrine fluidité du #21. */

const TETE = 6.3 /* hauteur de tête des mâts, relevée en capture */

/* les mâts de la rue E-O (bord sud du trottoir nord, bras vers la route)
   et ceux du parvis — x/z du PIED, le bras déporte la tête vers la rue */
const LAMPES: { x: number; z: number; bras: number; vrai?: boolean }[] = [
  { x: 10.3, z: 4.6, bras: -1.1, vrai: true },
  { x: 16.8, z: 4.6, bras: -1.1, vrai: true },
  { x: 3.8, z: 4.6, bras: -1.1, vrai: true },
  { x: 0.3, z: 9.9, bras: 0, vrai: true },
  { x: -7.2, z: 9.9, bras: 0 },
  { x: -12.5, z: 4.6, bras: -1.1 },
  { x: 23.2, z: 4.6, bras: -1.1 },
]

function Lampe({ x, z, bras, vrai }: { x: number; z: number; bras: number; vrai?: boolean }) {
  const cible = useMemo(() => new THREE.Object3D(), [])
  const tete: [number, number, number] = [x, TETE, z + bras]
  return (
    <group>
      {/* l'ampoule : cœur chaud + voile, quel que soit le rang */}
      <sprite position={tete} scale={[1.1, 1.1, 1]}>
        <spriteMaterial map={halo()} color="#ffe6bb" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite position={tete} scale={[3.2, 3.2, 1]}>
        <spriteMaterial map={halo()} color="#ffca7a" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      {vrai ? (
        <>
          <primitive object={cible} position={[x, 0, z + bras]} />
          <spotLight
            position={tete}
            target={cible}
            color="#ffd9a2"
            intensity={45}
            angle={0.8}
            penumbra={0.9}
            decay={1.7}
            distance={22}
          />
        </>
      ) : (
        /* rang économe : la flaque de lumière est peinte au sol */
        <mesh position={[x, 0.02, z + bras]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[3.4, 24]} />
          <meshBasicMaterial map={halo()} color="#8a6a3e" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

export default function VieNocturne() {
  return (
    <group>
      {LAMPES.map((l, i) => (
        <Lampe key={i} {...l} />
      ))}
    </group>
  )
}
