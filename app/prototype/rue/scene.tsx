"use client"

import { Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { Environment, Lightformer, Loader, OrbitControls, SpotLight as SpotVolumetrique } from "@react-three/drei"
import * as THREE from "three"
import Rue, { halo } from "./rue"
import DecorGlb from "./decor-glb"
import VoitureRue from "./voiture-rue"

/* La scène du prototype #22, quatre décors au banc d'essai (gate œil Hugo) :
   ?variant=a  la rue construite minimale (défaut)
   ?variant=b  « city » — boulevard détrempé (CC-BY, 4,3 Mo optimisé)
   ?variant=c  « city scene tokyo » (choix Hugo, 6,1 Mo)
   ?variant=d  « hong kong night street » (CC-BY, nuit cuite, 7,5 Mo)
   Boutons de réglage : ?cam=x,y,z — dpr ≤ 1,5, doctrine fluidité du #21. */

type Variante = {
  fichier?: string
  echelle?: number
  decorPosition?: [number, number, number]
  decorRotationY?: number
  /* la pose de la voiture et son cap — les phares s'y ancrent */
  pose: [number, number, number]
  cap: number
  cam: [number, number, number]
  cible: [number, number, number]
  brume: [string, number, number]
  /* les décors à nuit cuite dans les textures ont besoin d'une ambiante
     franche, nos lampes seules les laissent noirs */
  ambiance?: number
}

const VARIANTES: Record<string, Variante> = {
  a: {
    pose: [0.8, 0, -3],
    cap: -Math.PI * 0.38,
    cam: [4.2, 2.0, 6.5],
    cible: [0, 0.8, -3],
    brume: ["#0d0b16", 16, 70],
  },
  b: {
    fichier: "/prototype/decor-ville.glb",
    /* le diorama aérien passe à l'échelle voiture : ×20 — ses rues entre
       les tours deviennent praticables, ses textures s'assument de loin */
    echelle: 20,
    decorPosition: [6, -1, 32],
    /* sonde de sol : la rue est la bande y=0,2 inclinée d'~19° */
    pose: [0, 0.2, 0],
    cap: 0.34,
    cam: [-2.5, 2.4, -7],
    cible: [0, 1.2, 0.5],
    brume: ["#0d0b16", 22, 170],
    ambiance: 0.4,
  },
  c: {
    /* le coin de canal : la voiture longe le quai, caméra depuis l'autre
       rive — le pied du pont reste dans le cadre sans l'écraser */
    fichier: "/prototype/decor-tokyo.glb",
    /* verdict Hugo : le décor est sous-dimensionné (jardinières à 2,7 m,
       pick-up de 2,5 m) — on l'agrandit ×1,6, la voiture garde sa taille
       réelle ; elle vit sur la terrasse de l'autre rive */
    echelle: 1.6,
    /* sonde de sol : la route est le plateau y=3,9 le long de X (z -3..-8),
       van garé vers z=-3 — la bande z=-5,5 est propre */
    /* correction : le plateau z<-5 était la VOIE FERRÉE — la route est la
       bande z -1,5..-4 où le van est garé ; la GT86 se range derrière lui */
    pose: [7, 3.72, -2.6],
    cap: -Math.PI / 2,
    cam: [1.6, 6.0, 3.6],
    cible: [9, 4.2, -3],
    brume: ["#0d0b16", 18, 80],
  },
  d: {
    fichier: "/prototype/decor-hongkong.glb",
    /* le GLB est en centimètres (bbox 4679×3820) : ÷100 puis recentrage
       de la scène autour de l'origine */
    /* ÷100 sous-évaluait : barrières à mi-portière, banc nain — le
       mobilier réel impose ~×1,6 de plus */
    echelle: 0.016,
    decorPosition: [-13.1, 0, -6.5],
    /* la rue du décor court sur X : cap -90° — la voiture file dans le
       canyon de néons, caméra trois-quarts arrière ; y -0,18 : la chaussée
       du scan est légèrement sous le zéro, sinon la voiture lévite */
    /* sonde large ×1,6 : le corridor routier court sur X entre z=0 et 9
       (façades z≤-9 et z≥15) — voie proche centrée z≈2,2 */
    pose: [-4, -0.28, 2.2],
    cap: -Math.PI / 2,
    cam: [3.5, 2.4, 6.5],
    cible: [-4, 0.8, 2.2],
    brume: ["#0d0b16", 20, 90],
    ambiance: 0.9,
  },
}

function Phares({ pose, cap }: { pose: [number, number, number]; cap: number }) {
  /* les feux de croisement mordent l'asphalte : deux spots volumétriques
     ancrés à la pose de la voiture */
  const { origine, gauche } = useMemo(() => {
    const avant = new THREE.Vector3(Math.sin(cap), 0, Math.cos(cap))
    const origine = new THREE.Vector3(...pose).add(new THREE.Vector3(0, 0.68, 0)).addScaledVector(avant, 1.9)
    const gauche = new THREE.Vector3(-avant.z, 0, avant.x)
    return { avant, origine, gauche }
  }, [pose, cap])
  return (
    <group>
      {([1, -1] as const).map((c) => (
        <Phare key={c} cote={c} cap={cap} origine={origine} gauche={gauche} />
      ))}
    </group>
  )
}

function Phare({ cote, cap, origine, gauche }: { cote: 1 | -1; cap: number; origine: THREE.Vector3; gauche: THREE.Vector3 }) {
  /* la cible du spot doit vivre dans le graphe, sinon three la laisse à
     l'origine du monde */
  const cible = useMemo(() => new THREE.Object3D(), [])
  const { p, vise } = useMemo(() => {
    const avant = new THREE.Vector3(Math.sin(cap), 0, Math.cos(cap))
    const p = origine.clone().addScaledVector(gauche, cote * 0.62)
    const vise = p.clone().addScaledVector(avant, 9).setY(0)
    return { p, vise }
  }, [cote, cap, origine, gauche])
  return (
    <group>
      <primitive object={cible} position={vise.toArray()} />
      {/* le faisceau volumétrique de drei : falloff doux (anglePower),
          fondu en profondeur (attenuation) */}
      <SpotVolumetrique
        position={p.toArray()}
        target={cible}
        color="#ffeecb"
        intensity={380}
        angle={0.5}
        penumbra={0.6}
        decay={1.8}
        distance={40}
        attenuation={9}
        anglePower={5}
        radiusTop={0.14}
      />
      {/* l'optique brille : cœur vif serré + éblouissement large et doux */}
      <sprite position={p.toArray()} scale={[0.55, 0.55, 1]}>
        <spriteMaterial map={halo()} color="#fffaf0" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite position={p.toArray()} scale={[2.2, 2.2, 1]}>
        <spriteMaterial map={halo()} color="#ffeecb" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  )
}

export default function Scene() {
  const params = useSearchParams()
  const v = VARIANTES[params.get("variant") ?? "a"] ?? VARIANTES.a
  const brut = params.get("cam")?.split(",").map(Number)
  const cam: [number, number, number] =
    brut && brut.length === 3 && brut.every(Number.isFinite) ? (brut as [number, number, number]) : v.cam

  return (
    <div style={{ position: "fixed", inset: 0, background: v.brume[0] }}>
      <Canvas
        camera={{ position: cam, fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance" }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(v.brume[0])
          scene.fog = new THREE.Fog(v.brume[0], v.brume[1], v.brume[2])
        }}
      >
        <Suspense fallback={null}>
          {/* l'environnement de nuit : pas de HDRI — trois lueurs urbaines
              construites, juste de quoi faire vivre le métal de la robe */}
          {/* leçon du débogage livrée : la robe est un MIROIR — tout
              rectangle saturé de l'environnement se lit en aplat sur la
              carrosserie. Nuit neutre : bande chaude des lampadaires au
              zénith, fills froids discrets, zéro couleur franche */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={0.9} color="#ffb46b" position={[0, 8, 0]} scale={[30, 4, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.35} color="#9aa4c8" position={[8, 2, -6]} scale={[8, 3, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.3} color="#6b7490" position={[-8, 2, -12]} scale={[8, 3, 1]} target={[0, 0, 0]} />
          </Environment>
          <hemisphereLight args={["#2a2440", "#0c0a10", 0.35]} />
          <ambientLight intensity={0.06 + (v.ambiance ?? 0)} color={v.ambiance ? "#cdb8a8" : "#c8d4ff"} />
          {v.fichier ? (
            <DecorGlb
              fichier={v.fichier}
              echelle={v.echelle}
              position={v.decorPosition}
              rotationY={v.decorRotationY}
              sonde={v.pose}
            />
          ) : (
            <Rue />
          )}
          <VoitureRue position={v.pose} rotationY={v.cap} />
          <Phares pose={v.pose} cap={v.cap} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableDamping
          minDistance={3.5}
          maxDistance={v.fichier ? 60 : 20}
          maxPolarAngle={Math.PI * 0.49}
          target={v.cible}
        />
      </Canvas>
      <Loader />
    </div>
  )
}
