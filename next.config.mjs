/** @type {import('next').NextConfig} */
const nextConfig = {
  /* `typescript.ignoreBuildErrors` était à `true`, hérité du scaffold
     v0 : une erreur de type partait en production sans que le build
     bronche. Le projet compile proprement, il n'y a plus de raison de
     s'aveugler — un build qui échoue est le seul filet qui reste quand
     personne ne lance `tsc` à la main. */
  images: {
    unoptimized: true,
  },
  /* Le produit a été rebaptisé Reach-Up le 2026-07-15 ; la fiche a
     suivi (issue #7). L'ancienne URL a été publiée deux jours — elle
     redirige au lieu de casser. */
  async redirects() {
    return [
      { source: "/work/prospector", destination: "/work/reach-up", permanent: true },
      /* #39 — les six fiches maison ont quitté le bureau pour la
         chambre. Cette liste est un RELEVÉ D'HISTOIRE, pas un miroir
         de la scission : elle nomme les six URLs qui ont été publiées
         sous /work et qui doivent continuer d'aboutir. Une fiche
         maison créée demain n'a pas d'ancienne URL — elle n'a donc
         rien à faire ici, et cette ligne n'est pas à tenir à jour. */
      {
        source: "/work/:slug(eternal|trading-agent|cpge|estia|hokkaido|mbds)",
        destination: "/home/:slug",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
