"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion"

/* ==================================================================
   VOITURE — séquence d'images pilotée par le scroll.

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
   se nomment 000.webp à 059.webp, fond transparent. Si la première
   manque, le composant ne rend RIEN et la page est intacte : on peut
   donc livrer l'intégration avant les images.

   BUDGET : aucun mix-blend-mode, aucun filter, aucun masque. Un seul
   canvas, redessiné uniquement quand l'index change — c'est le point
   qui rend ce dispositif gratuit plutôt que ruineux.
   ================================================================== */

/* ── INTERRUPTEUR ─────────────────────────────────────────────────
   Passer à `true` le jour où /public/voiture/000.webp … 059.webp
   existent. C'est la SEULE chose à changer.

   Pourquoi un booléen plutôt qu'une sonde réseau : sans les images, un
   test de présence laisse une requête en échec dans la console de
   chaque visiteur. Une erreur 404 permanente en production pour
   deviner ce qu'on sait déjà, ça ne se paie pas.
   ───────────────────────────────────────────────────────────────── */
const SEQUENCE_LIVREE = false

const NB = 60
const SRC = (i: number) => `/voiture/${String(i).padStart(3, "0")}.webp`

/* Le canvas est plafonné à 1,5× le CSS et non au devicePixelRatio réel :
   sur un écran 3×, une toile de 3000px coûterait trois fois plus de
   remplissage pour un gain invisible derrière un titre. */
const DPR_MAX = 1.5

export function Voiture({ cible }: { cible: React.RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const images = useRef<HTMLImageElement[]>([])
  const dernier = useRef(-1)
  const [pretes, setPretes] = useState(false)
  const [absente, setAbsente] = useState(false)
  const reduit = useReducedMotion()

  const { scrollYProgress } = useScroll({ target: cible, offset: ["start start", "end start"] })
  /* Un tour complet sur la traversée du hero. Au-delà d'un tour, la
     voiture repasserait par la même image et le mouvement se lirait
     comme une boucle, pas comme une rotation. */
  const index = useTransform(scrollYProgress, (v) => Math.min(NB - 1, Math.max(0, Math.round(v * (NB - 1)))))

  /* PROFONDEUR. Le corps de plaque s'enfonce de 180px et se fond à
     0,15 ; la voiture est DERRIÈRE, donc elle dérive moins vite — 70px
     — comme n'importe quel plan éloigné du modèle de caméra. Sans ce
     décalage elle serait collée au nom et le relief disparaîtrait.
     Elle s'efface plus TARD que le texte : ce qui est loin sort du
     cadre en dernier. */
  const derive = useTransform(scrollYProgress, [0, 1], [0, -70])
  const fondu = useTransform(scrollYProgress, [0, 0.72, 1], [1, 0.7, 0])

  /* Chargement. La première image sert de sonde : si elle échoue, la
     séquence n'a pas encore été livrée et on s'efface proprement. */
  useEffect(() => {
    if (!SEQUENCE_LIVREE) {
      setAbsente(true)
      return
    }
    let vivant = true
    const sonde = new Image()
    sonde.onerror = () => vivant && setAbsente(true)
    sonde.onload = () => {
      if (!vivant) return
      images.current[0] = sonde
      let restant = NB - 1
      if (restant === 0) return setPretes(true)
      for (let i = 1; i < NB; i++) {
        const im = new Image()
        im.onload = im.onerror = () => {
          if (!vivant) return
          images.current[i] = im
          if (--restant === 0) setPretes(true)
        }
        im.src = SRC(i)
      }
    }
    sonde.src = SRC(0)
    return () => {
      vivant = false
    }
  }, [])

  /* Dessin. Séparé du chargement : il doit pouvoir se relancer au
     redimensionnement sans retélécharger quoi que ce soit. */
  useEffect(() => {
    if (!pretes) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext("2d", { alpha: true })
    if (!ctx) return

    const dessine = (i: number) => {
      const im = images.current[i]
      if (!im || !im.width) return
      const { width: w, height: h } = c
      ctx.clearRect(0, 0, w, h)
      // `contain` : la voiture ne doit jamais être rognée par le cadre
      const e = Math.min(w / im.width, h / im.height)
      const dw = im.width * e
      const dh = im.height * e
      ctx.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh)
    }

    const cadre = () => {
      const r = c.getBoundingClientRect()
      const d = Math.min(DPR_MAX, window.devicePixelRatio || 1)
      c.width = Math.round(r.width * d)
      c.height = Math.round(r.height * d)
      dernier.current = -1
      dessine(index.get())
      dernier.current = index.get()
    }

    cadre()
    const ro = new ResizeObserver(cadre)
    ro.observe(c)
    return () => ro.disconnect()
  }, [pretes, index])

  /* LE POINT CLÉ DE LA PERFORMANCE : on ne redessine QUE lorsque
     l'index change. Le scroll émet en continu ; sans ce garde, on
     repeindrait la même image des dizaines de fois par seconde. */
  useMotionValueEvent(index as MotionValue<number>, "change", (i) => {
    /* `prefers-reduced-motion` fige la voiture sur sa première image :
       une rotation liée au scroll est exactement le genre de mouvement
       que ce réglage demande d'éteindre. Le volume reste, il ne tourne
       plus. */
    if (reduit) return
    if (!pretes || i === dernier.current) return
    const c = canvas.current
    const ctx = c?.getContext("2d")
    const im = images.current[i]
    if (!c || !ctx || !im || !im.width) return
    dernier.current = i
    const { width: w, height: h } = c
    ctx.clearRect(0, 0, w, h)
    const e = Math.min(w / im.width, h / im.height)
    ctx.drawImage(im, (w - im.width * e) / 2, (h - im.height * e) / 2, im.width * e, im.height * e)
  })

  if (absente) return null

  return (
    <motion.div
      className="voiture"
      aria-hidden="true"
      data-fige={reduit ? "1" : undefined}
      style={reduit ? undefined : { y: derive, opacity: fondu }}
    >
      <canvas ref={canvas} className="voiture-toile" />
    </motion.div>
  )
}
