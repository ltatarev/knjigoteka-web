import { getAllPosts } from "./posts"
import type { Post } from "./types"

/**
 * The order posts appear in on /news/ and in the homepage "Novosti" section.
 *
 * Contentful held a hand-maintained list of 38 "feature" blocks for the news
 * page. The migration dropped those as duplication of post data, which is
 * right — otherwise a new post never shows up in a listing — but it means the
 * ordering was lost. It is not recoverable from the posts themselves: `date` is
 * Contentful's createdAt, 15 posts share 2024-08-10 and 6 share 2024-07-31, and
 * reverse-of-posts-index reproduces only 28 of the 38 positions.
 *
 * So the live order is recorded here verbatim, read off knjigoteka.club. Any
 * slug not in this list (i.e. a post added later) sorts by date descending and
 * goes to the top, so the listings stay self-maintaining.
 */
const LIVE_ORDER = [
  "klub-istrazitelja-ubojstava-cetvrtkom",
  "sto-spasavamo-iz-pozara",
  "pravila-magije",
  "zaboravljene-djevojke",
  "izgubljene-djevojcice",
  "moja-nestala-polovica",
  "kci-kralja-mocvare",
  "savrsen-plan",
  "neobicno-pametna-stvorenja",
  "sivi-covjek",
  "popis-uzvanika",
  "pocinjemo-na-kraju",
  "biljeznica-neizgovorenih-stvari",
  "rebecca",
  "covjek-zvan-ove",
  "a-onda-je-nestala",
  "s-druge-strane-ulice",
  "lovacka-druzina",
  "sve-ti-se-vrati",
  "zarucnica",
  "izbliza",
  "sve-sto-je-alice-zaboravila",
  "izgubljeno-cvijece-alice-hart",
  "posljednje-sto-mi-je-rekla",
  "djevojka-iz-mocvare",
  "zena-u-bijelom-kimonu",
  "prije-kise",
  "kako-pronaci-ljubav-u-knjizari",
  "otok-tajni",
  "plemeniti-gospodin-u-moskvi",
  "pohane-zelene-rajcice",
  "crveni-adresar",
  "pariska-knjiznica",
  "tajne-sretnoga-zivota",
  "savrsena-djevojka",
  "umijece-igre",
  "book-club-iza-zakljucanih-vrata",
  "book-club-muza",
]

const rank = new Map(LIVE_ORDER.map((slug, i) => [slug, i]))

export function getPostsInDisplayOrder(): Post[] {
  const posts = getAllPosts() // already sorted date desc, slug asc
  const known: Post[] = []
  const added: Post[] = []
  for (const post of posts) {
    ;(rank.has(post.slug) ? known : added).push(post)
  }
  known.sort((a, b) => rank.get(a.slug)! - rank.get(b.slug)!)
  return [...added, ...known]
}
