"use client"

import { useEffect, useMemo, useRef, type RefObject } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { EffectComposer, Bloom, ToneMapping, LUT, Noise, Vignette, ChromaticAberration } from "@react-three/postprocessing"
import { ToneMappingMode, BlendFunction, LookupTexture, type EffectComposer as Composer } from "postprocessing"
import { NOM_VOILE } from "./transition-voile"
import { chauffeDans } from "./chauffe"

/* LE RENDU DE LA RÉFÉRENCE : tickets #46 et #59. La passe d'effets de
   « BMW Falling from Sky », posée sur toute l'expérience 3D : ciel, vol,
   rue et habitacle partagent le même Canvas, donc le même composer. Une
   passe unique AgX, LUT rose, grain, vignette, bloom fort à seuil haut
   et légère aberration chromatique, MSAA dans le composer (l'antialias
   du Canvas est coupé). Le fond de ciel 4k qui va avec vit dans ciel.tsx.

   Décision de Hugo (2026-10-15) : des trois rendus du prototype, il
   retient le plus appuyé, « le meilleur et de loin ». Les deux autres
   (rendu d'origine sans composer, étalonnage au bloom léger) et le
   commutateur ?rendu restent lisibles sur la branche prototype/rendu-46-59.

   Le filtre CRT (#33) est une surcouche DOM du layout, par-dessus la
   toile : il se compose déjà avec ce rendu, rien à doubler ici. */

/* LE FOND DE LA RUE (ciel nocturne, skyline) écrit ses couleurs en sRVB
   brut, sans conversion, comme le voile. Dans la cible LINÉAIRE du
   composer, l'encodage final les relevait d'un cran (0,022 devient
   0,16) : le ciel noir entre les tours passait au lavande, et le
   pare-brise de l'habitacle montrait une rue grise. On les ramène donc
   en linéaire avant d'écrire. */
const SRVB_VERS_LINEAIRE = `
vec3 srvbVersLineaire(vec3 c) {
  return mix(pow((c + 0.055) / 1.055, vec3(2.4)), c / 12.92, vec3(lessThanEqual(c, vec3(0.04045))));
}
`
export function fondPourLeRendu(fragment: string): string {
  const fin = fragment.lastIndexOf("}")
  return (
    SRVB_VERS_LINEAIRE +
    fragment.slice(0, fin) +
    "  gl_FragColor.rgb = srvbVersLineaire(gl_FragColor.rgb);\n" +
    fragment.slice(fin)
  )
}

/* seuil sous le blanc de la scène linéaire, intensité pleine : phares,
   néons et dalle (émissifs poussés) débordent franchement */
const BLOOM = { intensite: 1.0, seuil: 0.9 }
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

export function Effets({ surPret }: { surPret: () => void }) {
  const lut = useMemo(lutRose, [])
  const composer = useRef<Composer>(null)
  useVoileHorsComposer()
  useSignalePret(composer, surPret)
  return (
    <EffectComposer ref={composer} multisampling={MSAA}>
      <ChromaticAberration offset={ABERRATION} radialModulation modulationOffset={0.2} />
      <Bloom mipmapBlur intensity={BLOOM.intensite} luminanceThreshold={BLOOM.seuil} luminanceSmoothing={0.2} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <LUT lut={lut} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={GRAIN} />
      <Vignette offset={VIGNETTE.decalage} darkness={VIGNETTE.obscurite} />
    </EffectComposer>
  )
}

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

/* LE PIÈGE DU VOILE. Le quad de la levée (#45) écrit NUIT en sRVB brut,
   sans conversion : à l'écran il égale le voile DOM au bit près. Dans
   le composer, il serait peint dans la cible LINÉAIRE flottante, puis
   AgX, LUT, grain, vignette et l'encodage sRVB final passeraient dessus :
   NUIT ressortirait vers #2e2749 violacé (mesuré au prototype), saut de
   teinte au relais avec le DOM. On le sort donc de la passe : couche
   réservée (la caméra ne voit que la couche 0, la passe de rendu
   l'ignore), puis peint SEUL directement à l'écran après le composer
   (priorité 2 > 1) : NUIT reste #08070f, le bord fondu se pose sur
   l'image étalonnée. Il ne coûte un rendu que tant qu'il est visible. */
function useVoileHorsComposer() {
  const scene = useThree((s) => s.scene)
  const voileRef = useRef<THREE.Object3D | null>(null)
  /* cherché après le commit, pas au rendu : le quad se monte dans le même
     commit que ce composer, il n'est pas encore dans la scène au rendu */
  useEffect(() => {
    const voile = scene.getObjectByName(NOM_VOILE)
    if (!voile) {
      console.warn(`[gt86] rendu : quad « ${NOM_VOILE} » introuvable, le voile passera dans le composer`)
      return
    }
    voile.layers.set(COUCHE_VOILE)
    voileRef.current = voile
    return () => {
      voile.layers.set(0)
      voileRef.current = null
    }
  }, [scene])
  useFrame(({ gl, camera }) => {
    const voile = voileRef.current
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
