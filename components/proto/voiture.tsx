"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"

/* ==================================================================
   VOITURE — séquence d'images pilotée par le scroll, en rotation sur
   son axe. Elle ne se déplace PAS : elle tourne sur place, au centre.

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
   se nomment 000.webp à 159.webp, fond transparent. La rotation en
   parcourt la TOTALITÉ ; c'est l'absence de l'image de départ qui fait
   renoncer le composant : il ne rend alors RIEN et la page est intacte.

   BUDGET : aucun mix-blend-mode, aucun filter, aucun masque. Un seul
   canvas, redessiné uniquement quand l'index change. Le reste ne touche
   jamais au canvas : seuls `transform` et `opacity` bougent, les deux
   seules propriétés que le compositeur anime sans repeindre.
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

   ELLE NE SE DÉPLACE PLUS. La spirale d'avant — orbite en vw/vh,
   éloignement en puissance, balancement accroché à l'angle d'orbite —
   est retirée : il ne reste qu'une rotation sur l'axe, au centre. Une
   chose qui tourne sur place se lit d'un coup d'œil ; la même chose
   qui tourne EN se déplaçant demande à l'œil de suivre deux mouvements
   à la fois, et c'est ce qui donnait l'impression de tourbillon.
   ───────────────────────────────────────────────────────────────── */
const NB = 160           // images de la séquence, une tous les 2,25°
const TOURS = 1          // tours complets sur l'axe pendant le trajet

/* ── LA POSE DE DÉPART ────────────────────────────────────────────
   Le tour est COMPLET, mais il ne commence pas n'importe où. L'image
   000 est une plongée de face — le toit, et rien d'autre : ouvrir la
   page dessus, c'est ouvrir sur la plus mauvaise vue de la séquence.

   L'image 140 (azimut 315°) est la meilleure : trois-quarts avant,
   pare-chocs avant en bas à gauche, arrière en haut à droite, capot,
   flanc et les quatre roues lisibles d'un coup. Le tour part donc
   d'elle et, faisant exactement 360°, y revient à la fin.

   L'ASSIETTE est désormais FIXE. Elle valait -65° du temps où l'image
   de départ était une plongée qu'il fallait coucher, puis elle
   balançait autour de l'orbite ; sans orbite, il n'y a plus rien à
   balancer. Ces -12° redressent la diagonale naturelle de l'image de
   départ, environ 28° sur l'horizontale, à 40° plus franche.

   LE CHANGEMENT DE VOITURE N'A PAS DÉPLACÉ CETTE DIAGONALE. Mesurée sur
   la silhouette de la pose, l'écart avec celle de la séquence qu'elle
   remplace vaut 0,4 à 0,6° selon la méthode de mesure (axe PCA ou
   diagonale de boîte) — sous ce que l'œil distingue sur une image en
   retrait. L'assiette se reporte donc telle quelle : rien à réajuster.

   CES CHIFFRES SONT SOLIDAIRES DU RENDU. Changer l'élévation ou le
   `--depart` dans tools/voiture décale l'azimut de chaque image : POSE
   ne désignerait plus la même vue, et l'assiette ne compenserait plus
   la bonne diagonale. Les revoir ensemble, jamais l'un sans l'autre.
   ───────────────────────────────────────────────────────────────── */
const POSE = 140         // image de départ : le trois-quarts avant
const INCLINAISON = -12  // assiette fixe : redresse la diagonale à 40°

/* ── LE RESSORT ───────────────────────────────────────────────────
   La progression n'attaque plus la rotation en direct. Un scroll n'est
   pas lisse : molette crantée, trackpad par à-coups, barre d'espace
   qui saute un écran. Branché tel quel, chaque secousse devenait une
   secousse de la voiture, et sur une séquence d'images le défaut est
   deux fois visible puisque le volume saute d'un cran de 2,25° d'un coup.

   Le ressort absorbe ça : il POURSUIT la valeur du scroll au lieu de
   l'épouser.

   RÉGLÉ AU CRITIQUE, ζ = 1,04. C'est le seul point du domaine où la
   valeur rejoint sa cible au plus vite SANS la dépasser — donc sans
   rebond, ce qu'une voiture qui tourne ne pardonnerait pas. Le premier
   jet était à ζ = 2,32 : sur-amorti d'un facteur deux, il mettait deux
   secondes et demie à converger et la rotation traînait visiblement
   derrière le doigt. Ici ω = 22 rad/s donne environ 175 ms.

   ζ = amortissement / (2·√(raideur × masse)). Les trois nombres se
   tiennent : en changer un seul déplace l'amortissement réel. */
