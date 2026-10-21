"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

/* La nappe de nuages raymarchée (FBM 2D + tranche verticale, 14 pas), portée
   du prototype #21 (route jetable, supprimée au #35). Elle
   sert de sol OU de plafond (sens), et la couverture seuille le FBM pour
   tailler des masses distinctes avec du ciel entre elles, au lieu d'un tapis.
   Pas de garde prefers-reduced-motion ici : `capable.ts` interdit le montage
   de l'expérience entière sous reduce.

   LE VENT (#47) : la nappe dérive et sa houle la déforme. Pour le payer,
   elle a maigri : 14 pas au lieu de 20, chacun plus opaque (même épaisseur
   optique totale), et la sonde solaire lit un FBM à 2 octaves au lieu de 4. */

/* la dérive (unités de bruit par seconde) : ~2,7 m/s sur le banc du bas,
   le vent d'ouest pousse vers la caméra ; la houle tourne lentement */
const DERIVE = "vec2(0.09, 0.035)"
const HOULE_VITESSE = 0.06
const HOULE_AMPLEUR = 0.55
/* le raymarch du #21 marchait en 20 pas ; l'opacité par pas est
   recomposée pour garder la même épaisseur optique totale en 14 */
const PAS_ORIGINE = 20
const PAS = 14

/* LE BRUIT TEXTURÉ (#47) : le réseau de hash du value noise est tiré une
   fois dans une texture 256², partagée par les deux nappes. Un bruit coûte
   une lecture filtrée au lieu de 4 sin. Le tirage est à graine fixe : la
   même graine redonne les mêmes masses ; changer la graine redistribue
   les masses, c'est le bouton du cadrage. La période (256 unités, ~8 km au
   plancher) est loin au-delà du fondu */
const GRAINE_BRUIT = 47
const COTE_BRUIT = 256
/* moyenne des octaves 3 et 4 (billow) omises par fbmGrossier, mesurée sur
   1e5 points par un script node : 0,1875 x E[1 - |2u - 1|] = 0,1875 x 0,642 */
const MOYENNE_OCTAVES_OMISES = 0.12

/* LA LUMIÈRE (#47) : Beer-Lambert vers le soleil, effet poudre, phase
   Henyey-Greenstein à deux lobes. Les boutons à caler à l'œil : */
const EXTINCTION = 3.0 // atténuation de la lumière à travers la sonde
const POUDRE = 5.0 // vitesse à laquelle une frange fine se « remplit »
const POUDRE_PART = 0.6 // 0 : pas de poudre, 1 : poudre pleine
const LOBE_AVANT = 0.6 // g du lobe avant (liseré argenté du contre-jour)
const LOBE_ARRIERE = -0.25 // g du lobe arrière (rétrodiffusion)
const PART_AVANT = 0.7
/* bornes : la phase vers le soleil monte à ~7, le plafond vu de dessous
   brûlerait ; au-dessus de 1, l'éclat dépasse un peu la crête (ACES) */
const PHASE_MIN = 0.75
const PHASE_MAX = 1.6
const ECLAT_MAX = 1.3

/* LE FONDU vers l'horizon (mètres) : au-delà de FONDU_FIN l'alpha est nul,
   le fragment sort avant le raymarch */
const FONDU_DEBUT = 90
const FONDU_FIN = 300

/* LE CISAILLEMENT (#47) : le haut de la nappe file plus vite que le bas,
   les masses se déforment au lieu de glisser d'un bloc. Vitesse à t = 0
   (unités de bruit par seconde au sommet), puis oscillation bornée de
   cette période (s) : amplitude = vitesse x période / 2π, ~0,36 unité */
const CISAILLEMENT = "vec2(0.03, 0.012)"
const CISAILLEMENT_PERIODE = 70

const flottant = (n: number) => n.toFixed(4)

