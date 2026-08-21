"use client"

import { useEffect, useMemo, useRef, type MutableRefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import type { Trajectoire } from "./vol"

/* LA RUE NOCTURNE — ticket #30 : le décor gaté au #22, porté du prototype
   (`app/prototype/rue`, route jetable) dans la coquille. City procédurale
   à l'échelle métrique native, GT86 rangée au bas-côté ouest de la rue
   N-S, ~90 luminaires ancrés à la géométrie, feux tricolores, fenêtres
   allumées AU PIXEL dans les façades, fond ciel/skyline/lune.

   L'ENVIRONNEMENT est le nœud du portage : le ciel (#29) garde son
   `<Environment>` crépuscule monté à vie (piège dispose, voir ciel.tsx) et
   `scene.environment` lui appartient. La rue s'en isole par la PRIORITÉ
   STRICTE de `material.envMap` sur `scene.environment` (three r169,
   WebGLRenderer.js:1791) : CHAQUE matériau de rue — décor comme voiture —
   reçoit en propre une petite équirect de nuit peinte au canvas (bande
   chaude des lampadaires au zénith, fills froids — le portrait des trois
   Lightformer du prototype). `envMapIntensity` par matériau ne redevient
   actif QUE grâce à cet envMap posé (inerte face à scene.environment,
   piège payé au #22). */

export const RUE_GLB = "/prototype/decor-procedural.glb"

/* verdict Hugo (#22) : rangée au bas-côté ouest, portion sans barrière,
   le mât d'en face (-15,5) la borde de lumière */
export const POSE_VOITURE: [number, number, number] = [-4.4, -0.05, -19]
export const CAP_VOITURE = Math.PI
/* la vue d'arrivée du vol — la caméra gatée du prototype */
export const CAM_FINALE: [number, number, number] = [-1.2, 2.0, -12.5]
export const CIBLE_FINALE: [number, number, number] = [-4.4, 1, -19]
/* la brume de la variante e — sa couleur EST le NUIT de la coquille */
const BRUME: [string, number, number] = ["#08070f", 25, 180]

/* altitude d'où la voiture tombe vers son garage pendant la phase rue du
   vol, et assiette cabrée qui s'efface au toucher */
const CHUTE_ALTITUDE = 22
const CHUTE_CABRE = -0.22

/* ---- textures partagées, peintes une fois (module client) ------------ */

/* un sprite sans map est un CARRÉ — tous les halos partagent ce dégradé
   radial (porté du prototype). `createElement` sans append : la passe
   « un seul canvas » du bloc B ne le voit pas. */
let haloPartage: THREE.CanvasTexture | null = null
export function halo() {
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

/* l'équirect de nuit : le portrait des trois Lightformer du prototype #22
   (bande chaude #ffb46b au zénith = les lampadaires, deux fills froids),
   sur un dégradé bleu nuit. Le renderer la PMREM-ise tout seul au premier
   usage (WebGLCubeUVMaps met en cache par texture — une seule conversion
   pour toute la rue). */
let nuitPartagee: THREE.CanvasTexture | null = null
export function envNuit() {
  if (!nuitPartagee) {
    const c = document.createElement("canvas")
    c.width = 256
    c.height = 128
    const ctx = c.getContext("2d")!
    const fond = ctx.createLinearGradient(0, 0, 0, 128)
    fond.addColorStop(0, "#141221")
    fond.addColorStop(0.5, "#0b0a12")
    fond.addColorStop(1, "#070609")
    ctx.fillStyle = fond
    ctx.fillRect(0, 0, 256, 128)
    /* la bande des lampadaires, au zénith, adoucie aux bords */
    const bande = ctx.createLinearGradient(0, 6, 0, 40)
    bande.addColorStop(0, "rgba(255,180,107,0)")
    bande.addColorStop(0.5, "rgba(255,180,107,0.85)")
    bande.addColorStop(1, "rgba(255,180,107,0)")
    ctx.fillStyle = bande
    ctx.fillRect(0, 6, 256, 34)
    for (const [x, teinte] of [
      [70, "rgba(154,164,200,0.5)"],
      [195, "rgba(107,116,144,0.42)"],
    ] as const) {
      const fill = ctx.createRadialGradient(x, 72, 0, x, 72, 34)
      fill.addColorStop(0, teinte)
      fill.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = fill
      ctx.fillRect(x - 34, 38, 68, 68)
    }
    nuitPartagee = new THREE.CanvasTexture(c)
    nuitPartagee.mapping = THREE.EquirectangularReflectionMapping
    nuitPartagee.colorSpace = THREE.SRGBColorSpace
  }
  return nuitPartagee
}

/* ---- le décor ---------------------------------------------------------- */

function Decor() {
  const { scene } = useGLTF(RUE_GLB)

  const modele = useMemo(() => {
    const env = envNuit()
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const mat = m as THREE.MeshStandardMaterial
        if (!mat || !("envMapIntensity" in mat)) continue
        /* la nuit du #22 : envMap PROPRE à dose faible — sans lui,
           scene.environment (le crépuscule du ciel) repeindrait la ville
           en fin d'après-midi (84 % de la lumière au sol, mesuré) */
        mat.envMap = env
        mat.envMapIntensity = (mat.metalness ?? 0) > 0.5 ? 0.35 : 0.15
        mat.needsUpdate = true
        /* les fenêtres de ce décor sont PEINTES dans les textures (24
           sommets pour un mur entier) : les pixels sombres eux-mêmes
           s'allument — inversion de luminance en émissif, cellule ~1
           fenêtre, ~10 % vivantes, rez-de-chaussée éteint (gate #22).
           C'est pour ce shader que regime.mjs recopie le baseColor des
           façades octet pour octet. */
        if (mat.name === "CityGen_LR_Facades" || mat.name === "CityGenGlass.001") {
          mat.onBeforeCompile = (shader) => {
            shader.vertexShader = shader.vertexShader
              .replace("#include <common>", "#include <common>\nvarying vec3 vPosMonde;")
              .replace(
                "#include <begin_vertex>",
                "#include <begin_vertex>\nvPosMonde = (modelMatrix * vec4(position, 1.0)).xyz;",
              )
            shader.fragmentShader = shader.fragmentShader
              .replace(
                "#include <common>",
                "#include <common>\nvarying vec3 vPosMonde;\nfloat hachageFen(vec2 p){return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);}",
              )
              .replace(
                "#include <emissivemap_fragment>",
                `#include <emissivemap_fragment>
                {
                  float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
                  float vitre = smoothstep(0.055, 0.03, lum);
                  vec2 grille = vec2(vPosMonde.y / 1.5, (vPosMonde.x + vPosMonde.z) / 1.7);
                  vec2 cellule = floor(grille);
                  vec2 f = fract(grille);
                  float coeur = smoothstep(0.06, 0.28, f.x) * (1.0 - smoothstep(0.72, 0.94, f.x))
                              * smoothstep(0.06, 0.28, f.y) * (1.0 - smoothstep(0.72, 0.94, f.y));
                  float allume = step(0.90, hachageFen(cellule)) * step(3.2, vPosMonde.y);
                  float dose = 0.12 + 0.3 * hachageFen(cellule + 7.3);
                  vec3 teinteFen = mix(vec3(1.0, 0.72, 0.42), vec3(0.75, 0.83, 1.0), step(0.7, hachageFen(cellule + 3.1)));
                  totalEmissiveRadiance += teinteFen * vitre * coeur * allume * dose;
                }`,
              )
          }
          mat.needsUpdate = true
        }
      }
    })
    return scene
  }, [scene])

  return <primitive object={modele} />
}

