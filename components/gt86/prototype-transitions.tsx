"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

/* PROTOTYPE JETABLE (#45) : trois transitions shader pour la levée du
   voile CHARGEMENT, commutables par ?transition=a|b|c sur / (a par
   défaut). Verdict à l'œil de Hugo, puis seule la gagnante reste et ce
   fichier disparaît.

   Un quad plein écran DANS le canvas R3F, calque alpha posé par-dessus
   la scène : ni second contexte, ni render target, ni lecture de l'image.
   Le relais avec le voile DOM se fait dans un seul sens, sans trou : le
   quad se peint opaque SOUS le voile tant qu'il couvre (donc compilé
   bien avant la levée), puis, deux images peintes plus tard au minimum,
   il commence sa course et demande au DOM de s'effacer. Le DOM s'efface
   donc une image APRÈS le départ du quad, jamais avant : aucune image ne
   montre la scène nue. */

type Cle = "a" | "b" | "c"
export type Transition = { variante: Cle; forcee: boolean }

/* ?transition présent : le voile est forcé au premier CIEL, pour que la
   transition se voie à chaque visite, cache plein compris */
export function transitionVoulue(): Transition {
  const params = new URLSearchParams(window.location.search)
  const cle = params.get("transition")
  return {
    variante: cle === "b" || cle === "c" ? cle : "a",
    forcee: params.has("transition"),
  }
}

/* le minimum de voile forcé quand ?transition est dans l'URL */
export const VOILE_FORCE_MS = 1500

const DISSOLUTION_MS = 1100
const OUVERTURE_MS = 1200
const RESOLUTION_MS = 1000
/* images peintes opaques avant de partir : la première compile le
   programme, la seconde prouve qu'il est prêt */
const IMAGES_AVANT_DEPART = 2
/* comme le vol : une image lente ne téléporte pas la course */
const DELTA_MAX = 1 / 12

const REDUIT =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/* les couleurs sortent telles quelles (pas de colorspace_fragment) :
   ce sont donc des valeurs sRGB, NUIT ici égale exactement le voile DOM */
const COMMUN = /* glsl */ `
uniform float uProgres;
uniform float uTemps;
uniform vec2 uResolution;
const vec3 NUIT = vec3(8.0, 7.0, 15.0) / 255.0;

float hache(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float bruit(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hache(i), hache(i + vec2(1.0, 0.0)), u.x),
             mix(hache(i + vec2(0.0, 1.0)), hache(i + vec2(1.0, 1.0)), u.x), u.y);
}
/* somme de 5 octaves : reste sous 0,97 */
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * bruit(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}
float adoucit(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}
/* coordonnées centrées, à l'échelle de la hauteur */
vec2 centre() {
  return (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
}
`

/* A : le voile se dissout selon le bruit, liseré rose chaud côté nuit et
   doré côté découvert au front (le ciel rose de la vidéo de référence) */
const DISSOLUTION = /* glsl */ `
${COMMUN}
const float LISERE = 0.06;
void main() {
  /* le fbm se tasse autour de 0,5 : étiré, le front balaie toute la course */
  float n = smoothstep(0.2, 0.8, fbm(centre() * 3.0 + uTemps * 0.15));
  float seuil = mix(-LISERE - 0.02, 1.0 + LISERE, adoucit(uProgres));
  float d = n - seuil;
  float nuit = smoothstep(0.0, 0.012, d);
  float lisere = 1.0 - smoothstep(0.0, LISERE, abs(d));
  vec3 rose = vec3(1.0, 0.42, 0.62);
  vec3 dore = vec3(1.0, 0.8, 0.4);
  vec3 feu = mix(dore, rose, smoothstep(-LISERE, LISERE, d));
  gl_FragColor = vec4(mix(NUIT, feu, lisere), max(nuit, lisere));
}
`

/* B : des volutes couleur voile s'écartent du centre vers les bords, la
   texture grossit pendant l'ouverture comme si la caméra perçait la couche */
const OUVERTURE = /* glsl */ `
${COMMUN}
const float DOUX = 0.22;
const float TORSION = 0.5;
void main() {
  vec2 uv = centre();
  float coin = length(0.5 * uResolution / uResolution.y);
  float p = adoucit(uProgres);
  vec2 q = uv * 2.6 / (1.0 + 0.9 * p);
  float volute = fbm(q + vec2(uTemps * 0.06, -uTemps * 0.04));
  float r = length(uv) / coin + (volute - 0.5) * TORSION;
  float rayon = mix(-0.5 * TORSION - DOUX, 1.0 + 0.5 * TORSION, p);
  float voile = smoothstep(rayon, rayon + DOUX, r);
  vec3 nuage = NUIT * (1.0 + 2.2 * volute) + vec3(0.02, 0.012, 0.035) * volute;
  /* la texture n'apparaît qu'en partant : à 0, le quad égale le voile DOM */
  vec3 couleur = mix(NUIT, nuage, smoothstep(0.0, 0.12, uProgres));
  gl_FragColor = vec4(couleur, voile);
}
`

