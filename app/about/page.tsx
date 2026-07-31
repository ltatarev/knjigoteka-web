import AboutHero from "@/components/about-hero"
import AboutStatList from "@/components/about-stat-list"
import BenefitList from "@/components/benefit-list"
import { about } from "@/lib/about"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: about.title,
  description: about.description,
  image: about.image?.src,
})

export default function About() {
  return (
    <>
      {about.content.map((block, i) => {
        switch (block.type) {
          case "aboutHero":
            return <AboutHero key={i} {...block} />
          case "aboutStatList":
            return <AboutStatList key={i} {...block} />
          case "homepageBenefitList":
            return <BenefitList key={i} {...block} />
        }
      })}
    </>
  )
}
