import Image from "next/image"

export default function BrandLogo() {
  return (
    <Image
      src="/images/site/logo.png"
      alt="Knjigoteka Logo"
      width={60}
      height={60}
      priority
    />
  )
}
