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
    ]
  },
}

export default nextConfig
