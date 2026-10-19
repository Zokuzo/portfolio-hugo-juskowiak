/* La page embed publique d'une entité Spotify (playlist, piste), lue
   CÔTÉ SERVEUR : son JSON __NEXT_DATA__ porte les préversions MP3 du CDN
   (p.scdn.co). Fragile par nature (ce JSON n'est pas un contrat) : toute
   défaillance lève, à l'appelant de rendre son repli. */
/* un réseau qui BLOQUE (DROP silencieux) suspendait la route ~300 s
   (revue) : au-delà de ce délai on rend le repli */
const DELAI_MS = 8000

export async function entiteEmbed<T>(chemin: string): Promise<T> {
  const page = await fetch(`https://open.spotify.com/embed/${chemin}`, {
    headers: { "user-agent": "Mozilla/5.0 (portfolio hugojuskowiak.com)" },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(DELAI_MS),
  })
  if (!page.ok) throw new Error(`embed ${chemin} : ${page.status}`)
  const html = await page.text()
  const brut = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!brut) throw new Error(`embed ${chemin} : pas de __NEXT_DATA__`)
  const entite = JSON.parse(brut[1])?.props?.pageProps?.state?.data?.entity
  if (!entite) throw new Error(`embed ${chemin} : pas d'entité`)
  return entite
}

export const estPreversion = (url: string | undefined): url is string => !!url?.startsWith("https://p.scdn.co/")
