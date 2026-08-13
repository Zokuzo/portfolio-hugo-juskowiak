"use client"

import { useMemo } from "react"
import { MeshReflectorMaterial } from "@react-three/drei"
import * as THREE from "three"

/* Le décor « construit minimal » du ticket #22 : la nuit avale les détails,
   alors on ne modélise que ce qu'elle laisse voir — silhouettes de boîtes,
   fenêtres allumées, enseignes émissives, lampadaires. Zéro asset externe :
   tout le budget poids reste à la voiture. */

/* pseudo-aléa déterministe : la rue est identique à chaque chargement */
function graine(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* un sprite sans map est un CARRÉ — tous les halos partagent ce dégradé
   radial peint une seule fois (module client, jamais exécuté côté serveur) */
let haloPartage: THREE.CanvasTexture | null = null
function halo() {
  if (!haloPartage) {
    const c = document.createElement("canvas")
    c.width = c.height = 128
    const ctx = c.getContext("2d")!
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, "rgba(255,255,255,1)")
    g.addColorStop(0.4, "rgba(255,255,255,0.32)")
    g.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    haloPartage = new THREE.CanvasTexture(c)
  }
  return haloPartage
}

const NEONS = ["#ff4f9a", "#35d6ff", "#ffb400", "#7cffb2"]

function Immeuble({ x, z, l, p, h, cote }: { x: number; z: number; l: number; p: number; h: number; cote: 1 | -1 }) {
  /* la longueur l court le long de la rue (Z), la profondeur p s'enfonce
     derrière la façade (X) ; fenêtres chaudes côté rue, jamais alignées */
  const fenetres = useMemo(() => {
    const liste: { fz: number; fy: number }[] = []
    const s = x * 3.7 + z * 1.3
    for (let i = 0; i < 14; i++) {
      if (graine(s + i) > 0.35) continue
      liste.push({
        fz: (graine(s + i + 50) - 0.5) * (l - 0.8),
        fy: 1.2 + graine(s + i + 90) * (h - 2),
      })
    }
    return liste
  }, [x, z, l, h])
  return (
    <group position={[x, 0, z]}>
      <mesh position={[cote * (p / 2), h / 2, 0]}>
        <boxGeometry args={[p, h, l]} />
        <meshStandardMaterial color="#12101a" roughness={0.9} metalness={0} />
      </mesh>
      {fenetres.map((f, i) => (
        <mesh key={i} position={[-cote * 0.01, f.fy, f.fz]} rotation-y={cote > 0 ? -Math.PI / 2 : Math.PI / 2}>
          <planeGeometry args={[0.5, 0.7]} />
          <meshBasicMaterial color="#ffb46b" />
        </mesh>
      ))}
    </group>
  )
}

function Enseigne({ x, z, y, teinte, cote, haute }: { x: number; z: number; y: number; teinte: string; cote: 1 | -1; haute?: boolean }) {
  /* enseigne verticale à la japonaise : caisson sombre, face émissive
     tournée vers la rue (local +z → la chaussée après rotation) */
  const [l, h] = haute ? [0.55, 2.6] : [1.6, 0.6]
  return (
    <group position={[x, y, z]} rotation-y={cote > 0 ? -Math.PI / 2 : Math.PI / 2}>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[l + 0.12, h + 0.12, 0.12]} />
        <meshStandardMaterial color="#0a0910" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[l, h]} />
        <meshStandardMaterial color="#000" emissive={teinte} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {/* halo humide : un voile additif double l'enseigne, l'air a plu */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[l * 2.6, h * 2.6]} />
        <meshBasicMaterial
          map={halo()}
          color={teinte}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function Lampadaire({ x, z, cote }: { x: number; z: number; cote: 1 | -1 }) {
  /* la cible du spot doit vivre dans le graphe, sinon three la laisse à
     l'origine et tous les lampadaires visent le centre de la scène */
  const cible = useMemo(() => new THREE.Object3D(), [])
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 4.2, 8]} />
        <meshStandardMaterial color="#1a1822" roughness={0.6} metalness={0.6} />
      </mesh>
      {/* la crosse penche au-dessus de la chaussée */}
      <mesh position={[-cote * 0.55, 4.25, 0]} rotation-z={cote * 1.25}>
        <cylinderGeometry args={[0.04, 0.05, 1.3, 8]} />
        <meshStandardMaterial color="#1a1822" roughness={0.6} metalness={0.6} />
      </mesh>
      <mesh position={[-cote * 1.05, 4.32, 0]}>
        <sphereGeometry args={[0.14, 12, 8]} />
        <meshStandardMaterial color="#000" emissive="#ffd9a0" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      {/* halo humide autour de l'ampoule */}
      <sprite position={[-cote * 1.05, 4.32, 0]} scale={[1.4, 1.4, 1]}>
        <spriteMaterial
          map={halo()}
          color="#ffd9a0"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      {/* le cône penche vers le milieu de la chaussée : la flaque de
          lumière atteint la voiture, pas seulement le trottoir */}
      <primitive object={cible} position={[-cote * 2.5, 0, 0]} />
      <spotLight
        position={[-cote * 1.05, 4.3, 0]}
        target={cible}
        color="#ffc98a"
        intensity={60}
        angle={0.75}
        penumbra={0.9}
        decay={1.6}
      />
    </group>
  )
}

