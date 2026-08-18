"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { halo } from "./rue"

/* La vie nocturne de la city procédurale — v3, tout ancré à la GÉOMÉTRIE
   (analyse-ville2.mjs : clustering des sommets du GLB brut).
   - ~20 luminaires réels sur deux gammes de mâts : têtes hautes (10,1 m,
     bras longs) et courtes (7,9 m). Spots réels près de la mise en scène,
     halo + flaque peinte au-delà (doctrine fluidité #21).
   - le boîtier de feux du carrefour mesure 0,8×0,8 m entre y 2,6 et 3,9 :
     les lentilles vivent DANS ce volume, une pile par face.
   - les tours n'ont aucun matériau « vitre » (fenêtres cuites dans les
     textures) : les bâtiments s'habitent par des quads-fenêtres chauds
     générés sur des grilles de façades, épars et déterministes. */

const REDUIT =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* brouillon partagé du recul des halos — zéro allocation par frame */
const direction = new THREE.Vector3()

function graine(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* [x, z, y de la tête, vrai spot ?] — positions des luminaires analysées */
const LAMPES: [number, number, number, boolean?][] = [
  /* rue N-S : rangée ouest (hautes) et est (courtes) */
  [-4.8, -15.5, 10.1, true], [-4.8, -30.0, 10.1, true], [-4.8, -44.5, 10.1],
  [5.7, -15.5, 7.9, true], [5.7, -30.0, 7.9], [5.7, -44.5, 7.9],
  /* rue E-O : rangée nord (hautes) et sud */
  [8.0, 1.0, 10.1, true], [20.2, 1.0, 10.1], [32.3, 1.0, 10.1], [44.5, 1.0, 10.1],
  [-8.0, 1.0, 10.1], [-20.2, 1.0, 10.1], [-32.3, 1.0, 10.1], [-44.5, 1.0, 10.1],
  [15.5, -2.0, 7.9, true], [26.4, -2.0, 7.9], [37.3, -2.0, 7.9], [48.2, -2.0, 7.9],
  [-15.5, -4.8, 10.1], [-30.0, -4.8, 10.1], [-44.5, -4.8, 10.1],
  /* mâts d'angle des carrefours */
  [-2.0, 4.7, 9.8], [0.0, 6.8, 9.4],
  [57.0, -5.8, 9.8], [54.1, -5.9, 9.4], [63.0, 5.8, 9.8], [65.9, 5.9, 9.4],
  [50.4, 3.0, 9.8], [50.4, 5.9, 9.4],
  /* boulevards périphériques (Hugo les a vus éteints en orbite) */
  [61.0, 44.5, 10.1], [61.0, 33.6, 10.1], [61.0, 22.7, 10.1], [61.0, 11.7, 10.1],
  [-61.0, 48.3, 10.1], [-61.0, 36.1, 10.1], [-61.0, 23.9, 10.1], [-61.0, 11.8, 10.1],
  [48.3, 61.0, 10.1], [36.1, 61.0, 10.1], [23.9, 61.0, 10.1], [11.8, 61.0, 10.1],
  [20.2, 55.2, 10.1], [32.3, 55.2, 10.1], [44.5, 55.2, 10.1],
  [-8.0, 55.2, 10.1], [-20.2, 55.2, 10.1], [-32.3, 55.2, 10.1], [-44.5, 55.2, 10.1], [8.0, 55.2, 10.1],
  [-15.5, -55.2, 10.1], [-30.0, -55.2, 10.1], [-44.5, -55.2, 10.1],
  [-59.0, -44.5, 10.1], [-59.0, -30.0, 10.1], [-59.0, -15.5, 10.1],
  [-15.5, -61.0, 10.1], [-30.0, -61.0, 10.1], [-44.5, -61.0, 10.1],
  [-55.2, 15.5, 10.1], [-55.2, 30.0, 10.1], [-55.2, 44.5, 10.1],
  [55.2, 15.5, 10.1], [55.2, 30.0, 10.1], [55.2, 44.5, 10.1],
  [15.5, -64.8, 10.1], [30.0, -64.8, 10.1], [44.5, -64.8, 10.1],
  [-61.0, -11.7, 10.1], [-61.0, -23.9, 10.1], [-61.0, -36.1, 10.1], [-61.0, -48.2, 10.1],
  [58.0, -48.2, 7.9], [58.0, -36.1, 7.9], [58.0, -23.9, 7.9], [58.0, -11.8, 7.9],
  [15.5, -58.0, 7.9], [26.4, -58.0, 7.9], [37.3, -58.0, 7.9], [48.2, -58.0, 7.9],
  [65.7, -44.5, 7.9], [65.7, -30.0, 7.9], [65.7, -15.5, 7.9],
  [-15.5, 65.7, 7.9], [-30.0, 65.7, 7.9], [-44.5, 65.7, 7.9],
  [65.8, -66.7, 9.8], [-65.8, -57.0, 9.8], [-63.0, -69.6, 9.8], [-50.4, -63.0, 9.8],
  [-65.8, 63.0, 9.8], [65.8, 53.3, 9.8], [-5.8, 66.7, 9.8], [66.7, -54.2, 9.8],
]

function Lampe({ x, z, y, vrai }: { x: number; z: number; y: number; vrai?: boolean }) {
  const cible = useMemo(() => new THREE.Object3D(), [])
  const halos = useRef<THREE.Group>(null)
  /* le sprite posé AU centre de la tête se fait avaler par sa géométrie
     (depth test — vérifié en capture : depthTest off le révélait mais
     faisait luire les lampes à travers les murs). On le tire de 0,9 m
     vers la caméra : hors du boîtier sous tous les angles, occlusion par
     les bâtiments intacte. */
  useFrame(({ camera }) => {
    if (!halos.current) return
    const tete = halos.current.position.set(x, y, z)
    tete.add(direction.copy(camera.position).sub(tete).normalize().multiplyScalar(0.9))
  })
  return (
    <group>
      <group ref={halos} position={[x, y, z]}>
        <sprite scale={[1.15, 1.15, 1]}>
          <spriteMaterial map={halo()} color="#ffe6bb" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
        <sprite scale={[3.4, 3.4, 1]}>
          {/* dosé pour la scène assombrie — à 0,14 les boules de lumière
            mangeaient l'avenue */}
        <spriteMaterial map={halo()} color="#ffca7a" transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
      </group>
      {vrai ? (
        <>
          <primitive object={cible} position={[x, 0, z]} />
          <spotLight position={[x, y, z]} target={cible} color="#ffd9a2" intensity={110} angle={0.62} penumbra={0.9} decay={1.7} distance={30} />
        </>
      ) : (
        <mesh position={[x, 0.02, z]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[4.2, 24]} />
          {/* flaque discrète : à 0,5 les 85 flaques repeignaient les
              trottoirs en plein jour */}
          <meshBasicMaterial map={halo()} color="#7d6039" transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/* ---- les feux tricolores ------------------------------------------- */
/* boîtier analysé : x∈[9,46;10,24] z∈[-6,04;-5,23] y∈[2,64;3,93] —
   une pile de lentilles par face, DANS le volume */
const CYCLE = 17
const TEINTES = ["#ff3b30", "#ffab2e", "#3bd06b"] as const

function TeteDeFeu({ pos, phase }: { pos: [number, number, number]; phase: number }) {
  const refs = useRef<(THREE.SpriteMaterial | null)[]>([])
  useFrame((etat) => {
    /* figé à t=0 sous reduce : phase 0 verte, phase 1 rouge — jamais deux
       verts croisés */
    const t = REDUIT ? 0 : etat.clock.elapsedTime
    const local = (t + phase * (CYCLE / 2)) % CYCLE
    const etatFeu = local < 7 ? 2 : local < 8.5 ? 1 : 0
    refs.current.forEach((m, i) => {
      if (m) m.opacity = i === etatFeu ? 0.95 : 0.05
    })
  })
  return (
    <group position={pos}>
      {TEINTES.map((c, i) => (
        <sprite key={c} position={[0, 0.37 - i * 0.37, 0]} scale={[0.26, 0.26, 1]}>
          <spriteMaterial
            ref={(m) => { refs.current[i] = m }}
            map={halo()}
            color={c}
            transparent
            opacity={0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

export default function VieNocturne() {
  return (
    <group>
      {LAMPES.map(([x, z, y, vrai], i) => (
        <Lampe key={i} x={x} z={z} y={y} vrai={vrai} />
      ))}
      {/* tête face ouest (dans le boîtier, côté x-) et tête face nord
          (côté z+), en opposition de phase */}
      <TeteDeFeu pos={[9.42, 3.35, -5.63]} phase={0} />
      <TeteDeFeu pos={[9.9, 3.35, -5.19]} phase={1} />
    </group>
  )
}
