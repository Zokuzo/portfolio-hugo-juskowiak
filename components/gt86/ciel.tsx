"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useFrame, useLoader, useThree } from "@react-three/fiber"
import { Environment, Lightformer, useCursor, useGLTF } from "@react-three/drei"
import { RGBELoader } from "three-stdlib"
import * as THREE from "three"
import MerDeNuages from "./mer-de-nuages"

/* LE CIEL — ticket #29 : le verdict « Pellicule » du gate #21, porté du
   prototype (`app/prototype/ciel`, route jetable) dans la coquille.

   HDRI qwantani_dusk_2_puresky (Poly Haven, CC0, 1k) auto-hébergée — un
   crépuscule lavande au soleil bas, monté sur dôme et teinté chaud
   (multiply) : aucun puresky n'est rosé-orangé une fois tone-mappé, la
   teinte EST le concept. L'IBL reste la photo brute (reflets vrais).
   L'aura divine est SUPPRIMÉE au gate (l'additif `depthTest:false`
   découpait la carrosserie) — ne pas la réintroduire. */

/* Les chaînes de chargement sont importées par `scene.tsx` pour sa cascade :
   la clé du cache suspend-react est (constructeur, chaîne) — l'égalité par
   construction garantit que le préchargement sert le dôme et la voiture
   sans un octet de plus. */
export const VOITURE = "/prototype/gt86.glb"
export const CIEL_HDR = "/prototype/crepuscule.hdr"

/* le soleil de la pellicule — il sculpte les crêtes des nuages par le dessus */
const SOLEIL = new THREE.Vector3(0.25, 0.6, -1.0)
/* rotation du ciel : 0,25π retenu après balayage en captures (gate #21) */
const ROT = Math.PI * 0.25
/* LA robe — Argent anodisé poli, seul survivant du testeur de couleurs */
const ARGENT = "#b4b9bf"
/* la pose du gate : caméra au flanc, fov 38, la voiture au centre du cadre */
const POSE = new THREE.Vector3(-4.2, -0.4, 7.8)

/* La GT86 flottante. Le clic sur la carrosserie EST le démarrage — le
   raycast R3F reçoit le geste parce que l'overlay DOM est
   `pointerEvents:none` partout sauf sur ses boutons ; la consigne en bas
   d'écran fait la même chose au clavier. */
function Voiture({ surClic }: { surClic: () => void }) {
  const { scene } = useGLTF(VOITURE)
  const groupe = useRef<THREE.Group>(null)
  const [survol, setSurvol] = useState(false)
  useCursor(survol)

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

  /* la respiration — amplitude couplée au sommet du banc (-2,6) : le nez
     piqué descend à ~-2,1 au creux de la houle, plus bas le banc mange la
     carrosserie */
  useFrame((etat) => {
    if (!groupe.current) return
    const t = etat.clock.elapsedTime
    groupe.current.position.y = Math.sin(t * 0.55) * 0.16
    groupe.current.rotation.z = Math.sin(t * 0.32) * 0.022
    groupe.current.rotation.x = Math.sin(t * 0.45 + 1.3) * 0.014
  })

  return (
    /* extérieur : la respiration ; milieu : le cap ; intérieur : le piqué
       nez vers le bas de la photo de référence (verdict #21) */
    <group
      ref={groupe}
      onClick={surClic}
      onPointerOver={() => setSurvol(true)}
      onPointerOut={() => setSurvol(false)}
    >
      {/* cap : le −36° d'origine, −65° puis +10° au fil du gate */}
      <group rotation={[0, -Math.PI / 5 - (55 * Math.PI) / 180, 0]}>
        <group rotation={[1.0, 0, 0]}>
          <primitive object={modele} />
        </group>
      </group>
    </group>
  )
}

export default function Ciel({ visible, surClic }: { visible: boolean; surClic: () => void }) {
  const hdr = useLoader(RGBELoader, CIEL_HDR)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  /* la pose d'ouverture, tenue tant que le ciel est à l'écran — le vol
     d'atterrissage (#30) prendra la caméra ici */
  useEffect(() => {
    if (!visible) return
    camera.position.copy(POSE)
    camera.fov = 38
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, visible])

  return (
    <>
      {/* L'IBL vit HORS du groupe masquable et reste montée À VIE : au
          démontage, `<Environment>` de drei dispose la texture partagée que
          le cache suspend-react continuerait de servir — un remontage
          rendrait le dôme noir. Le sous-arbre ne se démonte donc jamais,
          seul `visible` bascule. Les Lightformer sont cuits dans la cubemap
          (résolution 512), ce ne sont pas des lumières de scène : le ciel
          brumeux n'a rien de net à mirer, ces lames découpent des éclats
          francs dans la robe et le verre. */}
      <Environment
        files={CIEL_HDR}
        environmentIntensity={0.6}
        environmentRotation={[0, ROT, 0]}
        resolution={512}
      >
        <Lightformer form="rect" intensity={12} color="#fff4e2" position={[0, 7, -3]} target={[0, 0, 0]} scale={[20, 2, 1]} />
        <Lightformer form="rect" intensity={8} color="#ffd9b0" position={[-7, 2, -7]} target={[0, 0, 0]} scale={[12, 1.5, 1]} />
        <Lightformer form="rect" intensity={4} color="#cdbce8" position={[7, -2.5, 6]} target={[0, 0, 0]} scale={[12, 1.2, 1]} />
      </Environment>

      <group visible={visible}>
        <mesh rotation-y={ROT} frustumCulled={false}>
          <sphereGeometry args={[350, 48, 32]} />
          <meshBasicMaterial
            map={hdr}
            color="#d8927a"
            side={THREE.BackSide}
            depthWrite={false}
            fog={false}
          />
        </mesh>
        <directionalLight position={[3, 7, -12]} intensity={1.4} color="#ffa05a" />
        <hemisphereLight args={["#e8b8d8", "#ff9a6b", 0.6]} />
        {/* débouche l'habitacle derrière le verre fumé */}
        <ambientLight intensity={0.55} color="#ffe2d2" />

        {/* réf. Porsche dans les cumulus : un banc épais et sculpté sous la
            voiture (-2,6 : sous l'ancien sommet -2, le banc mangeait la
            carrosserie au creux de la houle), des masses éparses au-dessus */}
        <MerDeNuages
          soleil={SOLEIL}
          crete="#ffe3c4"
          ombre="#c28f92"
          loin="#eba48e"
          sommet={-2.6}
          fond={-14}
          couverture={0.1}
          echelle={0.03}
        />
        <MerDeNuages
          sens="plafond"
          soleil={SOLEIL}
          crete="#fff0da"
          ombre="#d8a49c"
          loin="#eba48e"
          sommet={8}
          fond={20}
          couverture={0.5}
          echelle={0.045}
        />

        <Voiture surClic={surClic} />
      </group>
    </>
  )
}
