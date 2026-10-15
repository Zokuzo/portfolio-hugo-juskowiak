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
  /* ease-out : la trouée s'ouvre dès le départ, sans palier où le voile
     ne ferait que changer de teinte */
  float p = 1.0 - pow(1.0 - uProgres, 2.0);
  vec2 q = uv * 2.6 / (1.0 + 0.9 * p);
  float volute = fbm(q + vec2(uTemps * 0.06, -uTemps * 0.04));
  float r = length(uv) / coin + (volute - 0.5) * TORSION;
  float rayon = mix(-0.25 * TORSION - DOUX, 1.0 + 0.5 * TORSION, p);
  float voile = smoothstep(rayon, rayon + DOUX, r);
  vec3 nuage = NUIT * (1.0 + 0.9 * volute) + vec3(0.008, 0.005, 0.014) * volute;
  /* la texture n'apparaît qu'en partant : à 0, le quad égale le voile DOM */
  vec3 couleur = mix(NUIT, nuage, smoothstep(0.0, 0.12, uProgres));
  gl_FragColor = vec4(couleur, voile);
}
`

/* C : le voile tombe par blocs carrés dans un ordre tramé (Bayer), sur
   NIVEAUX tailles emboîtées (chacune moitié de la précédente) ; un bloc parti ne revient jamais, ses sous-blocs partent avec lui. Juste
   avant de partir, quelques-uns clignent en cyan ou en rose (touche Y2K) */
const RESOLUTION = /* glsl */ `
${COMMUN}
const float BLOC_MAX = 128.0;
const int NIVEAUX = 5;
/* part des blocs restants qu'emporte chaque niveau, le dernier vide tout */
const float PART = 0.5;
const float FRANGE = 0.08;
float bayer2(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
void main() {
  float taille = BLOC_MAX * uResolution.y / 900.0;
  float reste = 1.0;
  vec3 couleur = NUIT;
  for (int k = 0; k < NIVEAUX; k++) {
    vec2 bloc = floor(gl_FragCoord.xy / taille);
    /* les gros blocs suivent la trame 8x8 ; ensuite, les 4 enfants d'un
       bloc partent en ordre Bayer 2x2 avec une phase tirée par parent :
       une trame 8x8 à chaque niveau aligne les survivants en diagonales */
    float ordre = k == 0
      ? bayer8(mod(bloc, 8.0))
      : fract(bayer2(bloc) + floor(4.0 * hache(floor(0.5 * bloc) + float(k) * 7.1)) * 0.25);
    float local = clamp(uProgres * float(NIVEAUX) - float(k), 0.0, 1.0);
    float seuil = local * (k == NIVEAUX - 1 ? 1.0 : PART);
    bool actif = local > 0.0 && local < 1.0;
    if (actif && reste > 0.0 && ordre >= seuil && ordre < seuil + FRANGE) {
      float elu = hache(bloc + float(k) * 31.7);
      float teinte = hache(bloc.yx + float(k) * 13.3);
      if (elu > 0.7) couleur = teinte < 0.5 ? vec3(0.3, 0.95, 1.0) : vec3(1.0, 0.35, 0.75);
    }
    reste *= step(seuil, ordre);
    taille *= 0.5;
  }
  gl_FragColor = vec4(couleur, reste);
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
  /* temps relatif au début du voile : clock.elapsedTime croît sans borne
     et, au bout d'une heure, le bruit perd sa précision en float 32 bits */
  const interne = useRef({ phase: "repos" as Phase, imagesPeintes: 0, temps: 0 })
  const couvertRef = useRef(couvert)
  couvertRef.current = couvert
  const attenduRef = useRef(relaisAttendu)
  attenduRef.current = relaisAttendu

  useFrame(({ gl }, delta) => {
    const mesh = quad.current
    if (!mesh) return
    const i = interne.current
    const u = materiau.uniforms
    if (couvertRef.current) {
      if (i.phase !== "couvre") {
        i.imagesPeintes = 0
        i.temps = 0
      } else if (mesh.visible) i.imagesPeintes++
      i.phase = "couvre"
      u.uProgres.value = 0
    } else if (i.phase === "couvre" || (i.phase === "repos" && attenduRef.current)) {
      if (i.phase === "repos") {
        i.imagesPeintes = 0
        i.temps = 0
      } else if (mesh.visible) i.imagesPeintes++
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
    i.temps += delta
    u.uTemps.value = i.temps
    u.uResolution.value.set(gl.domElement.width, gl.domElement.height)
  })

  return (
    <mesh ref={quad} visible={false} frustumCulled={false} renderOrder={1e6} material={materiau}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}