/* C : de gros blocs carrés tombent dans l'ordre d'une matrice de Bayer
   8x8, de plus en plus fins ; juste avant de partir, quelques-uns
   clignent en cyan ou en rose (la touche Y2K) */
const RESOLUTION = /* glsl */ `
${COMMUN}
const float BLOC_MAX = 120.0;
const float BLOC_MIN = 10.0;
const float PAS = 10.0;
const float FRANGE = 0.07;
float bayer2(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
void main() {
  float echelle = uResolution.y / 900.0;
  float taille = max(BLOC_MIN, floor(mix(BLOC_MAX, BLOC_MIN, uProgres) / PAS) * PAS) * echelle;
  vec2 bloc = floor(gl_FragCoord.xy / taille);
  float ordre = bayer8(mod(bloc, 8.0));
  float reste = step(uProgres, ordre);
  float frange = (1.0 - smoothstep(0.0, FRANGE, ordre - uProgres)) * smoothstep(0.0, 0.05, uProgres);
  float tirage = hache(bloc + floor(uProgres * 12.0));
  vec3 cyan = vec3(0.3, 0.95, 1.0);
  vec3 rose = vec3(1.0, 0.35, 0.75);
  vec3 eclat = tirage < 0.5 ? cyan : rose;
  float clignote = step(0.72, tirage) * frange;
  gl_FragColor = vec4(mix(NUIT, eclat, clignote), reste);
}
`

const VARIANTES: Record<Cle, { fragment: string; dureeMs: number }> = {
  a: { fragment: DISSOLUTION, dureeMs: DISSOLUTION_MS },
  b: { fragment: OUVERTURE, dureeMs: OUVERTURE_MS },
  c: { fragment: RESOLUTION, dureeMs: RESOLUTION_MS },
}

const SOMMET = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

type Phase = "repos" | "couvre" | "joue"

export function TransitionVoile({
  variante,
  couvert,
  relaisAttendu,
  surLevee,
}: {
  variante: Cle
  /* le voile DOM couvre : le quad se tient opaque dessous */
  couvert: boolean
  /* le voile DOM attend le relais, même si `couvert` n'a duré qu'un rendu
     sans image : sans ce filet, il resterait affiché pour toujours */
  relaisAttendu: boolean
  /* le quad a pris le relais : le voile DOM peut s'effacer */
  surLevee: () => void
}) {
  const { fragment, dureeMs } = VARIANTES[variante]
  const quad = useRef<THREE.Mesh>(null)
  const materiau = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SOMMET,
        fragmentShader: fragment,
        uniforms: {
          uProgres: { value: 0 },
          uTemps: { value: 0 },
          uResolution: { value: new THREE.Vector2(1, 1) },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [fragment],
  )
  const interne = useRef({ phase: "repos" as Phase, imagesPeintes: 0 })
  const couvertRef = useRef(couvert)
  couvertRef.current = couvert
  const attenduRef = useRef(relaisAttendu)
  attenduRef.current = relaisAttendu

  useFrame(({ gl, clock }, delta) => {
    const mesh = quad.current
    if (!mesh) return
    const i = interne.current
    const u = materiau.uniforms
    if (couvertRef.current) {
      if (i.phase !== "couvre") i.imagesPeintes = 0
      else if (mesh.visible) i.imagesPeintes++
      i.phase = "couvre"
      u.uProgres.value = 0
    } else if (i.phase === "couvre" || (i.phase === "repos" && attenduRef.current)) {
      if (i.phase === "repos") i.imagesPeintes = 0
      else if (mesh.visible) i.imagesPeintes++
      i.phase = "couvre"
      if (i.imagesPeintes >= IMAGES_AVANT_DEPART) {
        i.phase = "joue"
        u.uProgres.value = REDUIT ? 1 : 0
        surLevee()
      }
    } else if (i.phase === "joue") {
      u.uProgres.value = Math.min(1, u.uProgres.value + (Math.min(delta, DELTA_MAX) * 1000) / dureeMs)
      if (u.uProgres.value >= 1) i.phase = "repos"
    }
    /* ponytail: caché plutôt que démonté à 1, le programme reste en cache
       pour le rideau du rejeu ; un mesh invisible ne coûte rien */
    mesh.visible = i.phase !== "repos"
    u.uTemps.value = clock.elapsedTime
    u.uResolution.value.set(gl.domElement.width, gl.domElement.height)
  })

  return (
    <mesh ref={quad} visible={false} frustumCulled={false} renderOrder={1e6} material={materiau}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}
