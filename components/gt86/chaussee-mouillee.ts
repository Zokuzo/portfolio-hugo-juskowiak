import * as THREE from "three"

/* L'ASPHALTE MOUILLÉ (#47). La chaussée prend une carte de flaques
   procédurale (rugosité basse, albédo assombri, normale aplanie dans
   l'eau) : les vrais spots et les néons de la voiture s'y mirent par le
   GGX, sans lumière de plus. Les luminaires qui ne sont que des sprites,
   et les feux tricolores, y laissent un reflet PEINT, une traînée verticale
   calculée en espace monde depuis leur image miroir (aucun render target).
   Branché par rue.tsx. */

const CHAUSSEES = ["CityGen_Streets", "CityGen_lanes_secondary_color"]

/* les luminaires dont le reflet peint a un sens : ceux de la rue N-S de la
   mise en scène et du carrefour en croix, que rien ne cache depuis la
   chaussée. Au-delà, un reflet traverserait un immeuble. */
const PORTEE_REFLET = { rueNS: 10, carrefour: 6, carrefourLong: 50, nordMax: 10 }
/* taille fixe des tableaux d'uniformes ; seuls les REFLETS_ACTIFS plus
   proches dans le cadre sont peints, les autres s'effacent en fondu */
const REFLETS_MAX = 24
const REFLETS_ACTIFS = 12

/* ---- les boutons à caler à l'œil ---------------------------------------- */

/* le poids d'une traînée : plein jusqu'à DISTANCE_PLEINE (m, caméra vers
   image miroir), puis en 1/d², sans descendre sous POIDS_LOIN */
const DISTANCE_PLEINE = 14
const POIDS_LOIN = 0.15
/* marge du test de cadre, en fraction de la distance : une traînée déborde
   bien au-dessus de son image miroir */
const MARGE_CADRE = 0.35
/* durée du fondu d'apparition et de disparition d'une traînée (s) */
const FONDU_S = 0.25
/* étirement (rad) : l'asphalte rugueux étale l'image en longue colonne,
   la flaque, presque miroir, la rend courte et nette */
const TRAINEE = { largeurAsphalte: 0.01, largeurFlaque: 0.005, hauteurAsphalte: 0.16, hauteurFlaque: 0.022 }
/* éclat des traînées : asphalte humide, puis flaque */
const ECLAT_TRAINEE = { asphalte: 0.08, flaque: 1.4 }
const TEINTE_SODIUM = new THREE.Color().setRGB(1.0, 0.72, 0.42)
/* la carte de flaques : seuil de l'eau, début de l'auréole humide, et
   largeur minimale du bord (le reste vient de fwidth, contre le crénelage) */
const FLAQUE = { seuil: 0.56, seuilHumide: 0.44, bordMin: 0.004 }
/* rugosité et albédo : asphalte humide, auréole, eau */
const RUGOSITE = { asphalte: 0.6, aureole: 0.35, eau: 0.03 }
const ALBEDO = { asphalte: 0.62, aureole: 0.42, eau: 0.28 }
/* frémissement de l'eau : un souffle, pas de la pluie (aucune goutte ne
   tombe). Ampleur = inclinaison de la normale (rad), échelle en 1/m. */
const FREMISSEMENT = { ampleur: 0.006, vitesse: 0.25, echelle: 3.0 }

/* ---- les sources de reflet peint --------------------------------------- */

export type SourceDeReflet = {
  position: THREE.Vector3
  teinte: THREE.Color
  /* 0 éteint la source (et l'écarte des emplacements) */
  eclat: number
  /* état interne du tri : distance à la caméra, fondu en cours */
  distance: number
  presence: number
}

export function sourceDeReflet(position: THREE.Vector3, teinte: THREE.Color, eclat: number): SourceDeReflet {
  return { position, teinte, eclat, distance: Infinity, presence: 0 }
}

