"use client"

import { Lightformer } from "@react-three/drei"
import * as THREE from "three"

/* LA CARROSSERIE DE LA GT86, ticket #53 : la robe chrome miroir que
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

/* Chrome miroir : métal pur, poli, sans vernis. Il ne vit que de son
   environnement de reflet, d'où le reflet du ciel bas : le crépuscule
   est clair partout, un miroir plus fort y devenait blanc plat. La nuit
   est le seul environnement de la voiture en rue, elle porte l'éclat.
   La couleur tire un souffle vers le bleu : la LUT rose du rendu
   (rendu.tsx) multiplie les hautes lumières par (1,07 ; 0,95 ; 0,92),
   un gris neutre y ressortait taupe rosé. */
const ROBE = {
  couleur: "#e4e9ef",
  metal: 1,
  rugosite: 0.05,
  /* l'<Environment> du ciel donne 0,6 à tout le reste */
  refletCiel: 0.28,
  refletNuit: 2.6,
}

export function peintureDuCiel() {
  const p = new THREE.MeshPhysicalMaterial({
    color: ROBE.couleur,
    metalness: ROBE.metal,
    roughness: ROBE.rugosite,
  })
  /* nom porteur : la rue retrouve la peinture par ce nom (ciel.tsx) */
  p.name = "Paint"
  return p
}

export function peintureDeNuit() {
  const p = peintureDuCiel()
  p.envMap = envNuitCarrosserie()
  p.envMapIntensity = ROBE.refletNuit
  return p
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
   passif) et son contenu ne change plus. */
let cielPropre: THREE.Texture | null = null
export function mireLeCiel(robe: THREE.MeshPhysicalMaterial, scene: THREE.Scene, gl: THREE.WebGLRenderer) {
  if (!scene.environment) {
    console.warn("carrosserie : pas de scene.environment au montage, la robe garde le reflet de la scène")
    return
  }
  if (!cielPropre) {
    const generateur = new THREE.PMREMGenerator(gl)
    cielPropre = generateur.fromCubemap(scene.environment as THREE.CubeTexture).texture
    generateur.dispose()
  }
  robe.envMap = cielPropre
  robe.envMapRotation.copy(scene.environmentRotation)
  robe.envMapIntensity = ROBE.refletCiel
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
