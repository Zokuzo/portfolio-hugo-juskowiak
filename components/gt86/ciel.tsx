"use client"

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react"
import { useFrame, useLoader, useThree } from "@react-three/fiber"
import { Environment, Lightformer, useCursor, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import MerDeNuages from "./mer-de-nuages"
import { useChauffeEnSolo } from "./chauffe"
import type { Trajectoire } from "./vol"
import { LamesDuCiel, cliquableParSaBoite, mireLeCiel, pieceDeRobe, robeDuCiel } from "./carrosserie"
import { poseAkrapovic } from "./echappement"
import { LueursDuCiel } from "./lueurs"

/* LE CIEL — ticket #29 : le verdict « Pellicule » du gate #21, porté du
   prototype (route jetable, supprimée au #35) dans la coquille.

   HDRI qwantani_dusk_2_puresky (Poly Haven, CC0, 1k) auto-hébergée — un
   crépuscule lavande au soleil bas, monté sur dôme (en 4k depuis les #46
   et #59, voir CIEL_4K) et teinté chaud
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

/* LE FOND 4K (#46, #59). Même HDRI que CIEL_HDR (Poly Haven
   qwantani_dusk_2_puresky, CC0 : le fichier 1k du dépôt a le md5 exact
   de leur crepuscule 1k), mais tiré de leur HDR 4k et non de leur JPG
   tonemappé : ce JPG porte déjà une courbe, l'AgX du composer (rendu.tsx)
   l'aurait écrasée une seconde fois. On encode donc la radiance LINÉAIRE
   divisée par ECHELLE_4K (le maximum de la HDR 4k vaut 10,56 : rien
   n'est écrêté), en sRVB 8 bits tramé, puis AVIF 4096 × 2048 (33 Ko : un
   pur ciel est un dégradé). Le matériau remultiplie par ECHELLE_4K : le
   dôme rend la même radiance que la HDR, seulement plus nette. Même
   sphère, même rotation, mêmes UV équirectangulaires : orientation
   identique. L'IBL garde la HDR 1k, l'éclairage ne bouge pas. */
export const CIEL_4K = "/prototype/ciel-4k.avif"
const ECHELLE_4K = 11
const TEINTE_DOME = new THREE.Color("#d8927a").multiplyScalar(ECHELLE_4K)

/* le soleil de la pellicule — il sculpte les crêtes des nuages par le dessus */
const SOLEIL = new THREE.Vector3(0.25, 0.6, -1.0)
/* rotation du ciel : 0,25π retenu après balayage en captures (gate #21) */
const ROT = Math.PI * 0.25
/* LA robe : chrome miroir (#53, carrosserie.tsx), jantes comprises.
   L'histoire du piège du #21 : le miroir pur des premiers gates
   reflétait surtout le dessous SOMBRE du banc et rendait noire, puis une
   robe argent brossée (metalness 0,6, la diffuse portant l'argent sous
   les lumières directes) restait charbon. La mer de nuages LUMINEUSE que
   l'œil voit n'existe pas dans la sonde d'éclairage. Le chrome tient
   aujourd'hui parce qu'il mire SON environnement : les LamesDuCiel cuites
   dans la cubemap, et une PMREM tirée en propre (voir mireLeCiel). */
/* la pose du gate : caméra au flanc, fov 38, la voiture au centre du cadre */
export const POSE = new THREE.Vector3(-4.2, -0.4, 7.8)
export const FOV_POSE = 38

/* la profondeur de la plongée (#30) : bien sous le sommet du banc (-2,6),
   la voiture disparaît dans les nuages avant la bascule vers la rue */
const PLONGEE = 9

/* le piqué nez vers le bas de la photo de référence (verdict #21), et le
   cap de la voiture : le -36° d'origine, -65° puis +10° au fil du gate.
   La nouvelle chute (#56) en part et compose ses assiettes dessus */
export const PIQUE = 1.0
export const CAP = -Math.PI / 5 - (55 * Math.PI) / 180

/* La GT86 flottante. Le clic sur la carrosserie EST le démarrage — le
   raycast R3F reçoit le geste parce que l'overlay DOM est
   `pointerEvents:none` partout sauf sur ses boutons ; la consigne en bas
   d'écran fait la même chose au clavier. */
/* la carrosserie du ciel, lue par la caméra de la nouvelle chute (#56)
   pour viser ses phares, son aileron, ses jantes */
export const voitureDuCiel: { modele: THREE.Object3D | null } = { modele: null }

function Voiture({ surClic, vol }: { surClic: () => void; vol: MutableRefObject<Trajectoire> }) {
  const { scene } = useGLTF(VOITURE)
  const groupe = useRef<THREE.Group>(null)
  const pique = useRef<THREE.Group>(null)
  const scene3 = useThree((s) => s.scene)
  const gl3 = useThree((s) => s.gl)
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
    poseAkrapovic(scene)
    const centre = new THREE.Box3().setFromObject(scene).getCenter(new THREE.Vector3())
    scene.position.sub(centre)
    return scene
  }, [scene])

  /* la cible du clic (carrosserie.tsx) : la boîte de la voiture centrée,
     dans le repère du piqué */
  useMemo(() => {
    const taille = new THREE.Box3().setFromObject(modele).getSize(new THREE.Vector3())
    cliquableParSaBoite(modele, new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), taille))
  }, [modele])

  /* la robe (carrosserie.tsx) : peinture vernie, jantes chrome.
     Le nom "Paint" est porteur : la voiture de la RUE (#30) se clone
     depuis ce même GLB déjà mué — son rhabillage retrouve la peinture
     par ce nom. */
  const robe = useMemo(robeDuCiel, [])

  useEffect(() => {
    /* la robe couvre la carrosserie ET la jante (étoile + lit extérieur) :
       pneus, freins et visserie restent d'origine */
    mireLeCiel(robe, scene3, gl3)
    modele.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      const piece = pieceDeRobe(robe, mats.map((m) => m?.name ?? ""))
      if (piece) mesh.material = piece
    })
  }, [modele, robe, scene3, gl3])

  /* la respiration — amplitude couplée au sommet du banc (-2,6) : le nez
     piqué descend à ~-2,1 au creux de la houle, plus bas le banc mange la
     carrosserie. Le canal `plonge` du vol (#30) s'y ajoute : au clic, la
     voiture s'enfonce dans les nuages avant la bascule vers la rue. */
  useEffect(() => {
    voitureDuCiel.modele = modele
    return () => {
      voitureDuCiel.modele = null
    }
  }, [modele])

  useFrame((etat) => {
    if (!groupe.current || !pique.current) return
    const t = etat.clock.elapsedTime
    const { plonge, ciel } = vol.current
    groupe.current.position.y = Math.sin(t * 0.55) * 0.16 - PLONGEE * plonge + ciel.y
    groupe.current.rotation.y = ciel.lacet
    groupe.current.rotation.z = Math.sin(t * 0.32) * 0.022
    groupe.current.rotation.x = Math.sin(t * 0.45 + 1.3) * 0.014 + 0.18 * plonge
    pique.current.rotation.x = PIQUE + ciel.tangage
    pique.current.rotation.z = ciel.roulis
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
      <group rotation={[0, CAP, 0]}>
        <group ref={pique} rotation={[PIQUE, 0, 0]}>
          <primitive object={modele} />
          <LueursDuCiel modele={modele} />
        </group>
      </group>
    </group>
  )
}

