"use client"

import { Lightformer } from "@react-three/drei"
import * as THREE from "three"

/* LA CARROSSERIE DE LA GT86, ticket #53 : la robe que
   portent toutes les scènes (ciel, vol, rue, seuil), jantes comprises.
   Verdict de Hugo le 2026-10-16 sur trois prototypes (« la version a est
   bcp mieux ») : le chrome poli l'emporte sur l'argent métallisé pailleté
   et sur l'anodisé satiné. Le prototype complet, avec ses trois robes
   commutables, reste sur la branche prototype/carrosserie-53.

   Le piège du #21 tient toujours : un métal ne montre que ce qu'il
   reflète. La robe vient donc avec son ENVIRONNEMENT DE REFLET, cuit une
   seule fois au montage, sous le voile : des Lightformer dans la cubemap
   du ciel (aucune lumière de scène, la topologie ne bouge pas), une
   équirect de nuit plus riche pour la voiture de la rue (lampadaires,
   vitrines, néons). Les jantes partagent la robe : elles restent le
   repère du silver. */

/* Deux matériaux depuis le v7 (Hugo, 2026-10-20 : « du chrome lilas qui
   reflète tout ») : la CAISSE porte une vraie peinture, une base nette
   presque diélectrique sous un vernis poli qui seul mire le ciel ; les
   JANTES ont leur propre matériau (JANTES, plus bas). Le vernis est
   posé dès la création : passer clearcoat de 0 à plus de 0 recompile le
   programme, à faire avant le rideau, jamais après.

   Les blancs restent froids, à peine bleutés : la LUT rose du rendu
   (rendu.tsx) multiplie les hautes lumières par (1,07 ; 0,95 ; 0,92), un
   gris neutre y ressortait taupe rosé. Le reflet du ciel reste bas : le
   crépuscule est clair partout. La nuit porte l'éclat en rue. */
/* Les jantes en blanc laqué (Hugo, 2026-10-20 : « pour que ça matche »)
   : le blanc froid de la caisse, peu métallique, sous un vernis brillant
   posé dès la création (même règle que la caisse : avant le rideau). */
const JANTES = {
  couleur: "#eef2f7",
  metal: 0.1,
  rugosite: 0.22,
  vernis: 1,
  rugositeVernis: 0.04,
}
/* Deux robes (Hugo, 2026-10-20 : « on reste avec le blanc ») : par
   défaut un BLANC GLACIER nacré (Crystal White Pearl) ; ?robe=noir donne
   le NOIR MÉTALLIQUE profond à peine bleuté de la v9, paillettes fines
   sous un vernis miroir. Les deux compilent le MÊME programme : film mince (iridescence),
   voile (sheen) et carte de paillettes ajoutent chacun un define, ils
   restent donc posés dès la création et jamais nuls, même quand le noir
   n'en veut presque pas. Seules les valeurs changent. */
const PEINTURES = {
  noir: {
    couleur: "#0a0c12",
    metal: 0.6,
    rugosite: 0.3,
    vernis: 1,
    rugositeVernis: 0.02,
    film: 0.001,
    indiceFilm: 1.3,
    epaisseursFilm: [100, 400] as [number, number],
    voile: 0.001,
    couleurVoile: "#000000",
    rugositeVoile: 0.5,
    paillettes: 0.1,
  },
  blanc: {
    couleur: "#eef2f7",
    metal: 0.08,
    rugosite: 0.28,
    vernis: 1,
    rugositeVernis: 0.03,
    film: 0.22,
    indiceFilm: 1.4,
    epaisseursFilm: [220, 420] as [number, number],
    voile: 0.12,
    couleurVoile: "#dce6ff",
    rugositeVoile: 0.4,
    paillettes: 0.04,
  },
}
/* lue une fois, à la création du matériau : avant le rideau */
function peintureChoisie() {
  const robe = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("robe")
  return robe === "noir" ? PEINTURES.noir : PEINTURES.blanc
}
/* la carte de paillettes : une normale tirée au hasard par texel, répétée
   fin sur l'UV de la caisse (un atlas de ~4 m) : un texel ≈ 0,25 mm. Les
   mipmaps la lissent de loin, de près le soleil y accroche des éclats. */
const PAILLETTES = { texels: 256, repetition: 64 }
const REFLET = {
  /* l'<Environment> du ciel donne 0,6 à tout le reste */
  ciel: 0.28,
  nuit: 2.6,
}

