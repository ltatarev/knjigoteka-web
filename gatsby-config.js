// support for .env, .env.development, and .env.production
require("dotenv").config()
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  siteMetadata: {
    siteUrl: "https://knjigoteka.club/",
    title: "Knjigoteka Bilje",
    author: `Knjigoteka`,
    description: "Udruga ljubitelja knjiga Bilje",
  },
  plugins: [
    {
      resolve: "gatsby-source-contentful",
      options: {
        downloadLocal: true,
        spaceId: process.env.CONTENTFUL_SPACE_ID,
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
        host: process.env.CONTENTFUL_HOST,
      },
    },
    "gatsby-plugin-sharp",
    "gatsby-plugin-image",
    "gatsby-transformer-sharp",
    "gatsby-plugin-vanilla-extract",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "Knjigoteka Bilje",
        short_name: "Knjigoteka",
        start_url: "/",
        // These can be imported once ESM support lands
        background_color: "#FFFCF8",
        theme_color: "#E98C00",
        icon: "src/favicon.png",
      },
    },
  ],
}