/* Mulberry32 : un PRNG à graine, pour que le tirage soit rejouable */
function tirageAGraine(graine: number) {
  let a = graine
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function texturerBruit() {
  const tirage = tirageAGraine(GRAINE_BRUIT)
  const valeurs = new Uint8Array(COTE_BRUIT * COTE_BRUIT)
  for (let i = 0; i < valeurs.length; i++) valeurs[i] = Math.floor(tirage() * 256)
  const texture = new THREE.DataTexture(valeurs, COTE_BRUIT, COTE_BRUIT, THREE.RedFormat, THREE.UnsignedByteType)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.minFilter = texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}
const bruitTexture = texturerBruit()

/* le décalage vertical de chaque nappe, en mètres : la nouvelle chute
   (#56) descend la mer de nuages avec la voiture, puis monte le plafond.
   Un uniforme et une matrice : aucun programme ne se recompile */
export const decalageNuages = { sol: 0, plafond: 0 }

/* LES TRAÎNÉES (#56, lot 9) : quand la voiture tombe vite, le bruit des
   nappes s'étire (`etirement`, 0 : intact) et glisse de `defile` mètres
   le long de l'axe de visée horizontal de la caméra : à l'écran, les
   masses filent vers le bas en traînées. Deux uniformes : rien ne se
   recompile, et à 0 l'image est celle de toujours */
export const fileNuages = { etirement: 0, defile: 0 }
const visee = new THREE.Vector3()

export default function MerDeNuages({
  soleil,
  crete = "#ffce8f",
  ombre = "#8a5878",
  loin = "#ff8c42",
  sommet = -3.2,
  fond = -7.5,
  sens = "sol",
  couverture = 0.0,
  echelle = 0.055,
}: {
  soleil: THREE.Vector3
  crete?: string
  ombre?: string
  loin?: string
  /* sommet = la face tournée vers la voiture, fond = la face opposée */
  sommet?: number
  fond?: number
  sens?: "sol" | "plafond"
  couverture?: number
  echelle?: number
}) {
  const materiau = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTemps: { value: 0 },
          uSoleil: { value: soleil },
          uCrete: { value: new THREE.Color(crete) },
          uOmbre: { value: new THREE.Color(ombre) },
          uLoin: { value: new THREE.Color(loin) },
          uSommet: { value: sommet },
          uFond: { value: fond },
          uSens: { value: sens === "sol" ? 1 : -1 },
          uCouverture: { value: couverture },
          uEchelle: { value: echelle },
          uAxeFile: { value: new THREE.Vector2(0, -1) },
          uEtirement: { value: 0 },
          uDefile: { value: 0 },
          uBruit: { value: bruitTexture },
        },
        vertexShader: /* glsl */ `
          varying vec3 vMonde;
          void main() {
            vec4 m = modelMatrix * vec4(position, 1.0);
            vMonde = m.xyz;
            gl_Position = projectionMatrix * viewMatrix * m;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTemps; uniform vec3 uSoleil;
          uniform vec3 uCrete; uniform vec3 uOmbre; uniform vec3 uLoin;
          uniform float uSommet; uniform float uFond;
          uniform float uSens; uniform float uCouverture; uniform float uEchelle;
          uniform vec2 uAxeFile; uniform float uEtirement; uniform float uDefile;
          uniform sampler2D uBruit;
          varying vec3 vMonde;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          /* value noise par la technique d'iq : le filtrage bilinéaire
             du GPU interpole les 4 voisins, on lui passe la fraction déjà
             lissée. mod garde la précision loin de l'origine et pour les
             coordonnées négatives, + 0,5 vise le centre du texel ;
             textureLod et pas texture : pas de dérivées sous le discard */
          float bruit(vec2 p) {
            vec2 i = mod(floor(p), ${COTE_BRUIT}.0), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return textureLod(uBruit, (i + u + 0.5) / ${COTE_BRUIT}.0, 0.0).r;
          }
          /* 4 octaves : le 5e coûtait ~20 % du raymarch pour un détail
             que le dither noie, fluidité d'abord (gate #21). Les octaves
             3 et 4 sont « gonflées » (billow) : des bords en choux-fleurs */
          float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            for (int k = 0; k < 4; k++) {
              float o = bruit(p);
              v += a * (k < 2 ? o : 1.0 - abs(2.0 * o - 1.0));
              p = p * 2.03 + vec2(17.0, 31.0);
              a *= 0.5;
            }
            return v;
          }
          /* fbm sans ses octaves 3 et 4, remplacées par leur moyenne :
             sans elle, la sonde solaire dériverait par rapport à fbm */
          float fbmGrossier(vec2 p) {
            return 0.5 * bruit(p) + 0.25 * bruit(p * 2.03 + vec2(17.0, 31.0)) + ${flottant(MOYENNE_OCTAVES_OMISES)};
          }
          /* Henyey-Greenstein, normalisée à 1 pour une diffusion isotrope */
          float hg(float cosT, float g) {
            return (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * cosT, 1.5);
          }
          /* le vent : calculé UNE fois par fragment, au point d'entrée sur
             la nappe, puis appliqué à tous les pas. La tranche traversée
             par un rayon est courte devant une masse, l'erreur ne se voit
             pas et le vent ne coûte que 2 bruits par pixel. */
          vec2 gVent;
          /* le cisaillement du sommet, calculé une fois par fragment ;
             chaque pas en prend la part de son altitude */
          vec2 gCisaillement;
          /* l'épaisseur pour un FBM donné : seuillée par la couverture (des
             masses, pas un tapis), niveau interpolé entre fond et sommet */
          float epaisseur(float n, vec3 p) {
            n = smoothstep(uCouverture, 1.0, n);
            float niveau = mix(uFond, uSommet, n);
            return uSens > 0.0
              ? smoothstep(p.y, p.y + 1.2, niveau)
              : smoothstep(niveau - 1.2, niveau, p.y);
          }
          /* le point de bruit lu : comprimé le long de l'axe de fuite
             (autour de la caméra) et glissé, les traînées */
          vec2 file(vec2 xz) {
            float le_long = dot(xz - cameraPosition.xz, uAxeFile);
            return xz - uAxeFile * (le_long * uEtirement / (1.0 + uEtirement) - uDefile);
          }
          /* le point de bruit d'un point du monde : traînées, vent, et
             cisaillement selon l'altitude dans la nappe (0 en bas, 1 en
             haut, quel que soit le sens) */
          vec2 lu(vec3 p) {
            float h = clamp((p.y - min(uFond, uSommet)) / abs(uSommet - uFond), 0.0, 1.0);
            return file(p.xz) * uEchelle + gVent + gCisaillement * h;
          }
          float densite(vec3 p) {
            return epaisseur(fbm(lu(p)), p);
          }
          /* la sonde solaire n'a pas besoin du détail fin */
          float densiteGrossiere(vec3 p) {
            return epaisseur(fbmGrossier(lu(p)), p);
          }
          void main() {
            /* au-delà du fondu l'alpha est nul : rien à marcher */
            float dist = length(vMonde.xz - cameraPosition.xz);
            if (dist >= ${flottant(FONDU_FIN)}) discard;
            vec2 q = vMonde.xz * uEchelle * 0.6;
            gVent = uTemps * ${DERIVE} + ${HOULE_AMPLEUR.toFixed(2)} * (vec2(
              bruit(q + uTemps * ${HOULE_VITESSE.toFixed(3)}),
              bruit(q + vec2(5.2, 1.3) - uTemps * ${HOULE_VITESSE.toFixed(3)})
            ) - 0.5);
            /* sin borne le décalage : nul à t = 0, jamais plus de
               l'amplitude, la forme en colonne ne se dissout pas */
            float pulsation = ${flottant((2 * Math.PI) / CISAILLEMENT_PERIODE)};
            gCisaillement = ${CISAILLEMENT} * sin(uTemps * pulsation) / pulsation;
            vec3 dir = normalize(vMonde - cameraPosition);
            if (dir.y * uSens > -0.005) discard;
            vec3 p = vMonde;
            float pas = abs(uSommet - uFond) / ${PAS}.0 / max(abs(dir.y), 0.12);
            pas = min(pas, 6.0);
            /* départ dithéré : casse les stries en escalier du raymarch */
            p += dir * pas * hash(gl_FragCoord.xy);
            vec3 soleil = normalize(uSoleil);
            float cosT = dot(dir, soleil);
            float phase = clamp(
              mix(hg(cosT, ${flottant(LOBE_ARRIERE)}), hg(cosT, ${flottant(LOBE_AVANT)}), ${flottant(PART_AVANT)}),
              ${flottant(PHASE_MIN)}, ${flottant(PHASE_MAX)}
            );
            float transmis = 1.0;
            vec3 acc = vec3(0.0);
            for (int k = 0; k < ${PAS}; k++) {
              float d = densite(p);
              if (d > 0.01) {
                float versSoleil = densiteGrossiere(p + soleil * 1.6);
                /* Beer-Lambert : la lumière qui traverse la sonde ; la
                   poudre assombrit les franges trop fines pour diffuser */
                float lumiere = exp(-versSoleil * ${flottant(EXTINCTION)});
                float poudre = 1.0 - exp(-d * ${flottant(POUDRE)});
                float eclat = lumiere * mix(1.0, poudre, ${flottant(POUDRE_PART)}) * phase;
                vec3 c = mix(uOmbre, uCrete, clamp(eclat * 1.3 + 0.12, 0.0, ${flottant(ECLAT_MAX)}));
                float a = 1.0 - pow(1.0 - d * 0.38, ${(PAS_ORIGINE / PAS).toFixed(3)});
                acc += c * a * transmis;
                transmis *= 1.0 - a;
                if (transmis < 0.03) break;
              }
              p += dir * pas;
              if ((p.y - uFond) * uSens < 0.0) break;
            }
            float alpha = 1.0 - transmis;
            /* fondu vers l'horizon : la nappe se dissout dans le ciel */
            float brume = smoothstep(${flottant(FONDU_DEBUT)}, ${flottant(FONDU_FIN)}, dist);
            vec3 c = mix(acc / max(alpha, 0.001), uLoin, brume);
            /* mort complète avant le bord du plan : aucune couture visible */
            alpha *= 1.0 - brume;
            gl_FragColor = vec4(c, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [soleil, crete, ombre, loin, sommet, fond, sens, couverture, echelle],
  )
  const ref = useRef(materiau)
  ref.current = materiau
  const nappe = useRef<THREE.Mesh>(null)
  useFrame((etat) => {
    const { uniforms } = ref.current
    const decalage = decalageNuages[sens]
    uniforms.uTemps.value = etat.clock.elapsedTime
    etat.camera.getWorldDirection(visee)
    if (Math.hypot(visee.x, visee.z) > 1e-3) uniforms.uAxeFile.value.set(visee.x, visee.z).normalize()
    uniforms.uEtirement.value = fileNuages.etirement
    uniforms.uDefile.value = fileNuages.defile
    uniforms.uSommet.value = sommet + decalage
    uniforms.uFond.value = fond + decalage
    if (nappe.current) nappe.current.position.y = sommet + decalage
  })
  return (
    <mesh
      ref={nappe}
      material={materiau}
      rotation-x={sens === "sol" ? -Math.PI / 2 : Math.PI / 2}
      position={[0, sommet, 0]}
    >
      {/* 900 : le fondu (mort à 300) s'éteint loin avant le bord du plan */}
      <planeGeometry args={[900, 900]} />
    </mesh>
  )
}
