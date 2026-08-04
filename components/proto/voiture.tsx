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
   se nomment 000.webp à 119.webp, fond transparent. Le composant n'en
   demande QU'UN ARC — voir POSE plus bas — et c'est l'absence de son
   image centrale, pas de la 000, qui le fait renoncer : il ne rend
   alors RIEN et la page est intacte.

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

   La spirale fait 1,5 tour, et le LACET de la voiture la suit — mais en
   quadrature, sur un cosinus là où l'orbite est un sinus. Les deux
   mouvements ne se referment donc jamais au même moment : c'est ce
   décalage qui se lit comme un tourbillon plutôt que comme un manège.
   ───────────────────────────────────────────────────────────────── */
const TOURS = 1.5        // tours de la spirale
const DEPART = -105      // angle de sortie du centre, en degrés
const RAYON_X = 30       // amplitude horizontale, en vw
const RAYON_Y = 22       // amplitude verticale, en vh

/* ── LA POSE ──────────────────────────────────────────────────────
   La séquence fait un tour complet — 120 images à 3° — mais on n'en
   garde qu'un ARC. Balayer les 360° faisait passer la voiture par le
   profil puis par l'arrière : deux vues où une silhouette noire sur
   fond clair n'est plus qu'une tache. L'image 000 elle-même, celle du
   haut de page, est une plongée de face : le toit, et rien d'autre.

   L'image 105 (azimut 315°) est LA vue : trois-quarts avant, pare-chocs
   avant en bas à gauche, arrière en haut à droite, capot, flanc et les
   quatre roues lisibles d'un coup. Tout le trajet se joue autour d'elle,
   à ±18° de lacet — assez pour que le volume tourne, pas assez pour
   qu'il quitte la pose.

   L'ASSIETTE S'AJOUTE À LA POSE, elle ne la remplace pas. L'image 105
   porte déjà sa diagonale naturelle, environ 28° sur l'horizontale ;
   ces -12° la redressent à 40°, plus franche. C'est pour ça que le
   chiffre est petit là où il valait -65 du temps où l'image de départ
   était une plongée de face qu'il fallait coucher entièrement.

   CES DEUX CHIFFRES SONT SOLIDAIRES DU RENDU. Changer l'élévation ou le
   `--depart` dans tools/voiture décale l'azimut de chaque image : POSE
   ne désignerait plus la même vue, et l'assiette ne compenserait plus
   la bonne diagonale. Les revoir ensemble, jamais l'un sans l'autre.
   ───────────────────────────────────────────────────────────────── */