function lampesMirees(lampes: [number, number, number, boolean?][]) {
  const { rueNS, carrefour, carrefourLong, nordMax } = PORTEE_REFLET
  return lampes
    .filter(([x, z]) => z < nordMax && (Math.abs(x) < rueNS || (Math.abs(z) < carrefour && Math.abs(x) < carrefourLong)))
    .map(([x, z, y]) => sourceDeReflet(new THREE.Vector3(x, y, z), TEINTE_SODIUM, 1))
}

const glsl = (x: number) => x.toFixed(4)

const MOUILLE_COMMUN = /* glsl */ `#include <common>
varying vec3 vPosMonde;
uniform vec4 uRefletDir[${REFLETS_MAX}];
uniform vec3 uRefletTeinte[${REFLETS_MAX}];
uniform int uNbReflets;
uniform float uTemps;
float hachageFlaque(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bruitFlaque(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hachageFlaque(i), hachageFlaque(i + vec2(1.0, 0.0)), u.x),
             mix(hachageFlaque(i + vec2(0.0, 1.0)), hachageFlaque(i + vec2(1.0, 1.0)), u.x), u.y);
}`

/* la carte de flaques : 2 octaves en espace monde, flaques de 2 à 5 m (la
   3e octave, un détail d'1 m noyé par le seuil, paie le frémissement).
   Bord en fwidth : net de près, lissé au loin, sans grouillement. Une
   auréole humide plus large que l'eau assombrit l'asphalte vers la flaque. */
const MOUILLE_RUGOSITE = /* glsl */ `#include <roughnessmap_fragment>
float flaque;
vec2 fremi = vec2(0.0);
{
  vec2 q = vPosMonde.xz * 0.22;
  float n = 0.625 * bruitFlaque(q) + 0.375 * bruitFlaque(q * 2.1 + 7.3);
  float bord = fwidth(n) + ${glsl(FLAQUE.bordMin)};
  flaque = smoothstep(${glsl(FLAQUE.seuil)} - bord, ${glsl(FLAQUE.seuil)} + bord, n);
  float humide = smoothstep(${glsl(FLAQUE.seuilHumide)}, ${glsl(FLAQUE.seuil)}, n);
  if (flaque > 0.0) {
    vec2 p = vPosMonde.xz * ${glsl(FREMISSEMENT.echelle)};
    float t = uTemps * ${glsl(FREMISSEMENT.vitesse)};
    fremi = (vec2(bruitFlaque(p + t), bruitFlaque(p.yx - t)) - 0.5) * ${glsl(FREMISSEMENT.ampleur)};
  }
  roughnessFactor = mix(roughnessFactor * mix(${glsl(RUGOSITE.asphalte)}, ${glsl(RUGOSITE.aureole)}, humide), ${glsl(RUGOSITE.eau)}, flaque);
  diffuseColor.rgb *= mix(mix(${glsl(ALBEDO.asphalte)}, ${glsl(ALBEDO.aureole)}, humide), ${glsl(ALBEDO.eau)}, flaque);
}`

/* la normale est en espace vue : le frémissement, tiré en espace monde,
   y passe par viewMatrix */
const MOUILLE_NORMALE = /* glsl */ `#include <normal_fragment_maps>
normal = normalize(mix(normal, nonPerturbedNormal + (viewMatrix * vec4(fremi.x, 0.0, fremi.y, 0.0)).xyz, flaque));`

/* la bande chaude peinte au zénith de envNuit (rue.tsx) n'est pas une
   image : rugosité 0,04, elle se mirait en nappe uniforme dans les flaques
   proches. L'eau ne garde que les reflets vrais (spots, néons) et peints. */
const MOUILLE_ENVIRONNEMENT = /* glsl */ `#include <lights_fragment_maps>
radiance *= mix(1.0, 0.15, flaque);`