export type Robe = { caisse: THREE.MeshPhysicalMaterial; jantes: THREE.MeshPhysicalMaterial }

/* noms porteurs : la rue retrouve la robe par les noms du GLB (ciel.tsx) */
const PIECES_DE_CAISSE = ["Paint"]
const PIECES_DE_JANTE = ["Stern", "Aussenbeet"]

export function robeDuCiel(): Robe {
  const PEINTURE = peintureChoisie()
  const caisse = new THREE.MeshPhysicalMaterial({
    color: PEINTURE.couleur,
    metalness: PEINTURE.metal,
    roughness: PEINTURE.rugosite,
    clearcoat: PEINTURE.vernis,
    clearcoatRoughness: PEINTURE.rugositeVernis,
    iridescence: PEINTURE.film,
    iridescenceIOR: PEINTURE.indiceFilm,
    iridescenceThicknessRange: PEINTURE.epaisseursFilm,
    sheen: PEINTURE.voile,
    sheenColor: PEINTURE.couleurVoile,
    sheenRoughness: PEINTURE.rugositeVoile,
    normalMap: carteDePaillettes(),
    normalScale: new THREE.Vector2(PEINTURE.paillettes, PEINTURE.paillettes),
  })
  caisse.name = PIECES_DE_CAISSE[0]
  const jantes = new THREE.MeshPhysicalMaterial({
    color: JANTES.couleur,
    metalness: JANTES.metal,
    roughness: JANTES.rugosite,
    clearcoat: JANTES.vernis,
    clearcoatRoughness: JANTES.rugositeVernis,
  })
  jantes.name = PIECES_DE_JANTE[0]
  return { caisse, jantes }
}

let paillettes: THREE.CanvasTexture | null = null
function carteDePaillettes() {
  if (paillettes) return paillettes
  const { texels, repetition } = PAILLETTES
  const toile = document.createElement("canvas")
  toile.width = texels
  toile.height = texels
  const ctx = toile.getContext("2d")
  if (!ctx) throw new Error("carrosserie : pas de contexte 2D pour les paillettes")
  const image = ctx.createImageData(texels, texels)
  const tire = hasard(86)
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = 128 + (tire() - 0.5) * 254
    image.data[i + 1] = 128 + (tire() - 0.5) * 254
    image.data[i + 2] = 255
    image.data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  paillettes = new THREE.CanvasTexture(toile)
  paillettes.wrapS = paillettes.wrapT = THREE.RepeatWrapping
  paillettes.repeat.set(repetition, repetition)
  return paillettes
}

export function robeDeNuit(): Robe {
  const robe = robeDuCiel()
  for (const m of [robe.caisse, robe.jantes]) {
    m.envMap = envNuitCarrosserie()
    m.envMapIntensity = REFLET.nuit
  }
  return robe
}

/* le matériau de la robe pour ces noms de matériaux du GLB, ou undefined
   si la pièce n'en porte pas (pneus, freins, visserie restent d'origine) */
export function pieceDeRobe(robe: Robe, noms: string[]) {
  if (noms.some((n) => PIECES_DE_CAISSE.includes(n))) return robe.caisse
  if (noms.some((n) => PIECES_DE_JANTE.includes(n))) return robe.jantes
  return undefined
}

/* Face à scene.environment, three r169 impose l'environmentIntensity de
   la scène (0,6) et ignore l'envMapIntensity du matériau : la robe
   prend donc la cubemap du ciel EN PROPRE. Et pas la PMREM que le
   renderer en tire, qui est FAUSSE dès la deuxième cuisson : drei
   recuit la cubemap à chaque rendu de <Ciel> (ses enfants JSX sont
   neufs), et three r169 régénère alors la PMREM dans l'ancienne cible
   SANS réallouer ses plans de LOD, laissés à la taille de la dernière
   PMREM tirée (les équirects de nuit, 64 ou 256 de face contre 512).
   Les niveaux nets sortent vides : une boule miroir n'y montrait que le
   spéculaire des lumières directes, la même boule en MeshBasicMaterial
   sur la même cubemap tout le ciel. C'était la vraie cause du chrome
   charbon (et du verre du ciel, à trancher hors #53). La robe tire donc
   SA PMREM, une seule fois, d'un générateur neuf : la cubemap est déjà
   cuite (l'<Environment> la cuit en layout, cet appel vient d'un effet
   passif) et son contenu ne change plus. Une PMREM par renderer, pas par
   module : un retour client sur / remonte un <Canvas> neuf, et la cible
   de l'ancien contexte, perdu, ne se ré-uploade pas (chrome charbon). */
