"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion"

/* ==================================================================
   VOITURE — séquence d'images pilotée par le scroll, en tourbillon.

   POURQUOI PAS DE 3D TEMPS RÉEL. Le décor consomme déjà la totalité du
   budget par frame : mesuré en production, p90 16,7ms avec le monde
   contre 8,4ms sans. Un canvas WebGL rendant un matériau réfléchissant
   à chaque frame ajouterait une passe complète et annulerait le travail
   de fluidité. Une séquence d'images ne coûte qu'un DÉCODAGE, une fois,
   et un `drawImage` quand l'index change — pas à chaque frame.

   ET PAS DE VIDÉO : le scrubbing vidéo n'est pas fiable d'un navigateur
   à l'autre, la recherche n'étant pas garantie exacte à l'image près
   (Safari en particulier). Ici la rotation SUIT le scroll, donc il faut
   pouvoir se poser sur une image précise. Des fichiers, pas un flux.

   CONTRAT D'INTÉGRATION — les images vivent dans /public/voiture/ et
   se nomment 000.webp à 119.webp, fond transparent. Si la première
   manque, le composant ne rend RIEN et la page est intacte.

   BUDGET : aucun mix-blend-mode, aucun filter, aucun masque. Un seul
   canvas, redessiné uniquement quand l'index change. Le tourbillon,
   lui, ne touche jamais au canvas : il ne bouge que `transform` et
   `opacity`, les deux seules propriétés que le compositeur anime sans
   repeindre. C'est ce qui rend un trajet de cinq écrans gratuit.
   ================================================================== */

/* ── INTERRUPTEUR ─────────────────────────────────────────────────
   Passer à `false` pour retirer la voiture sans toucher au reste.

   Pourquoi un booléen plutôt qu'une sonde réseau : sans les images, un
   test de présence laisse une requête en échec dans la console de
   chaque visiteur. Une erreur 404 permanente en production pour
   deviner ce qu'on sait déjà, ça ne se paie pas.
   ───────────────────────────────────────────────────────────────── */
const SEQUENCE_LIVREE = true

const NB = 120
const SRC = (i: number) => `/voiture/${String(i).padStart(3, "0")}.webp`

/* Le canvas est plafonné à 1,5× le CSS et non au devicePixelRatio réel :
   sur un écran 3×, une toile de 3000px coûterait trois fois plus de
   remplissage pour un gain invisible derrière un titre. */
const DPR_MAX = 1.5

/* ── LE TRAJET ────────────────────────────────────────────────────
   La voiture traverse les trois premières feuilles — plaque,
   nomenclature, tracé — soit environ cinq hauteurs d'écran.

   On mesure jusqu'au bas de #trace plutôt que d'empiler trois refs :
   ces sections sont SŒURS, et les envelopper pour les mesurer d'un
   bloc insérerait un ancêtre entre la voiture et la page. Or un
   ancêtre est exactement ce qui casse un `position: fixed` dès qu'il
   porte un transform — page.tsx prévient déjà du piège pour le décor.

   La spirale fait 1,5 tour quand la voiture, elle, n'en fait qu'UN sur
   son axe. Deux vitesses différentes : c'est le décalage entre l'orbite
   et la rotation propre qui se lit comme un tourbillon plutôt que comme
   un manège.

   L'ASSIETTE VIENT DE LA RÉFÉRENCE : sur la photo, l'axe de la voiture
   va du nez en bas à gauche à l'aileron en haut à droite, presque
   debout. Et elle ne s'en écarte plus que d'un BALANCEMENT : lui faire
   accumuler deux cents degrés de vrille, comme dans la première
   version, la sortait de cette pose au bout d'un écran et il ne restait
   rien de la référence.

   CE CHIFFRE NE VAUT QUE POUR DES IMAGES RENDUES À 30° D'ÉLÉVATION.
   L'inclinaison à l'écran et l'angle de prise de vue se lisent ensemble :
   la même assiette sur une vue plongeante donne une silhouette ramassée
   qui n'évoque plus rien. Changer l'élévation dans tools/voiture impose
   de revenir revoir cette constante.
   ───────────────────────────────────────────────────────────────── */