/* le reflet peint de chaque source : l'écart angulaire entre le rayon vers
   ce pixel et le rayon vers l'image miroir (y → -y), étiré en hauteur et
   serré en largeur. Tout ce qui ne dépend que de la caméra (direction du
   miroir, inverse de sa longueur horizontale, teinte × poids) arrive
   précalculé par le CPU ; le côté se déduit de la direction (cross avec
   l'axe Y = (-z, 0, x)). Le frémissement dévie le rayon (2 × l'inclinaison
   de la normale) : les images tremblent avec l'eau. Fresnel de Schlick :
   rasant, l'eau devient miroir. */
const MOUILLE_REFLETS = /* glsl */ `#include <emissivemap_fragment>
{
  vec3 versPixel = normalize(vPosMonde - cameraPosition);
  float fresnel = 0.04 + 0.96 * pow(1.0 - abs(versPixel.y), 5.0);
  versPixel = normalize(versPixel + vec3(fremi.x, 0.0, fremi.y) * 2.0 * flaque);
  float surLargeur = 1.0 / mix(${glsl(TRAINEE.largeurAsphalte)}, ${glsl(TRAINEE.largeurFlaque)}, flaque);
  float surHauteur = 1.0 / mix(${glsl(TRAINEE.hauteurAsphalte)}, ${glsl(TRAINEE.hauteurFlaque)}, flaque);
  vec3 trainees = vec3(0.0);
  for (int i = 0; i < ${REFLETS_MAX}; i++) {
    if (i >= uNbReflets) break;
    vec3 versMiroir = uRefletDir[i].xyz;
    vec3 cote = vec3(-versMiroir.z, 0.0, versMiroir.x) * uRefletDir[i].w;
    vec3 ecart = versPixel - versMiroir;
    float lat = dot(ecart, cote) * surLargeur;
    float vert = dot(ecart, cross(cote, versMiroir)) * surHauteur;
    trainees += uRefletTeinte[i] * exp(-lat * lat - vert * vert);
  }
  totalEmissiveRadiance += trainees * fresnel * mix(${glsl(ECLAT_TRAINEE.asphalte)}, ${glsl(ECLAT_TRAINEE.flaque)}, flaque);
}`

/* ---- le précalcul CPU, une fois par image ------------------------------ */

type RefletsPartages = {
  sources: SourceDeReflet[]
  directions: { value: THREE.Vector4[] }
  teintes: { value: THREE.Vector3[] }
  nombre: { value: number }
  temps: { value: number }
  derniereImage: number
  derniereCamera: THREE.Camera | null
  instant: number
}

/* partagés par les deux chaussées ; les tableaux sont à REFLETS_MAX
   (taille fixe des uniformes), uNbReflets borne la boucle */
let refletsPartages: RefletsPartages | null = null

function refletsDe(lampes: [number, number, number, boolean?][], autres: SourceDeReflet[]) {
  if (!refletsPartages) {
    refletsPartages = {
      sources: [...lampesMirees(lampes), ...autres],
      directions: { value: Array.from({ length: REFLETS_MAX }, () => new THREE.Vector4()) },
      teintes: { value: Array.from({ length: REFLETS_MAX }, () => new THREE.Vector3()) },
      nombre: { value: 0 },
      temps: { value: 0 },
      derniereImage: -1,
      derniereCamera: null,
      instant: performance.now(),
    }
  }
  return refletsPartages
}

/* brouillons : zéro allocation par image */
const oeil = new THREE.Vector3()
const miroir = new THREE.Vector3()
const versMiroir = new THREE.Vector3()
const cadre = new THREE.Frustum()
const projection = new THREE.Matrix4()
const englobe = new THREE.Sphere()
const PRESENCE_MIN = 0.001
const PERIODE_TEMPS_S = 1000

const parDistance = (a: SourceDeReflet, b: SourceDeReflet) => a.distance - b.distance

/* appelé par onBeforeRender : la caméra de CETTE image, sans retard d'une
   frame (un useFrame passerait avant le rail de caméra de Rue) */
