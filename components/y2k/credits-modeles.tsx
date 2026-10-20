import { t, type Lang } from "@/components/proto/dict"

/* La GT86 est sous CC BY 4.0 : la licence EXIGE titre, auteur, source et
   licence partout où l'œuvre est montrée. La ville (Sketchfab Standard)
   ne l'exige pas ; elle est créditée par courtoisie. Provenance lue dans
   le bloc `asset.extras` des GLB d'origine (#35). */
const SOURCE_GT86 = "https://sketchfab.com/3d-models/foxs-rocketbunny-gt86-815691bbc8cd459fb0fafea2d7a02df7"
const SOURCE_VILLE = "https://sketchfab.com/3d-models/procedural-city-5-c2a33cf0165b497cabd5e4a22599277b"
const LICENCE_CC_BY = "https://creativecommons.org/licenses/by/4.0/"
const SOURCE_ACCELERATION = "https://freesound.org/people/dezoris/sounds/191194/"

export function CreditsModeles({ lang }: { lang: Lang }) {
  return (
    <span className="y2k-credits">
      {t(lang, "creditModeles")}{" "}
      <a href={SOURCE_GT86} target="_blank" rel="noreferrer">{t(lang, "creditGt86")}</a>{" "}
      (<a href={LICENCE_CC_BY} target="_blank" rel="noreferrer">CC BY 4.0</a>) ·{" "}
      <a href={SOURCE_VILLE} target="_blank" rel="noreferrer">{t(lang, "creditVille")}</a> ·{" "}
      {t(lang, "creditSon")}{" "}
      <a href={SOURCE_ACCELERATION} target="_blank" rel="noreferrer">{t(lang, "creditAcceleration")}</a>{" "}
      (<a href={LICENCE_CC_BY} target="_blank" rel="noreferrer">CC BY 4.0</a>)
    </span>
  )
}
