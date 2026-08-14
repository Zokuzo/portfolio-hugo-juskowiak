"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { halo } from "./rue"

/* même garde reduce que le reste du prototype (spec #25) */
const REDUIT =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* La vie nocturne de la city procédurale — v2, ancrée à la GÉOMÉTRIE.
   Les positions ne sont plus relevées à l'œil : un analyseur du GLB brut
   (scratchpad/analyse-ville.mjs) a clusterisé les sommets Street_Assets
   par bandes de hauteur. Les mâts sont à z≈-3,1 (rue E-O) et x≈6,9 (rue
   N-S), têtes à ~7,3 m ; le boîtier de feux du carrefour est à (9,8, -5,7),
   lentilles vers 3,4 m. Doctrine fluidité : spots réels près de la mise en
   scène, halo + flaque peinte au-delà. */

const TETE = 7.3

/* [x du pied, z du pied, x tête, z tête] — le bras déporte la tête vers la
   chaussée ; `vrai` = SpotLight réel */
const LAMPES: { pied: [number, number]; tete: [number, number]; vrai?: boolean }[] = [
  /* rue E-O (chaussée z -4..4), mâts côté sud */
  { pied: [15.5, -3.1], tete: [15.5, -2.2], vrai: true },
  { pied: [26.4, -3.1], tete: [26.4, -2.2] },
  { pied: [37.3, -3.1], tete: [37.3, -2.2] },
  { pied: [48.2, -3.1], tete: [48.2, -2.2] },
  /* rue N-S (chaussée x -6..6), mâts côté est */
  { pied: [6.9, -15.5], tete: [5.9, -15.5], vrai: true },
  { pied: [6.9, -30.0], tete: [5.9, -30.0], vrai: true },
  { pied: [6.9, -44.5], tete: [5.9, -44.5] },
]

function Lampe({ pied, tete, vrai }: { pied: [number, number]; tete: [number, number]; vrai?: boolean }) {
  const cible = useMemo(() => new THREE.Object3D(), [])
  const pos: [number, number, number] = [tete[0], TETE, tete[1]]
  return (
    <group>
      <sprite position={pos} scale={[1.2, 1.2, 1]}>
        <spriteMaterial map={halo()} color="#ffe6bb" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite position={pos} scale={[3.6, 3.6, 1]}>
        <spriteMaterial map={halo()} color="#ffca7a" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      {vrai ? (
        <>
          <primitive object={cible} position={[tete[0], 0, tete[1]]} />
          <spotLight position={pos} target={cible} color="#ffd9a2" intensity={70} angle={0.75} penumbra={0.9} decay={1.7} distance={26} />
        </>
      ) : (
        <mesh position={[tete[0], 0.02, tete[1]]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[3.8, 24]} />
          <meshBasicMaterial map={halo()} color="#8a6a3e" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/* Le carrefour respire : le boîtier analysé à (9,8, -5,7) porte deux têtes
   de feux — une pour chaque rue. Cycle réaliste vert 7 s / orange 1,5 s /
   rouge 8,5 s, les deux axes en opposition de phase. Sous reduce, l'axe
   N-S reste au vert, l'autre au rouge. */
/* boîtiers analysés : notre carrefour + les deux voisins au bout des rues */
const FEUX_TOUS = [
  { x: 9.8, z: -5.7 },
  { x: -50.5, z: 6.1 },
  { x: 9.5, z: -53.9 },
]
const FEUX = { x: 9.8, z: -5.7, y: 3.4 }
const CYCLE = 17
const COULEURS = { rouge: "#ff3b30", orange: "#ffab2e", vert: "#3bd06b" }

function TeteDeFeu({ face, phase }: { face: [number, number, number]; phase: number }) {
  /* trois lentilles empilées, une seule vit à la fois */
  const refs = useRef<(THREE.SpriteMaterial | null)[]>([])
  useFrame((etat) => {
    /* sous reduce le temps se fige à 0 : phase 0 au vert, phase 1 au
       rouge — jamais deux verts croisés */
    const t = REDUIT ? 0 : etat.clock.elapsedTime
    const local = (t + phase * (CYCLE / 2)) % CYCLE
    /* 0-7 vert, 7-8,5 orange, 8,5-17 rouge */
    const etatFeu = local < 7 ? 2 : local < 8.5 ? 1 : 0
    refs.current.forEach((m, i) => {
      if (m) m.opacity = i === etatFeu ? 0.95 : 0.06
    })
  })
  const teintes = [COULEURS.rouge, COULEURS.orange, COULEURS.vert]
  return (
    <group position={face}>
      {teintes.map((c, i) => (
        <sprite key={c} position={[0, 0.42 - i * 0.42, 0]} scale={[0.34, 0.34, 1]}>
          <spriteMaterial
            ref={(m) => { refs.current[i] = m }}
            map={halo()}
            color={c}
            transparent
            opacity={0.06}
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
      {LAMPES.map((l, i) => (
        <Lampe key={i} {...l} />
      ))}
      {/* chaque boîtier porte deux têtes — rue E-O et rue N-S — en
          opposition de phase, notre carrefour comme les voisins */}
      {FEUX_TOUS.map((f) => (
        <group key={`${f.x},${f.z}`}>
          <TeteDeFeu face={[f.x - 0.45, FEUX.y, f.z]} phase={0} />
          <TeteDeFeu face={[f.x, FEUX.y, f.z + 0.45]} phase={1} />
        </group>
      ))}
    </group>
  )
}