function peintLesReflets(reflets: RefletsPartages, renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
  const image = renderer.info.render.frame
  if (image === reflets.derniereImage && camera === reflets.derniereCamera) return
  reflets.derniereImage = image
  reflets.derniereCamera = camera

  const maintenant = performance.now()
  const dt = Math.min((maintenant - reflets.instant) / 1000, 0.1)
  reflets.instant = maintenant
  reflets.temps.value = (maintenant / 1000) % PERIODE_TEMPS_S

  trieDansLeCadre(reflets.sources, camera)
  reflets.nombre.value = remplisLesEmplacements(reflets, dt)
}

/* distance de chaque image miroir, Infinity si éteinte ou hors cadre ;
   tri en place, les plus proches d'abord */
function trieDansLeCadre(sources: SourceDeReflet[], camera: THREE.Camera) {
  oeil.setFromMatrixPosition(camera.matrixWorld)
  cadre.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse))
  for (const s of sources) {
    miroir.set(s.position.x, -s.position.y, s.position.z)
    const distance = miroir.distanceTo(oeil)
    const dansLeCadre = s.eclat > 0 && cadre.intersectsSphere(englobe.set(miroir, distance * MARGE_CADRE))
    s.distance = dansLeCadre ? distance : Infinity
  }
  sources.sort(parDistance)
}

function remplisLesEmplacements(reflets: RefletsPartages, dt: number) {
  const pas = dt / FONDU_S
  let n = 0
  reflets.sources.forEach((s, rang) => {
    const voulue = rang < REFLETS_ACTIFS && s.distance < Infinity
    s.presence = THREE.MathUtils.clamp(s.presence + (voulue ? pas : -pas), 0, 1)
    if (s.presence < PRESENCE_MIN || n >= REFLETS_MAX || s.distance === Infinity) return
    miroir.set(s.position.x, -s.position.y, s.position.z)
    versMiroir.subVectors(miroir, oeil).normalize()
    const surHorizontal = 1 / Math.max(Math.hypot(versMiroir.x, versMiroir.z), 1e-4)
    reflets.directions.value[n].set(versMiroir.x, versMiroir.y, versMiroir.z, surHorizontal)
    const poids = THREE.MathUtils.clamp((DISTANCE_PLEINE / s.distance) ** 2, POIDS_LOIN, 1) * s.presence * s.eclat
    reflets.teintes.value[n].set(s.teinte.r * poids, s.teinte.g * poids, s.teinte.b * poids)
    n++
  })
  return n
}

/* branchement de rue.tsx (Decor), appelé pour chaque matériau du décor ;
   `autres` : les sources animées (feux tricolores), tenues à jour par rue.tsx */
export function mouilleLaChaussee(mat: THREE.MeshStandardMaterial, lampes: [number, number, number, boolean?][], autres: SourceDeReflet[] = []) {
  if (!CHAUSSEES.includes(mat.name)) return
  const reflets = refletsDe(lampes, autres)
  mat.onBeforeRender = (renderer, _scene, camera) => peintLesReflets(reflets, renderer, camera)
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRefletDir = reflets.directions
    shader.uniforms.uRefletTeinte = reflets.teintes
    shader.uniforms.uNbReflets = reflets.nombre
    shader.uniforms.uTemps = reflets.temps
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPosMonde;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPosMonde = (modelMatrix * vec4(position, 1.0)).xyz;")
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", MOUILLE_COMMUN)
      .replace("#include <roughnessmap_fragment>", MOUILLE_RUGOSITE)
      .replace("#include <normal_fragment_maps>", MOUILLE_NORMALE)
      .replace("#include <emissivemap_fragment>", MOUILLE_REFLETS)
      .replace("#include <lights_fragment_maps>", MOUILLE_ENVIRONNEMENT)
  }
  mat.needsUpdate = true
}