const cielPropre = new WeakMap<THREE.WebGLRenderer, THREE.Texture>()
export function mireLeCiel(robe: Robe, scene: THREE.Scene, gl: THREE.WebGLRenderer) {
  if (!scene.environment) {
    console.warn("carrosserie : pas de scene.environment au montage, la robe garde le reflet de la scène")
    return
  }
  let propre = cielPropre.get(gl)
  if (!propre) {
    const generateur = new THREE.PMREMGenerator(gl)
    propre = generateur.fromCubemap(scene.environment as THREE.CubeTexture).texture
    generateur.dispose()
    cielPropre.set(gl, propre)
  }
  for (const m of [robe.caisse, robe.jantes]) {
    m.envMap = propre
    m.envMapRotation.copy(scene.environmentRotation)
    m.envMapIntensity = REFLET.ciel
  }
}

/* ---- l'environnement de reflet du ciel --------------------------------- */

/* À poser DANS l'<Environment> du ciel : cuit dans la cubemap au montage
   (une image de CubeCamera), jamais une lumière de scène. Le plancher
   est la mer de nuages sous la voiture, gris neutre et tenu bas : la
   PMREM réparée (voir mireLeCiel), un plancher clair noyait le chrome
   dans un blanc plat, et c'est ce contraste haut clair, bas sombre qui
   le fait lire miroir. Les bandes sont des softbox de studio, blanc neutre :
   elles dessinent les lignes de la caisse et rendent au silver sa
   lecture froide contre le rose. */
export function LamesDuCiel() {
  return (
    <>
      <Lightformer form="rect" intensity={0.08} color="#dfe3e8" position={[0, -8, 0]} target={[0, 0, 0]} scale={[60, 60, 1]} />
      <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 3, 8]} target={[0, 0, 0]} scale={[18, 1.4, 1]} />
      <Lightformer form="rect" intensity={3} color="#f2f6ff" position={[-8, 0.5, 2]} target={[0, 0, 0]} scale={[14, 1, 1]} />
      <Lightformer form="rect" intensity={3} color="#f2f6ff" position={[8, 1.5, -2]} target={[0, 0, 0]} scale={[14, 1, 1]} />
      <Lightformer form="ring" intensity={2.5} color="#ffffff" position={[3, 6, 5]} target={[0, 0, 0]} scale={4} />
    </>
  )
}

/* ---- l'environnement de reflet de la rue -------------------------------- */

/* L'équirect de nuit de la VOITURE seule (le décor garde envNuit) :
   même fond que rue.tsx, mais de quoi mirer. Peinte une fois au canvas,
   PMREM-isée par le renderer à la chauffe de la rue, sous le voile.
   Haut de l'image = zénith, milieu = horizon. Le canvas plafonne à 1 :
   l'éclat vient de l'envMapIntensity de la robe. */
const L = 1024
const H = 512
const HORIZON = H / 2
let nuitCarrosserie: THREE.CanvasTexture | null = null
function envNuitCarrosserie() {
  if (nuitCarrosserie) return nuitCarrosserie
  const c = document.createElement("canvas")
  c.width = L
  c.height = H
  const ctx = c.getContext("2d")!
  peinsFondDeNuit(ctx)
  peinsVitrines(ctx)
  peinsNeons(ctx)
  peinsLampadaires(ctx)
  nuitCarrosserie = new THREE.CanvasTexture(c)
  nuitCarrosserie.mapping = THREE.EquirectangularReflectionMapping
  nuitCarrosserie.colorSpace = THREE.SRGBColorSpace
  return nuitCarrosserie
}

