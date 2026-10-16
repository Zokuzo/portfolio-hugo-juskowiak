import * as THREE from "three"

/* PROTOTYPE JETABLE (#47) : les effets de scène, commutés par
   ?effets=a|b|c sur /. Sans paramètre, rien ne change : les deux
   branchements (mer-de-nuages.tsx, rue.tsx) ne posent aucun
   onBeforeCompile et les shaders restent ceux du dépôt.
   - a : la mer de nuages dérive au vent et se déforme, ET elle maigrit
     pour payer l'effet (14 pas au lieu de 20, sonde solaire à 2
     octaves au lieu de 4) ;
   - b : l'asphalte mouillé. La chaussée prend une carte de flaques
     procédurale (rugosité basse, albédo assombri, normale aplanie dans
     l'eau) : les vrais spots et les néons de la voiture s'y mirent par le
     GGX, sans lumière de plus. Les luminaires qui ne sont que des sprites
     y laissent un reflet PEINT, une traînée verticale calculée en
     espace monde depuis leur image miroir (aucun render target) ;
   - c : a + b.
   Verdict à l'œil de Hugo et au banc, puis seul ce qui gagne rejoint les
   fichiers d'origine et ce fichier disparaît. */

type Effets = { vent: boolean; mouille: boolean }

const VARIANTES: Record<string, Effets> = {
  a: { vent: true, mouille: false },
  b: { vent: false, mouille: true },
  c: { vent: true, mouille: true },
}
const AUCUN: Effets = { vent: false, mouille: false }

function effetsVoulus(): Effets {
  if (typeof window === "undefined") return AUCUN
  return VARIANTES[new URLSearchParams(window.location.search).get("effets") ?? ""] ?? AUCUN
}

/* ---- a : le vent sur la mer de nuages ------------------------------- */

const PAS_ORIGINE = 20
const PAS_AU_VENT = 14

/* La dérive et la déformation sont calculées UNE fois par fragment, au
   point d'entrée sur la nappe, puis appliquées à tous les pas : la tranche
   traversée par un rayon est courte devant la taille d'une masse, l'erreur
   ne se voit pas et le vent ne coûte que 2 bruits par pixel. */
const VENT_GLSL = /* glsl */ `
          vec2 gVent;
          float fbmGrossier(vec2 p) {
            return 0.5 * bruit(p) + 0.25 * bruit(p * 2.03 + vec2(17.0, 31.0)) + 0.094;
          }
          float densiteGrossiere(vec3 p) {
            float n = fbmGrossier(p.xz * uEchelle + gVent);
            n = smoothstep(uCouverture, 1.0, n);
            float niveau = mix(uFond, uSommet, n);
            return uSens > 0.0
              ? smoothstep(p.y, p.y + 1.2, niveau)
              : smoothstep(niveau - 1.2, niveau, p.y);
          }
          float densite(vec3 p) {`

/* la dérive (unités de bruit par seconde) : ~2,7 m/s sur le banc du bas,
   le vent d'ouest pousse vers la caméra ; la houle tourne lentement */
const DERIVE = "vec2(0.09, 0.035)"
const HOULE_VITESSE = 0.06
const HOULE_AMPLEUR = 0.55

const VENT_MAIN = /* glsl */ `void main() {
            vec2 q = vMonde.xz * uEchelle * 0.6;
            gVent = uTemps * ${DERIVE} + ${HOULE_AMPLEUR.toFixed(2)} * (vec2(
              bruit(q + uTemps * ${HOULE_VITESSE.toFixed(3)}),
              bruit(q + vec2(5.2, 1.3) - uTemps * ${HOULE_VITESSE.toFixed(3)})
            ) - 0.5);`

function souffleSurLesNuages(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.fragmentShader = shader.fragmentShader
    .replace("float densite(vec3 p) {", VENT_GLSL)
    .replace("vec2(uTemps * 0.012, uTemps * 0.004)", "gVent")
    .replace("void main() {", VENT_MAIN)
    .replace(`/ ${PAS_ORIGINE}.0 /`, `/ ${PAS_AU_VENT}.0 /`)
    .replace(`k < ${PAS_ORIGINE};`, `k < ${PAS_AU_VENT};`)
    .replace("densite(p + soleil * 1.6)", "densiteGrossiere(p + soleil * 1.6)")
    /* moins de pas, chacun plus opaque : même épaisseur optique totale */
    .replace("float a = d * 0.38;", `float a = 1.0 - pow(1.0 - d * 0.38, ${(PAS_ORIGINE / PAS_AU_VENT).toFixed(3)});`)
}

/* branchement de mer-de-nuages.tsx : sans ?effets=a|c, ne touche à rien */
export function ventSurNuages(materiau: THREE.ShaderMaterial) {
  if (effetsVoulus().vent) materiau.onBeforeCompile = souffleSurLesNuages
}

/* ---- b : l'asphalte mouillé ----------------------------------------- */

const CHAUSSEES = ["CityGen_Streets", "CityGen_lanes_secondary_color"]

/* les luminaires dont le reflet peint a un sens : ceux de la rue N-S de la
   mise en scène et du carrefour en croix, que rien ne cache depuis la
   chaussée. Au-delà, un reflet traverserait un immeuble. */