/* ---- la voiture garée -------------------------------------------------- */

/* La robe de nuit du #22 (habilleNuit du prototype) — appliquée à un CLONE :
   le GLB du cache est déjà porté par le ciel (#29), qui a mué ses matériaux
   pour le crépuscule ; deux <primitive> ne peuvent pas partager le même
   objet de toute façon. PHARES ÉTEINTS : leur allumage sur le nom est la
   mise en scène du SEUIL (#24 décide, #31 exécute). */
function VoitureGaree({ vol }: { vol: MutableRefObject<Trajectoire> }) {
  const { scene } = useGLTF("/prototype/gt86.glb")
  const porteur = useRef<THREE.Group>(null)
  const assiette = useRef<THREE.Group>(null)

  const modele = useMemo(() => {
    const clone = scene.clone(true)
    /* le clone hérite du CENTRAGE du ciel dans sa position — le laisser
       fausserait la mesure d'assise ci-dessous d'exactement cet offset
       (payé : la voiture garée flottait d'un demi-mètre en capture) */
    clone.position.set(0, 0, 0)
    const env = envNuit()
    const peinture = new THREE.MeshPhysicalMaterial({
      color: "#b4b9bf",
      metalness: 1.0,
      roughness: 0.06,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMap: env,
      envMapIntensity: 1.0,
    })
    peinture.name = "Paint"
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      /* matériaux À NOUS : le clone partage encore ceux du cache — les
         muter éteindrait aussi la voiture flottante du ciel */
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : mesh.material.clone()
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (mats.some((m) => m?.name === "Floor")) mesh.visible = false
      if (mats.some((m) => ["Paint", "Stern", "Aussenbeet"].includes(m?.name ?? ""))) {
        mesh.material = peinture
      }
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial
        if (!mat || !("envMapIntensity" in mat)) continue
        /* toute la voiture mire la nuit, jamais le crépuscule du ciel */
        mat.envMap = env
        if (mat.name === "Glass") {
          const verre = mat as THREE.MeshPhysicalMaterial
          verre.map = null
          verre.color.set("#161b21")
          verre.metalness = 0.55
          verre.roughness = 0.03
          verre.clearcoat = 1
          verre.envMapIntensity = 1.2
          verre.transparent = true
          verre.opacity = 0.8
        }
        /* les optiques attendent le SEUIL : intensités à zéro, les
           réglages gatés (#22) vivent au #31 qui les rallume */
        if (mat.name === "LightsFront" || mat.name === "HeadlightsTex" || mat.name === "RedGlow") {
          mat.emissiveIntensity = 0
        }
        /* la livrée d'usine rougeoie magenta la nuit — neutralisée,
           verdict robe unique du #21 */
        if (mat.name === "Taillightbody") {
          mat.map = null
          mat.color.set("#150c0e")
          mat.roughness = 0.35
        }
        if (mat.name === "Carbon") {
          mat.map = null
          mat.color.set("#1c1c20")
          mat.roughness = 0.5
        }
        mat.needsUpdate = true
      }
    })
    /* posée sur ses roues : le bas de la bbox affleure l'asphalte (y=0) —
       recalculé sur le clone, qui hérite du centrage fait par le ciel */
    const boite = new THREE.Box3().setFromObject(clone)
    clone.position.set(
      -(boite.min.x + boite.max.x) / 2,
      -boite.min.y,
      -(boite.min.z + boite.max.z) / 2,
    )
    return clone
  }, [scene])

  /* la chute : le canal `chute` du vol (0 = en l'air, 1 = posée) — la
     voiture tombe vers son garage, cabrée, et s'assied au toucher */
  useFrame(() => {
    const e = 1 - Math.pow(1 - vol.current.chute, 3)
    if (porteur.current) porteur.current.position.y = (1 - e) * CHUTE_ALTITUDE
    if (assiette.current) assiette.current.rotation.x = CHUTE_CABRE * (1 - e)
  })

  return (
    <group position={POSE_VOITURE} rotation-y={CAP_VOITURE}>
      <group ref={porteur}>
        <group ref={assiette}>
          <primitive object={modele} />
        </group>
      </group>
    </group>
  )
}