/* tirage reproductible : la même rue à chaque montage */
function hasard(graine: number) {
  let s = graine
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function peinsFondDeNuit(ctx: CanvasRenderingContext2D) {
  const fond = ctx.createLinearGradient(0, 0, 0, H)
  fond.addColorStop(0, "#181628")
  fond.addColorStop(0.45, "#221d2c")
  fond.addColorStop(0.5, "#141219")
  fond.addColorStop(1, "#060508")
  ctx.fillStyle = fond
  ctx.fillRect(0, 0, L, H)
  /* la bande chaude des lampadaires au zénith, celle de envNuit */
  const bande = ctx.createLinearGradient(0, 12, 0, 80)
  bande.addColorStop(0, "rgba(255,190,120,0)")
  bande.addColorStop(0.5, "rgba(255,200,140,0.75)")
  bande.addColorStop(1, "rgba(255,190,120,0)")
  ctx.fillStyle = bande
  ctx.fillRect(0, 12, L, 68)
}

/* les vitrines : de larges pans clairs au ras de l'horizon, chauds et
   froids, et leur reflet mouillé étiré sur l'asphalte */
function peinsVitrines(ctx: CanvasRenderingContext2D) {
  const tire = hasard(53)
  for (let x = 0; x < L; ) {
    const largeur = 40 + tire() * 90
    if (tire() < 0.7) {
      const teinte = tire() < 0.6 ? "255,222,180" : "222,234,255"
      const haut = 18 + tire() * 22
      ctx.fillStyle = `rgba(${teinte},${0.55 + tire() * 0.4})`
      ctx.fillRect(x, HORIZON - haut, largeur, haut - 2)
      const reflet = ctx.createLinearGradient(0, HORIZON, 0, HORIZON + 70)
      reflet.addColorStop(0, `rgba(${teinte},0.28)`)
      reflet.addColorStop(1, `rgba(${teinte},0)`)
      ctx.fillStyle = reflet
      ctx.fillRect(x + 4, HORIZON, largeur - 8, 70)
    }
    x += largeur + 8 + tire() * 30
  }
}

/* les néons : des traits fins au-dessus des vitrines. Un seul rose sur
   quatre : avec le rose et le violet à parts égales, le capot du seuil
   portait une large bande magenta et le silver lisait « chrome sous
   néons ». */
function peinsNeons(ctx: CanvasRenderingContext2D) {
  const tire = hasard(86)
  const teintes = ["#4fe3ff", "#ff7a3d", "#eef3ff", "#ff4fa8"]
  ctx.lineWidth = 3
  ctx.lineCap = "round"
  for (let i = 0; i < 22; i++) {
    const x = tire() * L
    const y = HORIZON - 48 - tire() * 40
    ctx.strokeStyle = teintes[i % teintes.length]
    ctx.shadowColor = ctx.strokeStyle
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 20 + tire() * 50, y)
    ctx.stroke()
  }
  ctx.shadowBlur = 0
}

/* les lampadaires : des têtes blanches et sodium en rangées, plus
   petites en approchant de l'horizon (perspective de la rue) */
function peinsLampadaires(ctx: CanvasRenderingContext2D) {
  const tire = hasard(2026)
  for (let rang = 0; rang < 3; rang++) {
    const y = 110 + rang * 38
    const rayon = 14 - rang * 4
    for (let x = tire() * 60; x < L; x += 70 + tire() * 50) {
      const teinte = tire() < 0.5 ? "255,236,205" : "255,196,120"
      const tete = ctx.createRadialGradient(x, y, 0, x, y, rayon)
      tete.addColorStop(0, `rgba(${teinte},1)`)
      tete.addColorStop(0.35, `rgba(${teinte},0.85)`)
      tete.addColorStop(1, `rgba(${teinte},0)`)
      ctx.fillStyle = tete
      ctx.fillRect(x - rayon, y - rayon, rayon * 2, rayon * 2)
    }
  }
}

/* LA CIBLE DU CLIC (#42) : la boîte de la voiture, pas ses triangles. Le
   raycast R3F testait les 321 k triangles de la GT86 à chaque
   pointerdown, pointerup, click et cran de molette : 24 à 33 ms chacun,
   jusqu'à 90 ms par clic. Ses maillages deviennent transparents au rayon
   et la racine répond par `boite`, posée dans le repère de son parent.
   Le rayon qui part de DEDANS (l'habitacle) touche la face de sortie :
   seule sa direction compte pour les zones de la dalle (zoneDuClic).
   Aucun maillage de plus : rien à compiler, rien à peindre. */
export function cliquableParSaBoite(voiture: THREE.Object3D, boite: THREE.Box3) {
  voiture.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.raycast = () => {}
  })
  const versParent = new THREE.Matrix4()
  const rayon = new THREE.Ray()
  voiture.raycast = (raycaster, touches) => {
    const parent = voiture.parent
    if (!parent) return
    rayon.copy(raycaster.ray).applyMatrix4(versParent.copy(parent.matrixWorld).invert())
    const point = rayon.intersectBox(boite, new THREE.Vector3())
    if (!point) return
    point.applyMatrix4(parent.matrixWorld)
    touches.push({ distance: raycaster.ray.origin.distanceTo(point), point, object: voiture })
  }
}