export default function Rue() {
  /* deux rangées de silhouettes ; la graine fige la skyline */
  const immeubles = useMemo(() => {
    const liste: { x: number; z: number; l: number; p: number; h: number; cote: 1 | -1 }[] = []
    for (const cote of [1, -1] as const) {
      let z = -46
      let i = 0
      while (z < 24) {
        const l = 5 + graine(cote * 10 + i) * 4
        liste.push({
          /* x = la ligne de façade, l'immeuble s'enfonce derrière elle */
          x: cote * (6.5 + graine(cote * 20 + i) * 0.9),
          z: z + l / 2,
          l,
          p: 6 + graine(cote * 30 + i) * 4,
          h: 5.5 + graine(cote * 40 + i) * 8,
          cote,
        })
        z += l + 0.4
        i++
      }
    }
    return liste
  }, [])

  return (
    <group>
      {/* l'asphalte mouillé : le miroir flou de drei — la pluie vient de
          finir, la rue rend les néons et les phares */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[13, 90]} />
        {/* recette vérifiée en source (recherche #22) : la réflexion est
            MULTIPLIÉE par la couleur — noir pur = miroir mort ; gris
            sombre + mixStrength haut, 512² ≈ 6 % des pixels d'une frame */}
        <MeshReflectorMaterial
          blur={[250, 80]}
          resolution={512}
          mixBlur={0.7}
          mixStrength={8}
          roughness={0.4}
          depthScale={0}
          color="#202024"
          metalness={0.4}
          mirror={0.8}
        />
      </mesh>
      {/* trottoirs : mats — seule la chaussée a bu la pluie */}
      {([1, -1] as const).map((cote) => (
        <mesh key={cote} position={[cote * 5.75, 0.07, -10]}>
          <boxGeometry args={[1.5, 0.14, 90]} />
          <meshStandardMaterial color="#16141c" roughness={0.95} />
        </mesh>
      ))}
      {immeubles.map((b, i) => (
        <Immeuble key={i} {...b} />
      ))}
      {/* néons discrets : quatre enseignes, pas une avenue de Shibuya */}
      <Enseigne x={6.35} z={-6} y={2.6} teinte={NEONS[0]} cote={1} haute />
      <Enseigne x={-6.3} z={-14} y={3.1} teinte={NEONS[1]} cote={-1} />
      <Enseigne x={6.3} z={-24} y={2.2} teinte={NEONS[2]} cote={1} />
      <Enseigne x={-6.35} z={4} y={2.4} teinte={NEONS[3]} cote={-1} haute />
      <Lampadaire x={5.6} z={-2} cote={1} />
      <Lampadaire x={-5.6} z={-8} cote={-1} />
      <Lampadaire x={5.6} z={-20} cote={1} />
      <Lampadaire x={-5.6} z={-34} cote={-1} />
      {/* la lueur du carrefour au bout de la rue : la ville continue
          derrière le brouillard */}
      <sprite position={[0, 5, -58]} scale={[46, 18, 1]}>
        <spriteMaterial
          map={halo()}
          color="#ff8c5a"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </sprite>
    </group>
  )
}
