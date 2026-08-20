"use client"

import { Component, useEffect, type ReactNode } from "react"
import dynamic from "next/dynamic"
import type { Lang } from "@/components/proto/dict"

/* LA SURCOUCHE — ticket #27 de la carte #15.

   Le serveur rend la version simple COMPLÈTE (celle du mobile) : contenu
   indexable, repli déjà dans le DOM. Ce composant vient se poser par-dessus
   en plein écran, et son seul devoir est de savoir disparaître : quand il
   s'en va, il n'y a rien à restaurer, la page est déjà là dessous.

   CE FICHIER N'IMPORTE NI THREE NI R3F. Le paquet 3D (+139 Ko gzip mesurés
   au #17) est confiné derrière le `dynamic(ssr:false)` ci-dessous ; un import
   statique le ferait tomber dans le chunk de la home, donc chez tout le monde.
   `tools/gt86/verifie.mjs` monte la garde sur ce point. */

const NUIT = "#08070f"

/* Le voile est opaque DÈS le premier tick : sans lui, la version simple se
   verrait le temps que le chunk arrive, et l'expérience s'ouvrirait sur un
   fondu depuis une planche technique. */
function Voile() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 50, background: NUIT }}
    />
  )
}

const Scene = dynamic(() => import("./scene"), { ssr: false, loading: () => <Voile /> })

/* React 19.2 n'a toujours PAS de boundary sous forme de hook : la classe
   reste le seul moyen d'attraper une erreur de rendu d'un sous-arbre.
   Celle-ci couvre aussi les erreurs internes de la scène — R3F attrape les
   siennes dans sa propre boundary puis les re-jette côté DOM
   (`react-three-fiber.esm.js:58`, `if (error) throw error`). */
class Filet extends Component<{ children: ReactNode; surRepli: () => void }, { mort: boolean }> {
  state = { mort: false }

  static getDerivedStateFromError() {
    return { mort: true }
  }

  componentDidCatch(e: unknown) {
    /* On le dit une fois en console : un repli silencieux est indiscernable
       d'une machine simplement incapable, et c'est la première question
       qu'on se posera devant un rapport de bug. */
    console.warn("[gt86] la surcouche 3D abandonne, la version simple reprend la main :", e)
    this.props.surRepli()
  }

  render() {
    return this.state.mort ? null : this.props.children
  }
}

export default function Surcouche({ lang, surRepli }: { lang: Lang; surRepli: () => void }) {
  /* GEL DU DÉFILEMENT. `overflow: hidden` sur <html> plutôt que `lenis.stop()`
     (components/proto/smooth.tsx) : le natif couvre aussi Espace, PagSuiv et
     les flèches, que Lenis n'intercepte pas. Restauré au démontage — c'est le
     seul effet de bord que la surcouche laisse sur la page. */
  useEffect(() => {
    const html = document.documentElement
    const avant = html.style.overflow
    html.style.overflow = "hidden"
    return () => {
      html.style.overflow = avant
    }
  }, [])

  /* LE FILET DES PROMESSES. R3F configure son renderer dans un `run()` lancé
     SANS `.catch` (`react-three-fiber.esm.js:114`) : si la création du
     contexte WebGL échoue, la rejection ne traverse aucune boundary React et
     la page reste sur un voile noir. La sonde de `capable.ts` est la vraie
     défense — ceci n'est que le filet.

     Il est FILTRÉ sur le texte de l'erreur : un écouteur global qui replierait
     sur n'importe quelle rejection non rattrapée (une balise d'analytics, un
     fetch tiers) casserait l'expérience pour une raison étrangère. */
  useEffect(() => {
    const sur = (e: PromiseRejectionEvent) => {
      const quoi = String((e.reason as Error)?.message ?? e.reason ?? "")
      if (!/webgl|context|three/i.test(quoi)) return
      console.warn("[gt86] contexte WebGL refusé, repli :", quoi)
      surRepli()
    }
    window.addEventListener("unhandledrejection", sur)
    return () => window.removeEventListener("unhandledrejection", sur)
  }, [surRepli])

  return (
    <Filet surRepli={surRepli}>
      <Scene lang={lang} surRepli={surRepli} />
    </Filet>
  )
}