/* ---- la vie nocturne (luminaires + feux), portée du #22 ---------------- */

/* brouillon partagé du recul des halos — zéro allocation par frame */
const direction = new THREE.Vector3()

/* [x, z, y de la tête, vrai spot ?] — positions ancrées à la géométrie
   (analyse des sommets du GLB, gate #22) ; cinq vrais spots près de la
   mise en scène, halo + flaque peinte au-delà (doctrine fluidité) */
const LAMPES: [number, number, number, boolean?][] = [
  [-4.8, -15.5, 10.1, true], [-4.8, -30.0, 10.1, true], [-4.8, -44.5, 10.1],
  [5.7, -15.5, 7.9, true], [5.7, -30.0, 7.9], [5.7, -44.5, 7.9],
  [8.0, 1.0, 10.1, true], [20.2, 1.0, 10.1], [32.3, 1.0, 10.1], [44.5, 1.0, 10.1],
  [-8.0, 1.0, 10.1], [-20.2, 1.0, 10.1], [-32.3, 1.0, 10.1], [-44.5, 1.0, 10.1],
  [15.5, -2.0, 7.9, true], [26.4, -2.0, 7.9], [37.3, -2.0, 7.9], [48.2, -2.0, 7.9],
  [-15.5, -4.8, 10.1], [-30.0, -4.8, 10.1], [-44.5, -4.8, 10.1],
  [-2.0, 4.7, 9.8], [0.0, 6.8, 9.4],
  [57.0, -5.8, 9.8], [54.1, -5.9, 9.4], [63.0, 5.8, 9.8], [65.9, 5.9, 9.4],
  [50.4, 3.0, 9.8], [50.4, 5.9, 9.4],
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
  /* le sprite au centre de la tête se fait avaler par sa géométrie (depth
     test) : tiré de 0,9 m vers la caméra — hors du boîtier sous tous les
     angles, occlusion par les bâtiments intacte (gate #22) */
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
          <meshBasicMaterial map={halo()} color="#7d6039" transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/* boîtier de feux analysé au #22 ; positions des lentilles posées par Hugo
   au gizmo — cycle 17 s, deux carrefours en opposition de phase */
const CYCLE = 17
const TEINTES = ["#ff3b30", "#ffab2e", "#3bd06b"] as const
const FEUX: [number, number, number][] = [
  [9.59, 3.11, -53.51],
  [10.06, 3.18, -5.92],
]

function TeteDeFeu({ pos, phase }: { pos: [number, number, number]; phase: number }) {
  const refs = useRef<(THREE.SpriteMaterial | null)[]>([])
  useFrame((etat) => {
    const local = (etat.clock.elapsedTime + phase * (CYCLE / 2)) % CYCLE
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

/* `autour` [x, z, rayon] : ne monte que les luminaires du quartier —
   servira à l'habitacle (#31), qui vit dans une ville coupée au même rayon */
export function VieNocturne({ autour }: { autour?: [number, number, number] }) {
  const lampes = useMemo(
    () => (autour ? LAMPES.filter(([x, z]) => Math.abs(x - autour[0]) < autour[2] && Math.abs(z - autour[1]) < autour[2]) : LAMPES),
    [autour],
  )
  return (
    <group>
      {lampes.map(([x, z, y, vrai], i) => (
        <Lampe key={i} x={x} z={z} y={y} vrai={vrai} />
      ))}
      {FEUX.map((pos, i) => (
        <TeteDeFeu key={i} pos={pos} phase={i} />
      ))}
    </group>
  )
}

/* ---- le fond (ciel nocturne, skyline, lune), porté du #22 -------------- */

const CIEL_NUIT = {
  vertexShader: `
    varying vec3 vDir;
    void main() {
      vDir = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    varying vec3 vDir;
    float hachage(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec3 d = normalize(vDir);
      float h = max(d.y, 0.0);
      vec3 ciel = mix(vec3(0.075, 0.065, 0.11), vec3(0.022, 0.02, 0.04), smoothstep(0.0, 0.5, h));
      ciel += vec3(0.085, 0.05, 0.022) * pow(1.0 - h, 9.0);
      vec2 a = vec2(atan(d.z, d.x) * 40.0, d.y * 60.0);
      vec2 c = floor(a);
      vec2 p = vec2(hachage(c + 1.3), hachage(c + 2.7)) * 0.6 + 0.2;
      float etoile = smoothstep(0.07, 0.0, length(fract(a) - p)) * step(0.93, hachage(c)) * smoothstep(0.12, 0.45, d.y);
      ciel += vec3(0.75, 0.8, 1.0) * etoile * (0.2 + 0.4 * hachage(c + 5.1));
      gl_FragColor = vec4(ciel, 1.0);
    }`,
}

const SKYLINE = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    varying vec2 vUv;
    float hachage(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      float col = vUv.x * 220.0;
      float id = floor(col);
      float haut = 0.12 + 0.7 * pow(hachage(vec2(id, 3.7)), 1.6);
      if (vUv.y > haut) discard;
      vec3 teinte = mix(vec3(0.028, 0.025, 0.048), vec3(0.04, 0.036, 0.065), vUv.y / haut);
      vec2 fen = vec2(col * 4.0, vUv.y * 60.0);
      vec2 cf = floor(fen);
      vec2 ff = fract(fen);
      float allume = step(0.96, hachage(cf)) * step(0.06, fract(col)) * step(fract(col), 0.94);
      float dedans = step(0.25, ff.x) * step(ff.x, 0.75) * step(0.3, ff.y) * step(ff.y, 0.7);
      teinte += vec3(0.5, 0.35, 0.17) * allume * dedans * (0.35 + 0.5 * hachage(cf + 2.2));
      gl_FragColor = vec4(teinte, 1.0);
    }`,
}

function Fond() {
  const [ciel, ligne] = useMemo(
    () => [
      new THREE.ShaderMaterial({ ...CIEL_NUIT, side: THREE.BackSide, depthWrite: false }),
      new THREE.ShaderMaterial({ ...SKYLINE, side: THREE.BackSide }),
    ],
    [],
  )
  return (
    <group>
      <mesh material={ciel}>
        <sphereGeometry args={[350, 32, 16]} />
      </mesh>
      <mesh material={ligne} position={[0, 17, 0]}>
        <cylinderGeometry args={[210, 210, 34, 96, 1, true]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.12, 0]}>
        <circleGeometry args={[400, 48]} />
        <meshBasicMaterial color="#07060a" />
      </mesh>
      <sprite position={[-140, 150, -240]} scale={[11, 11, 1]}>
        <spriteMaterial map={halo()} color="#e8ecf6" transparent opacity={0.85} depthWrite={false} />
      </sprite>
      <sprite position={[-140, 150, -240]} scale={[38, 38, 1]}>
        <spriteMaterial map={halo()} color="#aeb6d4" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  )
}

/* ---- la rue entière ---------------------------------------------------- */

export default function Rue({
  visible,
  vol,
  poseFinale,
}: {
  visible: boolean
  vol: MutableRefObject<Trajectoire>
  /* hors vol (skip, session revenante, états d'après) : la caméra se pose
     directement sur la vue d'arrivée gatée */
  poseFinale: boolean
}) {
  const scene3 = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const invalide = useThree((s) => s.invalidate)

  /* la brume de la rue, posée pour de bon au premier montage : sa couleur
     est le fond de la coquille, et rien du ciel n'y est sensible (dôme
     fog=false, nuages sans chunk fog, la voiture flottante à ~9 m d'une
     brume qui n'ouvre qu'à 25). Pendant la descente, elle voile la ville —
     et couvre les toits que le régime #28 a servis en 512. */
  useEffect(() => {
    scene3.fog = new THREE.Fog(BRUME[0], BRUME[1], BRUME[2])
  }, [scene3])

  useEffect(() => {
    if (!poseFinale) return
    camera.position.set(...CAM_FINALE)
    camera.fov = 38
    camera.lookAt(...CIBLE_FINALE)
    camera.updateProjectionMatrix()
    /* les états de repos sont en frameloop "demand" : sans invalidation,
       la pose resterait peinte à l'ANCIENNE caméra (écran noir du skip) */
    invalide()
  }, [poseFinale, camera, invalide])

  return (
    <group visible={visible}>
      <hemisphereLight args={["#232038", "#0a080e", 0.22]} />
      {/* ambiante de nuit froide (clair de lune) — assez pour lire les
          volumes, plus assez pour ressembler à un crépuscule (gate #22) */}
      <ambientLight intensity={0.21} color="#a9b4d4" />
      <Decor />
      <VoitureGaree vol={vol} />
      <VieNocturne />
      <Fond />
    </group>
  )
}
