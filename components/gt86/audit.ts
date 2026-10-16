/* PATCH D'AUDIT JETABLE : ?coupe=postfx,bloom,msaa,aberration,nuages,dpr1,chrome,transmission,halos */
export function coupe(poste: string): boolean {
  if (typeof location === "undefined") return false
  return (new URLSearchParams(location.search).get("coupe") ?? "").split(",").includes(poste)
}