const POSE = 105         // image du trois-quarts avant, nez en bas à gauche
const ARC = 6            // débattement de part et d'autre, soit ±18° de lacet
const INCLINAISON = -12  // assiette : redresse la diagonale de l'image à 40°
const BALANCE = 8        // amplitude du balancement autour de l'assiette

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

  /* Rayon en puissance 0,75 : la voiture quitte le centre franchement
     puis ralentit son éloignement. Une progression linéaire la ferait
     décoller mollement du nom, ce qui se lit comme une dérive et non
     comme un objet aspiré. */
  const orbite = (v: number) => ((DEPART + v * TOURS * 360) * Math.PI) / 180
  const ampleur = (v: number) => Math.pow(v, 0.75)

  /* Le lacet OSCILLE autour de la pose au lieu de défiler. Une rampe
     linéaire, même courte, arrive forcément à un bout de l'arc et y
     reste : la voiture finirait son trajet de travers. Un cosinus la
     ramène, et comme l'orbite et l'assiette sont des sinus, il tombe en
     quadrature des deux — le volume tourne quand la trajectoire est
     droite, et l'inverse. C'est ce qui empêche le tout de battre la
     mesure. */
  const index = useTransform(p, (v) => Math.round(POSE + Math.cos(orbite(v)) * ARC))

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
     garde pas tous — 120 bitmaps de 1000×1000 feraient 480 Mo — mais les
     13 de l'arc, soit une cinquantaine de mégaoctets.

     C'est l'arc qui a supprimé la fenêtre glissante d'avant, et non
     l'inverse : une fenêtre n'avait de sens que pour une tête de lecture
     qui AVANCE. Le lacet, lui, oscille — elle aurait refermé derrière
     elle des images que le cosinus redemandait à l'aller suivant. */
  const bitmaps = useRef<(ImageBitmap | undefined)[]>([])
  const enVol = useRef<Set<number>>(new Set())
  // Les 404 avérés. Sans cette liste, `chargeArc` rejoué à chaque
  // changement d'index redemandait indéfiniment un fichier qui n'existe
  // pas — onze requêtes pour la même image sur une seule descente.
  const perdues = useRef<Set<number>>(new Set())
  const vivant = useRef(true)

  const charge = (i: number) => {
    if (bitmaps.current[i] || enVol.current.has(i) || perdues.current.has(i)) return
    enVol.current.add(i)
    fetch(SRC(i))
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("404"))))
      .then(createImageBitmap)
      .then((bm) => {
        if (!vivant.current) return bm.close()
        bitmaps.current[i] = bm
        /* DEUX RAISONS DE REPEINDRE, et il faut les deux.

           L'image voulue vient d'arriver — sans ça elle n'apparaîtrait
           qu'au prochain mouvement de scroll.

           Ou bien RIEN n'a encore été peint. Comparer au seul index voulu
           suspendait le premier pixel à une image précise : si celle-là
           traînait ou tombait, les douze autres pouvaient être décodées
           sans que la toile s'allume. Et en mouvement réduit, où l'on ne
           repeint plus jamais ensuite, la voiture ne serait tout
           simplement jamais apparue. On repeint donc l'index VOULU, pas
           `i` : `disponible` sait se rabattre sur la voisine qui vient
           d'arriver, et c'est ce qui rend vraie la promesse d'afficher
           dès la première image reçue. */
        if (i === index.get() || dernier.current < 0) peindre(index.get(), true)
      })
      /* SEUL UN 404 VEUT DIRE « SÉQUENCE ABSENTE ». Couper sur n'importe
         quelle erreur confondait le contrat d'intégration avec un
         hoquet réseau : une seule requête tombée sur treize démontait
         toute la voiture, alors que les douze autres étaient là. Une
         erreur de transport se retente ; un fichier qui n'existe pas,
         jamais — d'où la mise au rebut, qui borne du même coup les
         reprises de `chargeArc`. */
      .catch((e) => {
        if (!vivant.current) return
        if (e?.message !== "404") return
        perdues.current.add(i)
        if (i === POSE) setAbsente(true)
      })
      .finally(() => enVol.current.delete(i))
  }

  /* L'arc entier, d'un coup : 13 images d'une trentaine de kilooctets.
     C'est MOINS que ce que demandait la fenêtre glissante — elle en
     amorçait 26 au chargement, dont la moitié pour des vues de profil
     et d'arrière qu'on ne montre plus.

     `charge` ignorant ce qu'il a déjà, rappeler ceci ne coûte rien et
     RATTRAPE : une requête tombée sur une coupure réseau laisserait
     sinon un trou définitif dans l'arc, là où l'ancienne fenêtre,
     rejouée à chaque image, réessayait sans qu'on y pense. */
  const chargeArc = () => { for (let i = POSE - ARC; i <= POSE + ARC; i++) charge(i) }

  useEffect(() => {
    if (!SEQUENCE_LIVREE) {
      setAbsente(true)
      return
    }
    vivant.current = true
    /* On affiche dès la première image arrivée, sans attendre les
       autres : `disponible` sait se rabattre, et rien ne justifie de
       retenir le premier pixel jusqu'à la treizième requête. */
    setPretes(true)
    chargeArc()
    return () => {
      vivant.current = false
      for (const bm of bitmaps.current) bm?.close()
      bitmaps.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Repli : tant que l'arc se remplit, on affiche le bitmap le plus
     proche PAR L'ÉCART DE LACET, des deux côtés. L'ancienne version ne
     reculait que dans un sens, ce qui se tenait quand la tête de lecture
     avançait toujours ; avec un arc, reculer depuis 99 sortait de la
     plage et faisait tout le tour pour retomber sur 111 — l'image la
     plus éloignée, un quart de tour de travers.
     Ce repli est ce qui garantit qu'un scroll rapide SAUTE des images au
     lieu d'attendre : la rotation se fait grossière une seconde, elle ne
     bloque jamais le fil principal. */
  const disponible = (i: number) => {
    for (let d = 0; d <= ARC * 2; d++) {
      const bm = bitmaps.current[i - d] ?? bitmaps.current[i + d]
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
    /* `prefers-reduced-motion` fige la voiture sur la pose de départ :
       une rotation liée au scroll est exactement le genre de mouvement
       que ce réglage demande d'éteindre. Le volume reste, il ne tourne
       plus — et le tourbillon ne démarre pas non plus. Ce que ce réglage
       laisse voir est désormais un trois-quarts avant et non la plongée
       de face de l'image 000 : la vue figée est enfin lisible. */
    if (reduit || !pretes) return
    peindre(i)
    chargeArc()
  })

  if (absente) return null

  return (
    <motion.div
      className="voiture"
      aria-hidden="true"
      data-fige={reduit ? "1" : undefined}
      /* EN MOUVEMENT RÉDUIT, LE FONDU RESTE — c'est la seule chose qui
         range la voiture. Ne rien lier du tout, comme on le faisait,
         débranche `fondu` avec le reste : la toile est `position: fixed`,
         donc la voiture se retrouvait épinglée au centre de l'écran,
         pleine taille et pleine opacité, sur les onze mille pixels de
         page qui suivent le tracé — par-dessus huit feuilles de texte.
         Le réglage censé calmer la page la rendait plus envahissante que
         l'animation qu'il éteint.

         Un fondu n'est pas un mouvement : rien ne se déplace, ne tourne
         ni ne change de taille, et c'est précisément le remplacement que
         les recommandations d'accessibilité proposent à la place d'une
         animation. Ce qu'on retire ici, c'est l'orbite, le balancement
         et le zoom. L'assiette, elle, est une valeur FIXE — une pose,
         pas une animation — donc elle reste, sinon la voiture retombe
         sur la diagonale brute de l'image. */
      style={reduit ? { rotate: INCLINAISON, opacity: fondu } : { x, y, scale: echelle, rotate: vrille, opacity: fondu }}
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