const PORTEE_REFLET = { rueNS: 10, carrefour: 6, carrefourLong: 50, nordMax: 10 }
const REFLETS_MAX = 24

function lampesMirees(lampes: [number, number, number, boolean?][]) {
  const { rueNS, carrefour, carrefourLong, nordMax } = PORTEE_REFLET
  return lampes
    .filter(([x, z]) => z < nordMax && (Math.abs(x) < rueNS || (Math.abs(z) < carrefour && Math.abs(x) < carrefourLong)))
    .slice(0, REFLETS_MAX)
    .map(([x, z, y]) => new THREE.Vector3(x, y, z))
}

const MOUILLE_COMMUN = /* glsl */ `#include <common>
varying vec3 vPosMonde;
uniform vec3 uReflets[${REFLETS_MAX}];
uniform int uNbReflets;
float hachageFlaque(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bruitFlaque(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hachageFlaque(i), hachageFlaque(i + vec2(1.0, 0.0)), u.x),
             mix(hachageFlaque(i + vec2(0.0, 1.0)), hachageFlaque(i + vec2(1.0, 1.0)), u.x), u.y);
}`

/* la carte de flaques : 3 octaves en espace monde, flaques de 2 à 5 m,
   l'asphalte entre elles reste humide (rugosité divisée, albédo terni) */
const MOUILLE_RUGOSITE = /* glsl */ `#include <roughnessmap_fragment>
float flaque;
{
  vec2 q = vPosMonde.xz * 0.22;
  float n = 0.5 * bruitFlaque(q) + 0.3 * bruitFlaque(q * 2.1 + 7.3) + 0.2 * bruitFlaque(q * 4.3 + 1.7);
  flaque = smoothstep(0.52, 0.6, n);
}
roughnessFactor = mix(roughnessFactor * 0.55, 0.04, flaque);
diffuseColor.rgb *= mix(0.6, 0.3, flaque);`

const MOUILLE_NORMALE = /* glsl */ `#include <normal_fragment_maps>
normal = normalize(mix(normal, nonPerturbedNormal, flaque));`

/* le reflet peint de chaque luminaire : l'écart angulaire entre le rayon
   vers ce pixel et le rayon vers l'image miroir de la tête (y → -y),
   étiré en hauteur et serré en largeur, comme une traînée sur l'eau.
   Fresnel de Schlick : rasant, l'eau devient miroir. */
/* la bande chaude peinte au zénith de envNuit (rue.tsx) n'est pas une
   image : rugosité 0,04, elle se mirait en nappe uniforme dans les flaques
   proches. L'eau ne garde que les reflets vrais (spots, néons) et peints. */
const MOUILLE_ENVIRONNEMENT = /* glsl */ `#include <lights_fragment_maps>
radiance *= mix(1.0, 0.15, flaque);`

const MOUILLE_REFLETS = /* glsl */ `#include <emissivemap_fragment>
{
  vec3 versPixel = normalize(vPosMonde - cameraPosition);
  float fresnel = 0.04 + 0.96 * pow(1.0 - abs(versPixel.y), 5.0);
  float largeur = mix(0.015, 0.006, flaque);
  float hauteur = mix(0.08, 0.035, flaque);
  float trainees = 0.0;
  for (int i = 0; i < ${REFLETS_MAX}; i++) {
    if (i >= uNbReflets) break;
    vec3 miroir = uReflets[i] * vec3(1.0, -1.0, 1.0);
    vec3 versMiroir = normalize(miroir - cameraPosition);
    vec3 cote = normalize(cross(versMiroir, vec3(0.0, 1.0, 0.0)));
    vec3 ecart = versPixel - versMiroir;
    float lat = dot(ecart, cote) / largeur;
    float vert = dot(ecart, cross(cote, versMiroir)) / hauteur;
    trainees += exp(-lat * lat - vert * vert);
  }
  totalEmissiveRadiance += vec3(1.0, 0.72, 0.42) * trainees * fresnel * mix(0.08, 1.4, flaque);
}`

/* partagés par les deux chaussées ; le tableau est complété à REFLETS_MAX
   (taille fixe du uniform), uNbReflets borne la boucle */
let refletsPartages: { positions: { value: THREE.Vector3[] }; nombre: { value: number } } | null = null

function refletsDe(lampes: [number, number, number, boolean?][]) {
  if (!refletsPartages) {
    const positions = lampesMirees(lampes)
    const nombre = positions.length
    while (positions.length < REFLETS_MAX) positions.push(new THREE.Vector3())
    refletsPartages = { positions: { value: positions }, nombre: { value: nombre } }
  }
  return refletsPartages
}

/* branchement de rue.tsx (Decor) : sans ?effets=b|c, ne touche à rien */
export function mouilleLaChaussee(mat: THREE.MeshStandardMaterial, lampes: [number, number, number, boolean?][]) {
  if (!effetsVoulus().mouille || !CHAUSSEES.includes(mat.name)) return
  const reflets = refletsDe(lampes)
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uReflets = reflets.positions
    shader.uniforms.uNbReflets = reflets.nombre
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