export default memo(Ciel)

function Ciel({
  visible,
  surClic,
  surPret,
  vol,
}: {
  visible: boolean
  surClic: () => void
  /* signale que voiture + ciel sont décodés : la coquille monte alors la
     rue en sourdine (cascade #30 — le décodage meshopt est synchrone,
     jamais pendant le rail) */
  surPret: () => void
  vol: MutableRefObject<Trajectoire>
}) {
  const fond = useLoader(THREE.TextureLoader, CIEL_4K)
  fond.colorSpace = THREE.SRGBColorSpace
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  /* LES ÉCLATS CUITS UNE FOIS (#42, #62). drei recuit la cubemap dès que
     ses enfants changent d'identité : neufs à chaque rendu de Ciel (la
     bascule de `visible`, par exemple), ils redessinaient 6 faces de 512²
     et three r169 régénérait la PMREM dans l'ancienne cible sans réallouer
     ses plans de LOD, laissés à la taille d'une équirect de nuit : les
     reflets nets du verre et du vernis sortaient vides. Mémoïsés, ils ne
     sont cuits qu'au montage. */
  const eclats = useMemo(
    () => (
      <>
        <Lightformer form="rect" intensity={12} color="#fff4e2" position={[0, 7, -3]} target={[0, 0, 0]} scale={[20, 2, 1]} />
        <Lightformer form="rect" intensity={8} color="#ffd9b0" position={[-7, 2, -7]} target={[0, 0, 0]} scale={[12, 1.5, 1]} />
        <Lightformer form="rect" intensity={4} color="#cdbce8" position={[7, -2.5, 6]} target={[0, 0, 0]} scale={[12, 1.2, 1]} />
        <LamesDuCiel />
      </>
    ),
    [],
  )

  /* ce rendu n'existe qu'une fois les loaders résolus — le signal est là */
  useEffect(() => surPret(), [surPret])

  /* LA CHAUFFE DU CIEL CACHÉ (#42) : une session qui a déjà vu l'intro
     rouvre à l'habitacle, le ciel monté mais jamais peint. Sans chauffe,
     ses programmes se compilaient au premier ↺ (gel de 444 ms au relevé
     ?ips de Hugo, 12 programmes de plus) ; ils se compilent désormais
     avec ceux de la rue, au chargement. Au chemin d'intro, le ciel est
     déjà peint sous le voile : la chauffe n'y ajoute rien. */
  const groupe = useRef<THREE.Group>(null)
  useChauffeEnSolo(groupe)

  /* la pose d'ouverture, tenue tant que le ciel est à l'écran — le vol
     d'atterrissage (vol.tsx) prend la caméra ici au clic. Elle se REJOUE
     au retour du rejeu (dépendance `visible`), et en LAYOUT : un effet
     passif laissait peindre une frame de dôme depuis le siège (fov 45)
     avant de reposer la caméra. */
  useLayoutEffect(() => {
    if (!visible) return
    camera.position.copy(POSE)
    camera.fov = FOV_POSE
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, visible])

  return (
    <>
      {/* L'IBL vit HORS du groupe masquable et reste montée À VIE : au
          démontage, `<Environment>` de drei dispose sa texture HDR que le
          cache suspend-react continuerait de servir : un remontage rendrait
          l'IBL noire (reflets éteints). Le sous-arbre ne se démonte donc jamais,
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
        {eclats}
      </Environment>

      <group ref={groupe} visible={visible}>
        <mesh rotation-y={ROT} frustumCulled={false}>
          <sphereGeometry args={[350, 48, 32]} />
          <meshBasicMaterial
            map={fond}
            color={TEINTE_DOME}
            side={THREE.BackSide}
            depthWrite={false}
            fog={false}
          />
        </mesh>
        {/* 12e retour (« la lumière n'est pas dirigée vers la voiture ») :
            la directionnelle vivait DERRIÈRE la voiture — le flanc que la
            caméra regarde (POSE −4.2, −0.4, 7.8) n'était éclairé que par
            l'hémisphère. Elle passe côté caméra : même lumière, même
            topologie, juste braquée sur la robe. */}
        <directionalLight position={[-9, 5, 13]} intensity={1.7} color="#ffc9a0" />
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

        <Voiture surClic={surClic} vol={vol} />
      </group>
    </>
  )
}