const RESSORT = { stiffness: 170, damping: 16, mass: 0.35, restDelta: 0.0002 }

/* ── LE FLOTTEMENT ────────────────────────────────────────────────
   À 160 images pour un tour, le cran vaut 2,25° : il ne se voit plus au
   scroll, mais il reste visible à l'arrêt, quand plus rien ne bouge et
   que l'œil s'installe sur une image fixe. Le remède n'est pas un
   compositing plus malin — le fondu enchaîné a été essayé et rejeté au
   côte-à-côte du 2026-08-10, il dédoublait les arêtes au lieu de les
   fondre. C'est de donner à l'œil autre chose à suivre : l'objet respire
   sur place, indépendamment du scroll.

   IL Y AVAIT DÉJÀ UNE FLOTTAISON, EN CSS, et elle ne suffisait pas :
   jugée trop discrète à l'œil, elle portait en plus une échelle qui
   pulse. Elle est retirée de planche.css ; deux couches qui flottent
   auraient cumulé leurs tangages, et c'est exactement la danse que la
   suppression de l'orbite avait chassée. Une seule couche, ici.

   DEUX SINUS D'ASSIETTE ET UNE DÉRIVE VERTICALE, RIEN D'AUTRE — ni
   translation horizontale ni échelle : une respiration, pas une danse.
   La ligne de crête est celle du tourbillon : tout mouvement ajouté à
   une chose qui tourne déjà se paie en lisibilité.

   LES PÉRIODES N'ONT PAS DE RAPPORT SIMPLE ENTRE ELLES (7,1 / 11,3 /
   9,7 s) et c'est le point : le motif combiné ne se referme pas devant
   l'œil. Les toucher raccourcirait la boucle, donc la rendrait
   reconnaissable — et accélérer une respiration la rend haletante là où
   l'amplifier la rend ample. Ces amplitudes-ci sont le DOUBLE de la base
   prototypée, calibrées à l'œil par Hugo au même côte-à-côte. */
