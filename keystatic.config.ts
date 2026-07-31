import { config, collection, fields } from "@keystatic/core";

/**
 * Keystatic schema for the migrated Contentful content.
 *
 * NOTE: this is not wired up in this repo — Keystatic's admin UI only ships for
 * Next.js / Astro / Remix, and this site is still Gatsby. The config is written
 * to match `content/posts/*.mdx` exactly, so it works as-is once the site moves.
 *
 * Requires: npm i @keystatic/core
 */

const image = (directory: string) =>
  fields.object({
    src: fields.image({
      label: "Image",
      directory: `content/images/${directory}`,
      publicPath: `/images/${directory}/`,
      validation: { isRequired: true },
    }),
    alt: fields.text({ label: "Alt text" }),
  });

export default config({
  storage: { kind: "local" },

  ui: {
    brand: { name: "Knjigoteka Bilje" },
  },

  collections: {
    posts: collection({
      label: "Book club posts",
      path: "content/posts/*",
      slugField: "title",
      format: { contentField: "content" },
      entryLayout: "content",
      columns: ["title", "date"],
      schema: {
        title: fields.slug({
          name: {
            label: "Title",
            description: 'Full post title, e.g. "Book club: Fredrik Backman - Čovjek zvan Ove"',
            validation: { isRequired: true },
          },
          slug: {
            label: "Slug",
            description: "URL path for this post. Changing it breaks existing links.",
          },
        }),

        listingTitle: fields.text({
          label: "Listing title",
          description: 'Shown on the news page, e.g. "Fredrik Backman, Čovjek zvan Ove"',
        }),

        date: fields.date({
          label: "Date",
          validation: { isRequired: true },
        }),

        kicker: fields.text({
          label: "Kicker",
          description: "Small label above the title in listings.",
          defaultValue: "Book club",
        }),

        description: fields.text({
          label: "Description",
          description: "Used for SEO / meta description.",
          multiline: true,
        }),

        excerpt: fields.text({
          label: "Excerpt",
          description: "Summary shown in the news listing.",
          multiline: true,
        }),

        coverImage: image("posts"),

        images: fields.array(image("posts"), {
          label: "In-post images",
          itemLabel: (props) => props.fields.alt.value || "Image",
        }),

        content: fields.mdx({
          label: "Body",
          options: {
            image: {
              directory: "content/images/posts",
              publicPath: "/images/posts/",
            },
          },
        }),
      },
    }),
  },
});
