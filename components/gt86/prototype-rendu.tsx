"use client"

import { lazy, Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { useFrame, useLoader, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { EffectComposer as Composer } from "postprocessing"
import { NOM_VOILE } from "./transition-voile"
import { chauffeDans } from "./chauffe"

/* PROTOTYPE JETABLE (#46, #59) : le ciel en 4k et la passe d'effets de
   la référence (« BMW Falling from Sky »), commutables par ?rendu=a|b|c
   sur / (a par défaut). Le paramètre vaut pour toute l'expérience 3D :
   ciel, vol, rue et habitacle partagent le même Canvas, donc le même
   composer. Verdict à l'œil de Hugo et au banc, puis seule la gagnante
   rejoint scene.tsx et ce fichier disparaît.

   a « actuel » : rendu inchangé, sans composer, MSAA natif du Canvas.
     Rien de ce fichier ne se charge (ni le composer, ni le fond 4k).
   b « étalonnage » : fond de ciel 4k, puis une passe unique (AgX, LUT
     rose, grain, vignette, bloom léger à seuil haut), MSAA dans le
     composer, antialias du Canvas coupé.
   c « appuyé » : b avec un bloom plus fort et une légère aberration
     chromatique, pour voir le plafond.

   Le filtre CRT (#33) est une surcouche DOM du layout, par-dessus la
   toile : il se compose déjà avec ce rendu, rien à doubler ici. */

export type Rendu = "a" | "b" | "c"
const RENDUS: Rendu[] = ["a", "b", "c"]

export function renduVoulu(): Rendu {
  const cle = new URLSearchParams(window.location.search).get("rendu")
  return RENDUS.includes(cle as Rendu) ? (cle as Rendu) : "a"
}

/* ---------------------------------------------------------------------
   LE FOND 4K. Même HDRI que /prototype/crepuscule.hdr (Poly Haven
   qwantani_dusk_2_puresky, CC0 : le fichier 1k du dépôt a le md5 exact
   de leur crepuscule 1k), mais tiré de leur HDR 4k et non de leur JPG
   tonemappé : ce JPG porte déjà une courbe, l'AgX du composer l'aurait
   écrasée une seconde fois. On encode donc la radiance LINÉAIRE divisée
   par ECHELLE_4K (le maximum de la HDR 4k vaut 10,56 : rien n'est
   écrêté), en sRVB 8 bits tramé, puis AVIF 4096 × 2048 (33 Ko : un pur
   ciel est un dégradé). Le matériau remultiplie par ECHELLE_4K : le dôme
   rend la même radiance que la HDR, seulement plus nette. Même sphère,
   même rotation, mêmes UV équirectangulaires : orientation identique.
   L'IBL garde la HDR 1k, l'éclairage ne bouge pas.
   --------------------------------------------------------------------- */

const FOND_4K = "/prototype/ciel-4k.avif"
const ECHELLE_4K = 11

type Dome = { hdr: THREE.Texture; teinte: string }

/* le matériau du dôme de ciel.tsx : en a, exactement celui d'avant */
export function MateriauDome({ hdr, teinte }: Dome) {
  const [rendu] = useState(renduVoulu)
  if (rendu === "a") return <MateriauBasique carte={hdr} couleur={teinte} />
  return <MateriauDome4k teinte={teinte} />
}

function MateriauDome4k({ teinte }: { teinte: string }) {
  const fond = useLoader(THREE.TextureLoader, FOND_4K)
  fond.colorSpace = THREE.SRGBColorSpace
  const couleur = useMemo(() => new THREE.Color(teinte).multiplyScalar(ECHELLE_4K), [teinte])
  return <MateriauBasique carte={fond} couleur={couleur} />
}

function MateriauBasique({ carte, couleur }: { carte: THREE.Texture; couleur: THREE.ColorRepresentation }) {
  return <meshBasicMaterial map={carte} color={couleur} side={THREE.BackSide} depthWrite={false} fog={false} />
}

/* LE FOND DE LA RUE (ciel nocturne, skyline) écrit ses couleurs en sRVB
   brut, sans conversion, comme le voile : à l'écran (a) elles sortent
   telles quelles. Dans la cible LINÉAIRE du composer, l'encodage final
   les relevait d'un cran (0,022 devient 0,16) : le ciel noir entre les
   tours passait au lavande, et le pare-brise de l'habitacle montrait une
   rue grise. En b et c, on les ramène donc en linéaire avant d'écrire.
   En a, le shader reste celui d'avant, à l'octet près. */
const SRVB_VERS_LINEAIRE = `
vec3 srvbVersLineaire(vec3 c) {
  return mix(pow((c + 0.055) / 1.055, vec3(2.4)), c / 12.92, vec3(lessThanEqual(c, vec3(0.04045))));
}
`
export function fondPourLeRendu(fragment: string): string {
  if (renduVoulu() === "a") return fragment
  const fin = fragment.lastIndexOf("}")
  return (
    SRVB_VERS_LINEAIRE +
    fragment.slice(0, fin) +
    "  gl_FragColor.rgb = srvbVersLineaire(gl_FragColor.rgb);\n" +
    fragment.slice(fin)
  )
}

/* ---------------------------------------------------------------------
   LA PASSE D'EFFETS. Les deux paquets ne partent qu'en b et c : import
   dynamique derrière React.lazy, la variante a ne télécharge pas un
   octet de postprocessing.
   --------------------------------------------------------------------- */

type Reglages = {
  bloom: { intensite: number; seuil: number }
  aberration: boolean
}
const REGLAGES: Record<Exclude<Rendu, "a">, Reglages> = {
  /* seuil au-dessus du blanc de la scène linéaire : seuls phares, néons
     et dalle (émissifs poussés) débordent */
  b: { bloom: { intensite: 0.45, seuil: 1.1 }, aberration: false },
  c: { bloom: { intensite: 1.0, seuil: 0.9 }, aberration: true },
}
/* décalage de l'aberration, en fraction d'écran, modulé vers les bords */
const ABERRATION = new THREE.Vector2(0.0016, 0.0011)
const GRAIN = 0.18
const VIGNETTE = { decalage: 0.32, obscurite: 0.42 }
const MSAA = 4
/* la couche réservée au voile (#45), hors de la passe de rendu */
const COUCHE_VOILE = 31
/* images composées avant de lever le rideau : la première compile les
   programmes des effets, la seconde prouve qu'ils sont prêts (même
   règle que le quad du voile) */
const IMAGES_AVANT_PRET = 2

const TAILLE_LUT = 32
/* le rose du couchant, en sRVB : ombres vers le lavande, hautes
   lumières vers la pêche rosée, noirs légèrement relevés en violet */
const OMBRE = new THREE.Vector3(1.03, 0.93, 1.07)
const LUMIERE = new THREE.Vector3(1.07, 0.95, 0.92)
const NOIR_RELEVE = new THREE.Vector3(0.018, 0.006, 0.028)

export function EffetsDuRendu({ rendu, surPret }: { rendu: Exclude<Rendu, "a">; surPret: () => void }) {
  return (
    <Suspense fallback={null}>
      <Effets reglages={REGLAGES[rendu]} surPret={surPret} />
    </Suspense>
  )
}

type ProprietesEffets = { reglages: Reglages; surPret: () => void }

const Effets = lazy(async () => {
  const [pp, effets] = await Promise.all([import("@react-three/postprocessing"), import("postprocessing")])
  const { EffectComposer, Bloom, ToneMapping, LUT, Noise, Vignette, ChromaticAberration } = pp
  const { ToneMappingMode, BlendFunction, LookupTexture } = effets

  function lutRose() {
    const lut = LookupTexture.createNeutral(TAILLE_LUT)
    /* createNeutral remplit un Float32Array, malgré le type déclaré */
    const d = lut.image.data
    const c = new THREE.Vector3()
    const teinte = new THREE.Vector3()
    for (let i = 0; i < d.length; i += 4) {
      c.set(d[i], d[i + 1], d[i + 2])
      const luminance = c.x * 0.2126 + c.y * 0.7152 + c.z * 0.0722
      teinte.lerpVectors(OMBRE, LUMIERE, THREE.MathUtils.smoothstep(luminance, 0, 1))
      c.multiply(teinte).addScaledVector(NOIR_RELEVE, 1 - luminance)
      d[i] = Math.min(1, c.x)
      d[i + 1] = Math.min(1, c.y)
      d[i + 2] = Math.min(1, c.z)
    }
    lut.needsUpdate = true
    return lut
  }

  function EffetsCharges({ reglages, surPret }: ProprietesEffets) {
    const lut = useMemo(lutRose, [])
    const composer = useRef<Composer>(null)
    useVoileHorsComposer()
    useSignalePret(composer, surPret)
    return (
      <EffectComposer ref={composer} multisampling={MSAA}>
        <>
          {reglages.aberration && (
            <ChromaticAberration offset={ABERRATION} radialModulation modulationOffset={0.2} />
          )}
        </>
        <Bloom
          mipmapBlur
          intensity={reglages.bloom.intensite}
          luminanceThreshold={reglages.bloom.seuil}
          luminanceSmoothing={0.2}
        />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <LUT lut={lut} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={GRAIN} />
        <Vignette offset={VIGNETTE.decalage} darkness={VIGNETTE.obscurite} />
      </EffectComposer>
    )
  }
  return { default: EffetsCharges }
})

/* LE PIÈGE DU VOILE. Le quad de la levée (#45) écrit NUIT en sRVB brut,
   sans conversion : à l'écran il égale le voile DOM au bit près. Dans
   le composer, il serait peint dans la cible LINÉAIRE flottante, puis
   AgX, LUT, grain, vignette et l'encodage sRVB final passeraient dessus :
   NUIT ressortirait vers #2e2749 violacé (mesuré en b), saut de teinte au relais avec
   le DOM. On le sort donc de la passe : couche réservée (la caméra ne
   voit que la couche 0, la passe de rendu l'ignore), puis peint SEUL
   directement à l'écran après le composer (priorité 2 > 1), comme sans
   composer : NUIT reste #08070f, le bord fondu se pose sur l'image
   étalonnée. Il ne coûte un rendu que tant qu'il est visible. */
function useVoileHorsComposer() {
  const scene = useThree((s) => s.scene)
  const voile = useMemo(() => scene.getObjectByName(NOM_VOILE) ?? null, [scene])
  useEffect(() => {
    if (!voile) {
      console.warn(`[gt86] prototype-rendu : quad « ${NOM_VOILE} » introuvable, le voile passera dans le composer`)
      return
    }
    voile.layers.set(COUCHE_VOILE)
    return () => voile.layers.set(0)
  }, [voile])
  useFrame(({ gl, camera }) => {
    if (!voile?.visible) return
    const masque = camera.layers.mask
    const autoClear = gl.autoClear
    camera.layers.set(COUCHE_VOILE)
    gl.autoClear = false
    gl.setRenderTarget(null)
    gl.render(voile, camera)
    gl.autoClear = autoClear
    camera.layers.mask = masque
  }, 2)
}

/* la chauffe des effets (#44) : le rideau CHARGEMENT attend que le
   composer ait peint IMAGES_AVANT_PRET images avec sa passe d'effets.
   scene.tsx ne monte la rue qu'après ce signal : sa chauffe peint alors
   dans la cible du composer (chauffeDans) */
function useSignalePret(composer: RefObject<Composer | null>, surPret: () => void) {
  const images = useRef(0)
  /* une cible au format du composer (flottante, MSAA, profondeur), et à
     la taille de l'écran : three r169 cale sa cible de transmission (le
     verre du décor) sur la vue courante. Une petite cible la laissait
     petite pendant tout le ciel, et la première image de la rue la
     réallouait en plein écran, en pleine bascule */
  const cibleDeChauffe = useMemo(
    () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: MSAA }),
    [],
  )
  const gl = useThree((s) => s.gl)
  useEffect(
    () => () => {
      chauffeDans(null)
      cibleDeChauffe.dispose()
    },
    [cibleDeChauffe],
  )
  useFrame(() => {
    if (images.current >= IMAGES_AVANT_PRET) return
    const c = composer.current
    /* la passe de rendu seule ne suffit pas : on attend la passe d'effets */
    if (!c || c.passes.length < 2) return
    images.current++
    if (images.current < IMAGES_AVANT_PRET) return
    const taille = gl.getDrawingBufferSize(new THREE.Vector2())
    cibleDeChauffe.setSize(taille.x, taille.y)
    chauffeDans(cibleDeChauffe)
    surPret()
  }, 2)
}