const FLOT = {
  a1: 2.4, p1: 7.1,   // assiette : degrés, secondes
  a2: 1.0, p2: 11.3,
  dy: 8, p3: 9.7,     // dérive verticale : pixels, secondes
}
const TAU = Math.PI * 2

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

  /* Tout ce qui suit part du ressort, PAS de `p` : mélanger les deux
     désynchroniserait la rotation et le fondu, et on verrait la voiture
     finir de tourner après s'être effacée.

     Déclaré AVANT l'effet de mesure, qui en a besoin — voir `saut`. */
  const lisse = useSpring(p, RESSORT)

  useEffect(() => {
    const avance = () => {
      const f = fin.current
      // Sans ce garde, une division par zéro donnerait NaN — que ni
      // Math.min ni Math.max ne rattrapent. On écrirait `translateX(NaNvw)`
      // et la voiture disparaîtrait sans la moindre erreur en console.
      p.set(f > 0 ? Math.min(1, Math.max(0, window.scrollY / f)) : 0)
    }
    /* `saut` DIT AU RESSORT DE NE PAS ANIMER, et c'est indispensable.

       `useSpring` naît à `p.get()` pendant le RENDU, où `p` vaut encore 0
       puisqu'il n'est renseigné qu'ici, dans un effet qui s'exécute après.
       Sans ce saut, toute page ouverte ailleurs qu'en haut — un F5 à
       mi-page, un retour depuis une fiche projet, un lien profond — faisait
       rattraper au ressort la totalité de la course : mesuré, l'opacité
       partait de 1 et restait au-dessus de 0,05 pendant 1,5 s, la voiture
       traversait 223° toute seule alors que le scroll ne bougeait pas d'un
       pixel, et `veille` téléchargeait 128 images pour un objet que
       personne ne devait voir. C'est très exactement le défaut que le
       commentaire de `p` ci-dessus dit vouloir empêcher, restitué au
       ralenti et donc bien plus visible.

       Les mesures de MISE EN PAGE sautent — montage, polices, pin du
       tracé, redimensionnement : rien n'a bougé pour le visiteur, il n'y a
       donc rien à animer. Seul le SCROLL passe par le ressort. */
    const mesure = (saut = false) => {
      const t = document.querySelector("#trace")
      if (!t) return
      const bas = t.getBoundingClientRect().bottom + window.scrollY
      // La course s'achève quand le bas du tracé atteint le bas de
      // l'écran : la voiture a fini son trajet pile quand la feuille
      // suivante entre, pas trois écrans plus tôt.
      fin.current = Math.max(1, bas - window.innerHeight)
      avance()
      if (saut) lisse.jump(p.get())
    }
    const remesure = () => mesure(true)
    mesure(true)
    const stop = scrollY.on("change", avance)
    window.addEventListener("resize", remesure)
    // Les polices et le pin du tracé décalent la mise en page après
    // coup ; une seconde mesure évite une course figée trop courte.
    const t = setTimeout(remesure, 1200)
    return () => {
      stop()
      window.removeEventListener("resize", remesure)
      clearTimeout(t)
    }
  }, [p, lisse, scrollY])

  /* Un tour complet, à partir de la pose de départ.

     LE MODULO N'EST PAS DÉFENSIF, IL EST STRUCTUREL : partir de POSE=140
     et ajouter jusqu'à 160 donne 300, très au-delà de la dernière image.
     Boucler est ici le comportement JUSTE, l'image 159 et l'image 000
     étant voisines de 2,25°. Le second `+ NB` couvre le cas d'une valeur
     négative, que le `%` de JavaScript propagerait — le ressort étant
     sur-amorti il ne dépasse pas, mais un index négatif rendrait
     `undefined` en silence et figerait la toile, ce qui ne vaut pas
     l'économie d'une addition. */
  const index = useTransform(lisse, (v) => ((POSE + Math.round(v * TOURS * NB)) % NB + NB) % NB)

  /* Elle s'efface tard et par paliers : au-dessus de la nomenclature et
     du tracé, deux feuilles denses, elle doit rester lisible SANS
     concurrencer le texte qu'elle traverse.

     Ces valeurs sont un FACTEUR, pas une opacité finale : la toile porte
     déjà son dosage de 0,72 en CSS et les deux se multiplient. Partir de
     0,72 ici sortirait la voiture à 0,52 dans le hero, soit un tiers plus
     pâle qu'avant sans que personne l'ait demandé. */
  const fondu = useTransform(lisse, [0, 0.5, 0.9, 1], [1, 0.64, 0.42, 0])

  /* ── LA RESPIRATION ───────────────────────────────────────────────
     ELLE COÛTE UNE FRACTION DE FRAME, SUR LE FIL PRINCIPAL, et c'est le
     prix consenti au gate du 2026-08-10. La flottaison CSS qu'elle
     remplace tournait, elle, sur le compositeur — gratuite pour le fil
     principal — mais elle était jugée trop discrète et son amplitude ne
     se règle pas sans réécrire des keyframes. Ici : deux sinus, deux
     `.set()` et un pas de rendu de framer par frame. La PEINTURE reste
     absorbée par le compositeur, puisqu'on n'écrit que du transform et
     qu'on ne touche jamais à la toile — mais le CALCUL, lui, est bien
     sur le fil principal. Le budget est déjà tendu (témoin du
     2026-08-06 : p90 7,40 ms, 6,13 % de frames au-dessus de 8,3 ms) :
     c'est la Tâche 8 qui dit si ce prix passe, pas ce commentaire.

     ELLE NE TOURNE QUE QUAND LA VOITURE SE VOIT. `fondu` tombe à 0 au
     bout du tracé, et il reste huit feuilles de page après : y faire
     battre une boucle à 60 fps pour un élément à `opacity: 0`, ce serait
     payer le seul coût qu'on vient d'admettre là où il n'achète rien.
     On s'abonne donc au fondu — il ne bouge que pendant le scroll, la
     bascule est gratuite le reste du temps.

     Elle ne dépend PAS du scroll pour autant : une chose qui flotte
     flotte aussi quand on ne touche à rien, et c'est tout l'intérêt ici
     — entre deux images, l'œil garde du mouvement à suivre.

     UN rAF NU PLUTÔT QUE `useAnimationFrame` : le hook s'enregistre
     toujours, donc la boucle de frames tournerait même quand il n'y a
     rien à faire, pour n'y faire qu'un retour anticipé. Ici, mouvement
     réduit ou voiture effacée = rien ne tourne du tout.

     LE TRANSFORM RESTE SUR L'ÉLÉMENT QUI PORTE DÉJÀ L'ASSIETTE.
     L'envelopper dans une couche de plus insérerait un ancêtre
     transformé entre la page et un `position: fixed` — le piège que
     page.tsx signale pour le décor comme pour la voiture. */
  const assiette = useMotionValue(INCLINAISON)
  const derive = useMotionValue(0)

  useEffect(() => {
    // `absente` peut passer à true tard (404 après montage) : sans elle ici
    // ET dans les dépendances, la boucle déjà lancée continuerait de battre
    // pour un composant qui ne rend plus rien.
    if (reduit || absente) return
    let id = 0
    const battre = (t: number) => {
      const s = t / 1000
      assiette.set(INCLINAISON + FLOT.a1 * Math.sin((s * TAU) / FLOT.p1) + FLOT.a2 * Math.sin((s * TAU) / FLOT.p2))
      derive.set(FLOT.dy * Math.sin((s * TAU) / FLOT.p3))
      id = requestAnimationFrame(battre)
    }
    // Les deux gardes sur `id` rendent marche/arrêt IDEMPOTENTS : le
    // fondu émet plusieurs valeurs non nulles d'affilée pendant le
    // scroll, et sans elles chacune lancerait une boucle de plus.
    const marche = () => { if (!id) id = requestAnimationFrame(battre) }
    const arret = () => {
      if (!id) return
      cancelAnimationFrame(id)
      id = 0
      // Reposer l'assiette : sans ça, un arrêt en plein sinus laisserait
      // la pose figée de travers pour le retour en arrière.
      assiette.set(INCLINAISON)
      derive.set(0)
    }
    if (fondu.get() > 0) marche()
    const stop = fondu.on("change", (o) => (o > 0 ? marche() : arret()))
    return () => {
      stop()
      arret()
    }
  }, [reduit, absente, assiette, derive, fondu])

  /* ── POURQUOI DES ImageBitmap ET PAS DES BALISES IMAGE ────────────
     MESURÉ, sur build de production, trois essais alternés dans le même
     onglet : avec des HTMLImageElement, la traversée montait à 16,6ms de
     p90 et 9,5% de frames au-dessus du budget, contre 3,2ms et 0% sans
     la voiture. Le coupable n'est ni la mémoire ni le réseau : c'est le
     DÉCODAGE. Un `drawImage` sur une image dont le bitmap n'est pas déjà
     dans le cache du moteur déclenche un décodage SYNCHRONE sur le fil
     principal. Sur 378 frames de traversée, les 120 changements d'index
     tombent une frame sur trois (mesuré sur la séquence de 120 images
     d'alors) — donc un décodage une frame sur trois.

     `decoding = "async"` ne protège pas : cet attribut concerne le rendu
     d'une balise image par le moteur, pas un appel manuel à drawImage.

     `createImageBitmap` décode HORS du fil principal et rend un objet
     déjà décodé : le drawImage qui suit ne peut plus bloquer. On ne les
     garde pas tous — 160 bitmaps de 1000×1000 feraient 640 Mo — mais une
     FENÊTRE glissante autour de la tête de lecture, refermée derrière.

     La fenêtre revient AVEC le tour complet, et c'est la même raison qui
     l'avait fait partir : elle suppose une tête de lecture qui AVANCE.
     Un lacet qui oscille sur un arc étroit refermait derrière lui des
     images redemandées à l'aller suivant, et charger l'arc entier coûtait
     moins. Une rotation de 360° reparcourt les 160 : les garder toutes
     ferait plus d'un demi-gigaoctet, la fenêtre redevient le bon outil. */
  const bitmaps = useRef<(ImageBitmap | undefined)[]>([])
  const enVol = useRef<Set<number>>(new Set())
  /* LES IMAGES ABANDONNÉES, et le compte des échecs qui y mène.

     `veille` est rejouée à chaque changement d'index. Sans mémoire des
     échecs, elle redemandait sans fin ce qui ne répond pas : mesuré,
     1 422 requêtes sur une descente au lieu de 120 quand le réseau tombe
     (mesuré à 120 images).
     Mais abandonner au PREMIER échec est l'excès inverse — un hoquet
     serveur condamnait l'image pour toute la session. D'où un compte :
     trois essais, puis on laisse tomber cette image-là. */
  const perdues = useRef<Set<number>>(new Set())
  const echecs = useRef<Map<number, number>>(new Map())
  const ESSAIS = 3
  const vivant = useRef(true)

  const charge = (i: number) => {
    if (bitmaps.current[i] || enVol.current.has(i) || perdues.current.has(i)) return
    enVol.current.add(i)
    fetch(SRC(i))
      /* On distingue « le fichier n'existe pas » de « ça n'a pas marché ».
         Rejeter tout statut non-ok sous le même nom faisait traiter un 503
         — un redémarrage de serveur, une purge de CDN — comme un 404 : la
         voiture disparaissait définitivement de la page sur un incident
         d'une seconde. */
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(r.status === 404 || r.status === 410 ? "404" : "hoquet " + r.status))))
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
         quelle erreur confondait le contrat d'intégration avec un hoquet
         réseau : une seule requête tombée démontait toute la voiture,
         alors que les autres étaient là.

         Un fichier qui n'existe pas est abandonné tout de suite et lui
         seul déclenche le renoncement. Tout le reste — transport, 5xx,
         décodage — a droit à trois essais, après quoi on abandonne cette
         image sans toucher au composant : `disponible` se rabattra sur sa
         voisine, ce qui est très préférable à une voiture qui s'évapore. */
      .catch((e) => {
        if (!vivant.current) return
        if (e?.message === "404") {
          perdues.current.add(i)
          if (i === POSE) setAbsente(true)
          return
        }
        const n = (echecs.current.get(i) ?? 0) + 1
        echecs.current.set(i, n)
        if (n >= ESSAIS) perdues.current.add(i)
      })
      .finally(() => enVol.current.delete(i))
  }

  /* La fenêtre est asymétrique : large DEVANT, courte derrière. On
     descend la page bien plus souvent qu'on ne la remonte, et une image
     déjà dépassée ne resservira qu'en cas de retour en arrière.

     CES DEUX NOMBRES SONT DES IMAGES, PAS DES DEGRÉS, et la séquence a
     changé de densité sous eux : à 120 images ils couvraient 60° devant,
     ils n'en couvrent plus que 45. Réduire la PORTÉE d'un quart aurait
     pu laisser le scroll rapide dépasser la fenêtre et montrer un trou —
     c'est ce qu'on a regardé au côte-à-côte du 2026-08-10, en conditions
     réelles : aucun pop-in. Ils restent donc à 20 et 5. Les monter à
     27/7 pour rendre les 60° coûterait un tiers d'empreinte mémoire en
     plus pour un défaut qui ne se produit pas.

     Rejouée à chaque changement d'index, elle RATTRAPE au passage : une
     requête tombée sur une coupure réseau serait sinon un trou définitif
     dans le tour. Les 404 avérés, eux, ne sont pas retentés — c'est
     `perdues` qui borne la reprise. */
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
    /* On affiche dès la première image arrivée, sans attendre les
       autres : à 160 images, exiger la séquence complète imposerait
       ~4,2 Mo avant le premier pixel.

       La veille part de l'index VOULU et non de zéro : le tour commence
       à la pose de départ, et amorcer la fenêtre ailleurs téléchargerait
       vingt images qu'on ne montrera qu'à la fin du trajet.

       EN MOUVEMENT RÉDUIT, une seule. La voiture ne tournera jamais, donc
       les vingt-cinq voisines de la fenêtre ne serviront à rien : à 26 Ko
       de moyenne mesurée sur la séquence, les télécharger serait faire
       payer six cent soixante kilooctets à quelqu'un qui a précisément
       demandé qu'on lui en fasse moins. */
    setPretes(true)
    if (reduit) charge(index.get())
    else veille(index.get())
    return () => {
      vivant.current = false
      for (const bm of bitmaps.current) bm?.close()
      bitmaps.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Repli : tant que la fenêtre se remplit, on affiche le bitmap le plus
     proche plutôt que rien. Le parcours est modulo, comme la rotation
     qu'il sert : chercher autour de l'image 002 doit pouvoir trouver la
     159, sa voisine de 2,25°, et non sortir de la plage.

     ON CHERCHE DES DEUX CÔTÉS, et l'écart croît d'un cran à la fois. Ne
     reculer que d'un seul côté paraissait suffisant — les images arrivent
     dans l'ordre du tour, la précédente est presque toujours là. C'est
     vrai EN DESCENTE seulement. À la remontée, le sens de marche n'a plus
     que les cinq images d'ARRIERE devant lui ; passé ces cinq, le parcours
     arrière faisait le tour complet et retombait sur le bord AVANT de la
     fenêtre, à vingt images de là. Mesuré : 12 peintures sur 130 à 60° de
     la bonne (mesuré à 120 images), alternant avec les bonnes — un
     stroboscope, pas un repli grossier. En descente, zéro sur 109.

     Le `??` garde la préférence pour l'arrière à écart égal, ce qui reste
     le bon pari ; il BORNE simplement l'erreur à l'image réellement la
     plus proche au lieu de la laisser courir sur toute la fenêtre. */
  const disponible = (i: number) => {
    for (let d = 0; d < NB; d++) {
      const bm = bitmaps.current[(i - d + NB) % NB] ?? bitmaps.current[(i + d) % NB]
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
       plus. Ce que ce réglage laisse voir est le trois-quarts avant et
       non la plongée de face de l'image 000 : la vue figée est lisible.

       On sort AVANT la veille, et c'est voulu : ne jamais tourner, c'est
       ne jamais avoir besoin des 159 autres images. Une seule requête au
       montage au lieu de cent soixante. */
    if (reduit || !pretes) return
    peindre(i)
    veille(i)
  })

  if (absente) return null

  return (
    <motion.div
      className="voiture"
      aria-hidden="true"
      /* PLUS DE BRANCHE SUR `reduit` ICI, et c'est la suppression de la
         spirale qui l'a rendue inutile. Il ne reste que trois valeurs :
         l'assiette, la dérive et le fondu. En mouvement réduit la boucle
         de respiration ne démarre pas, donc `assiette` garde INCLINAISON
         et `derive` reste à zéro : la même expression rend exactement la
         pose fixe d'avant, sans avoir à l'écrire deux fois. Toute la
         différence tient au canvas et à cette boucle-là.

         LE FONDU DOIT RESTER LIÉ DANS LES DEUX CAS. La version d'avant
         ne liait rien du tout en mouvement réduit, ce qui débranchait
         `fondu` avec le reste : la toile étant `position: fixed`, la
         voiture restait épinglée au centre de l'écran, pleine taille et
         pleine opacité, sur les onze mille pixels de page qui suivent le
         tracé — par-dessus huit feuilles de texte. Le réglage censé
         calmer la page la rendait plus envahissante que l'animation
         qu'il éteint.

         Accessoirement, un objet de style unique supprime l'écart
         d'hydratation : le serveur et le client écrivent la même chose,
         quel que soit le réglage du visiteur. Un `data-fige` traînait ici,
         qui promettait d'exposer l'état au CSS ; il ne l'a jamais fait —
         `matchMedia` n'existant pas au rendu serveur, l'attribut était
         toujours absent du HTML et React ne réconcilie pas les attributs
         à l'hydratation. Aucune règle ne le ciblait, il est parti. Les
         deux MotionValues de la respiration ne rouvrent pas cet écart :
         elles naissent à INCLINAISON et 0, serveur comme client, et la
         boucle ne les touche qu'après le montage.

         LA RESPIRATION ÉCRIT ICI, sur l'élément qui porte déjà l'assiette
         et le fondu, et pas dans une couche à elle. Framer compose les
         MotionValues d'un même `style` en un seul transform : il n'y a
         rien à se disputer, et surtout pas un ancêtre transformé de plus
         devant un `position: fixed`. */
      style={{ rotate: assiette, y: derive, opacity: fondu }}
    >
      <canvas ref={canvas} className="voiture-toile" />
    </motion.div>
  )
}