const TOURS = 1.5        // tours de la spirale
const DEPART = -105      // angle de sortie du centre, en degrés
const RAYON_X = 30       // amplitude horizontale, en vw
const RAYON_Y = 22       // amplitude verticale, en vh
const INCLINAISON = -65  // assiette, relevée de la photo de référence
const BALANCE = 17       // amplitude du balancement autour de l'assiette

export function Voiture() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const dernier = useRef(-1)
  const fin = useRef(0)
  const [pretes, setPretes] = useState(false)
  const [absente, setAbsente] = useState(false)
  const reduit = useReducedMotion()

  const { scrollY } = useScroll()

  /* La progression est PILOTÉE, pas dérivée. Un `useTransform(scrollY, …)`
     aurait été plus court, mais il ne se recalcule qu'au changement de
     scrollY : une page rechargée à mi-hauteur — le F5 ordinaire — resterait
     coincée à 0 jusqu'au premier geste, et la voiture apparaîtrait d'un
     coup au mauvais endroit. Ici la mesure pousse elle-même la nouvelle
     valeur.

     `fin` reste dans une ref et non dans un état : elle est lue à chaque
     frame de scroll, et un rendu React à chaque redimensionnement ne lui
     apporterait rien. */
  const p = useMotionValue(0)

  useEffect(() => {
    const avance = () => {
      const f = fin.current
      // Sans ce garde, une division par zéro donnerait NaN — que ni
      // Math.min ni Math.max ne rattrapent. On écrirait `translateX(NaNvw)`
      // et la voiture disparaîtrait sans la moindre erreur en console.
      p.set(f > 0 ? Math.min(1, Math.max(0, window.scrollY / f)) : 0)
    }
    const mesure = () => {
      const t = document.querySelector("#trace")
      if (!t) return
      const bas = t.getBoundingClientRect().bottom + window.scrollY
      // La course s'achève quand le bas du tracé atteint le bas de
      // l'écran : la voiture a fini son trajet pile quand la feuille
      // suivante entre, pas trois écrans plus tôt.
      fin.current = Math.max(1, bas - window.innerHeight)
      avance()
    }
    mesure()
    const stop = scrollY.on("change", avance)
    window.addEventListener("resize", mesure)
    // Les polices et le pin du tracé décalent la mise en page après
    // coup ; une seconde mesure évite une course figée trop courte.
    const t = setTimeout(mesure, 1200)
    return () => {
      stop()
      window.removeEventListener("resize", mesure)
      clearTimeout(t)
    }
  }, [p, scrollY])

  const index = useTransform(p, (v) => Math.min(NB - 1, Math.max(0, Math.round(v * (NB - 1)))))

  /* Rayon en puissance 0,75 : la voiture quitte le centre franchement
     puis ralentit son éloignement. Une progression linéaire la ferait
     décoller mollement du nom, ce qui se lit comme une dérive et non
     comme un objet aspiré. */
  const orbite = (v: number) => ((DEPART + v * TOURS * 360) * Math.PI) / 180
  const ampleur = (v: number) => Math.pow(v, 0.75)

  const x = useTransform(p, (v) => `${(ampleur(v) * RAYON_X * Math.cos(orbite(v))).toFixed(2)}vw`)
  const y = useTransform(p, (v) => `${(ampleur(v) * RAYON_Y * Math.sin(orbite(v))).toFixed(2)}vh`)
  const echelle = useTransform(p, [0, 1], [1, 0.5])
  /* Le balancement suit l'orbite plutôt que la progression : la voiture
     se couche vers l'extérieur du virage, comme un objet emporté. Une
     rampe linéaire lui aurait donné une rotation d'horloge, régulière et
     morte — exactement ce qu'on ne veut pas d'une chose qui flotte. */
  const vrille = useTransform(p, (v) => INCLINAISON + Math.sin(orbite(v)) * BALANCE)
  /* Elle s'efface tard et par paliers : au-dessus de la nomenclature et
     du tracé, deux feuilles denses, elle doit rester lisible SANS
     concurrencer le texte qu'elle traverse.

     Ces valeurs sont un FACTEUR, pas une opacité finale : la toile porte
     déjà son dosage de 0,72 en CSS et les deux se multiplient. Partir de
     0,72 ici sortirait la voiture à 0,52 dans le hero, soit un tiers plus
     pâle qu'avant sans que personne l'ait demandé. */
  const fondu = useTransform(p, [0, 0.5, 0.9, 1], [1, 0.64, 0.42, 0])

  /* ── POURQUOI DES ImageBitmap ET PAS DES BALISES IMAGE ────────────
     MESURÉ, sur build de production, trois essais alternés dans le même
     onglet : avec des HTMLImageElement, la traversée montait à 16,6ms de
     p90 et 9,5% de frames au-dessus du budget, contre 3,2ms et 0% sans
     la voiture. Le coupable n'est ni la mémoire ni le réseau : c'est le
     DÉCODAGE. Un `drawImage` sur une image dont le bitmap n'est pas déjà
     dans le cache du moteur déclenche un décodage SYNCHRONE sur le fil
     principal. Sur 378 frames de traversée, les 120 changements d'index
     tombent une frame sur trois — donc un décodage une frame sur trois.

     `decoding = "async"` ne protège pas : cet attribut concerne le rendu
     d'une balise image par le moteur, pas un appel manuel à drawImage.

     `createImageBitmap` décode HORS du fil principal et rend un objet
     déjà décodé : le drawImage qui suit ne peut plus bloquer. On ne les
     garde pas tous — 120 bitmaps de 1000×1000 feraient 480 Mo — mais une
     FENÊTRE glissante autour de la tête de lecture, refermée derrière.
     ───────────────────────────────────────────────────────────────── */
  const bitmaps = useRef<(ImageBitmap | undefined)[]>([])
  const enVol = useRef<Set<number>>(new Set())
  const vivant = useRef(true)

  const charge = (i: number) => {
    if (bitmaps.current[i] || enVol.current.has(i)) return
    enVol.current.add(i)
    fetch(SRC(i))
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("404"))))
      .then(createImageBitmap)
      .then((bm) => {
        if (!vivant.current) return bm.close()
        bitmaps.current[i] = bm
        // L'image attendue vient d'arriver : on redessine, sinon elle
        // n'apparaîtrait qu'au prochain mouvement de scroll.
        if (i === dernier.current) peindre(i, true)
      })
      .catch(() => { if (i === 0 && vivant.current) setAbsente(true) })
      .finally(() => enVol.current.delete(i))
  }

  /* La fenêtre est asymétrique : large DEVANT, courte derrière. On
     descend la page bien plus souvent qu'on ne la remonte, et une image
     déjà dépassée ne resservira qu'en cas de retour en arrière. */
  const AVANT = 20
  const ARRIERE = 5

  const veille = (i: number) => {
    for (let d = -ARRIERE; d <= AVANT; d++) charge((i + d + NB) % NB)
    for (let k = 0; k < NB; k++) {
      const bm = bitmaps.current[k]
      if (!bm) continue
      const devant = (k - i + NB) % NB
      const derriere = (i - k + NB) % NB
      // Fermer explicitement : un ImageBitmap détient de la mémoire
      // graphique que le ramasse-miettes ne rend pas de lui-même.
      if (devant > AVANT && derriere > ARRIERE) { bm.close(); bitmaps.current[k] = undefined }
    }
  }

  useEffect(() => {
    if (!SEQUENCE_LIVREE) {
      setAbsente(true)
      return
    }
    vivant.current = true
    /* On affiche dès la première image, sans attendre les autres : à 120
       images, exiger la séquence complète imposerait 3 Mo avant le
       premier pixel. */
    setPretes(true)
    veille(0)
    return () => {
      vivant.current = false
      for (const bm of bitmaps.current) bm?.close()
      bitmaps.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Repli : tant que la fenêtre se remplit, on affiche le bitmap
     disponible le plus proche EN ARRIÈRE plutôt que rien. Reculer et non
     avancer, parce que les images arrivent dans l'ordre du trajet : la
     précédente est presque toujours là, la suivante presque jamais.
     Ce repli est ce qui garantit qu'un scroll rapide SAUTE des images au
     lieu d'attendre — la rotation se fait grossière une seconde, elle ne
     bloque jamais le fil principal. */
  const disponible = (i: number) => {
    for (let d = 0; d < NB; d++) {
      const bm = bitmaps.current[(i - d + NB) % NB]
      if (bm) return bm
    }
    return null
  }

  const peindre = (i: number, force = false) => {
    const c = canvas.current
    const ctx = c?.getContext("2d", { alpha: true })
    if (!c || !ctx) return
    if (!force && i === dernier.current) return
    const im = disponible(i)
    if (!im) return
    dernier.current = i
    const { width: w, height: h } = c
    ctx.clearRect(0, 0, w, h)
    // `contain` : la voiture ne doit jamais être rognée par le cadre
    const e = Math.min(w / im.width, h / im.height)
    ctx.drawImage(im, (w - im.width * e) / 2, (h - im.height * e) / 2, im.width * e, im.height * e)
  }

  /* Dessin. Séparé du chargement : il doit pouvoir se relancer au
     redimensionnement sans retélécharger quoi que ce soit. */
  useEffect(() => {
    if (!pretes) return
    const c = canvas.current
    if (!c) return
    const cadre = () => {
      const r = c.getBoundingClientRect()
      const d = Math.min(DPR_MAX, window.devicePixelRatio || 1)
      c.width = Math.round(r.width * d)
      c.height = Math.round(r.height * d)
      peindre(index.get(), true)
    }
    cadre()
    const ro = new ResizeObserver(cadre)
    ro.observe(c)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pretes, index])

  /* LE POINT CLÉ DE LA PERFORMANCE : on ne redessine QUE lorsque
     l'index change. Le scroll émet en continu ; sans ce garde, on
     repeindrait la même image des dizaines de fois par seconde. */
  useMotionValueEvent(index as MotionValue<number>, "change", (i) => {
    /* `prefers-reduced-motion` fige la voiture sur sa première image :
       une rotation liée au scroll est exactement le genre de mouvement
       que ce réglage demande d'éteindre. Le volume reste, il ne tourne
       plus — et le tourbillon ne démarre pas non plus. */
    if (reduit || !pretes) return
    peindre(i)
    /* La fenêtre suit la tête de lecture. C'est ce qui rend le décodage
       gratuit : au moment où le scroll atteint une image, elle est déjà
       décodée depuis une vingtaine d'index. Sans cet appel, la fenêtre
       resterait figée sur le départ et on retomberait sur un décodage
       synchrone dès la 21e image. */
    veille(i)
  })

  if (absente) return null

  return (
    <motion.div
      className="voiture"
      aria-hidden="true"
      data-fige={reduit ? "1" : undefined}
      style={reduit ? undefined : { x, y, scale: echelle, rotate: vrille, opacity: fondu }}
    >
      {/* La flottaison est une couche À PART, et en CSS. À part, parce
          que framer réécrit le `transform` du parent à chaque frame de
          scroll et écraserait tout ce qu'on poserait au même endroit. En
          CSS, parce qu'une animation de `translate`/`rotate` en boucle
          tourne sur le compositeur : elle ne coûte rien au fil principal,
          là où une boucle rAF en JavaScript disputerait le budget par
          frame au décor. Et surtout elle ne dépend PAS du scroll — une
          chose qui flotte flotte aussi quand on ne touche à rien. */}
      <div className="voiture-flotte">
        <canvas ref={canvas} className="voiture-toile" />
      </div>
    </motion.div>
  )
}
