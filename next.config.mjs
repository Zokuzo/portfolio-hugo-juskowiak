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
}

export default nextConfig
