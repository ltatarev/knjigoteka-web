import Hero from "@/components/hero"
import ProductList from "@/components/product-list"
import FeatureList from "@/components/feature-list"
import BenefitList from "@/components/benefit-list"
import Cta from "@/components/cta"
import { homepage } from "@/lib/homepage"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: homepage.title,
  description: homepage.description,
  image: homepage.image?.src,
})

export default function Home() {
  return (
    <>
      {homepage.content.map((block, i) => {
        switch (block.type) {
          case "homepageHero":
            return <Hero key={i} {...block} />
          case "homepageProductList":
            return <ProductList key={i} {...block} />
          case "homepageFeatureList":
            return <FeatureList key={i} {...block} />
          case "homepageBenefitList":
            return <BenefitList key={i} {...block} />
          case "homepageCta":
            return <Cta key={i} {...block} />
        }
      })}
    </>
  )
}
