const { documentToHtmlString } = require("@contentful/rich-text-html-renderer");
const { getGatsbyImageResolver } = require("gatsby-plugin-image/graphql-utils");

exports.createSchemaCustomization = async ({ actions }) => {
  actions.createFieldExtension({
    name: "blocktype",
    extend(options) {
      return {
        resolve(source) {
          return source.internal.type.replace("Contentful", "");
        },
      };
    },
  });

  actions.createFieldExtension({
    name: "imagePassthroughArgs",
    extend(options) {
      const { args } = getGatsbyImageResolver();
      return {
        args,
      };
    },
  });

  actions.createFieldExtension({
    name: "imageUrl",
    extend(options) {
      const schemaRE = /^\/\//;
      const addURLSchema = (str) => {
        if (schemaRE.test(str)) return `https:${str}`;
        return str;
      };
      return {
        resolve(source) {
          return addURLSchema(source.file.url);
        },
      };
    },
  });

  actions.createFieldExtension({
    name: "navItemType",
    args: {
      name: {
        type: "String!",
        defaultValue: "Link",
      },
    },
    extend(options) {
      return {
        resolve() {
          switch (options.name) {
            case "Group":
              return "Group";
            default:
              return "Link";
          }
        },
      };
    },
  });

  actions.createFieldExtension({
    name: "richText",
    args: {
      field: {
        type: "String",
        defaultValue: "body",
      },
    },
    extend(options) {
      return {
        resolve(source, args, context, info) {
          const body = source[options.field] || source.body;
          const doc = JSON.parse(body.raw);
          const html = documentToHtmlString(doc);
          return html;
        },
      };
    },
  });

  // abstract interfaces
  actions.createTypes(/* GraphQL */ `
    interface HomepageBlock implements Node {
      id: ID!
      blocktype: String
    }

    interface HomepageLink implements Node {
      id: ID!
      href: String
      text: String
    }

    interface HeaderNavItem implements Node {
      id: ID!
      navItemType: String
    }

    interface NavItem implements Node & HeaderNavItem {
      id: ID!
      navItemType: String
      href: String
      text: String
      icon: HomepageImage
      description: String
    }

    interface NavItemGroup implements Node & HeaderNavItem {
      id: ID!
      navItemType: String
      name: String
      navItems: [NavItem]
    }

    interface HomepageImage implements Node {
      id: ID!
      alt: String
      gatsbyImageData: GatsbyImageData @imagePassthroughArgs
      url: String
    }

    interface HomepageHero implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String!
      kicker: String
      subhead: String
      image: HomepageImage
      text: String
      links: [HomepageLink]
    }

    interface HomepageFeature implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String
      kicker: String
      text: String
      image: HomepageImage
      links: [HomepageLink]
    }

    interface HomepageFeatureList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      kicker: String
      heading: String
      text: String
      content: [HomepageFeature]
    }

    interface HomepageCta implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      kicker: String
      heading: String
      text: String
      image: HomepageImage
      links: [HomepageLink]
    }

    interface HomepageBenefit implements Node {
      id: ID!
      heading: String
      text: String
      image: HomepageImage
    }

    interface HomepageBenefitList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String
      text: String
      content: [HomepageBenefit]
    }

    interface HomepageStat implements Node {
      id: ID!
      value: String
      label: String
      heading: String
    }

    interface HomepageProduct implements Node {
      id: ID!
      heading: String
      text: String
      image: HomepageImage
      links: [HomepageLink]
    }

    interface HomepageProductList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String
      kicker: String
      text: String
      content: [HomepageProduct]
    }

    interface Homepage implements Node {
      id: ID!
      title: String
      description: String
      image: HomepageImage
      content: [HomepageBlock]
    }

    interface LayoutHeader implements Node {
      id: ID!
      navItems: [HeaderNavItem]
      cta: HomepageLink
    }

    enum SocialService {
      TWITTER
      FACEBOOK
      INSTAGRAM
      YOUTUBE
      LINKEDIN
      GITHUB
      DISCORD
      TWITCH
    }

    interface SocialLink implements Node {
      id: ID!
      username: String!
      service: SocialService!
    }

    interface LayoutFooter implements Node {
      id: ID!
      links: [HomepageLink]
      meta: [HomepageLink]
      socialLinks: [SocialLink]
      copyright: String
    }

    interface Layout implements Node {
      id: ID!
      header: LayoutHeader
      footer: LayoutFooter
    }

    interface AboutPage implements Node {
      id: ID!
      title: String
      description: String
      image: HomepageImage
      content: [HomepageBlock]
    }

    interface NewsPage implements Node {
      id: ID!
      title: String
      content: [HomepageBlock]
    }

    interface AboutHero implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String
      text: String
      image: HomepageImage
    }

    interface AboutStat implements Node {
      id: ID!
      value: String
      label: String
    }

    interface AboutStatList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      content: [AboutStat]
    }

    interface AboutProfile implements Node {
      id: ID!
      image: HomepageImage
      name: String
      jobTitle: String
    }

    interface AboutLeadership implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      kicker: String
      heading: String
      subhead: String
      content: [AboutProfile]
    }

    interface Page implements Node {
      id: ID!
      slug: String!
      title: String
      description: String
      image: HomepageImage
      blogImages: [HomepageImage]
      body: String!
      body1: String
      body2: String
    }

    interface Asset implements Node {
      id: ID!
      alt: String
      gatsbyImageData: GatsbyImageData @imagePassthroughArgs
      url: String
    }
  `);

  // CMS-specific types for Homepage
  actions.createTypes(/* GraphQL */ `
    type ContentfulHomepageLink implements Node & HomepageLink @dontInfer {
      id: ID!
      href: String
      text: String
    }

    type ContentfulNavItem implements Node & NavItem & HeaderNavItem
      @dontInfer {
      id: ID!
      navItemType: String @navItemType(name: "Link")
      href: String
      text: String
      icon: HomepageImage @link(from: "icon___NODE")
      description: String
    }

    type ContentfulNavItemGroup implements Node & NavItemGroup & HeaderNavItem
      @dontInfer {
      id: ID!
      navItemType: String @navItemType(name: "Group")
      name: String
      navItems: [NavItem] @link(from: "navItems___NODE")
    }

    type ContentfulAsset implements Node & HomepageImage {
      id: ID!
      alt: String @proxy(from: "title")
      gatsbyImageData: JSON
      url: String @imageUrl
      file: JSON
      title: String
    }

    type ContentfulHomepageHero implements Node & HomepageHero & HomepageBlock
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      heading: String!
      kicker: String
      subhead: String
      image: HomepageImage @link(from: "image___NODE")
      text: String
      links: [HomepageLink] @link(from: "links___NODE")
    }

    type ContentfulHomepageFeature implements Node & HomepageBlock & HomepageFeature
      @dontInfer {
      blocktype: String @blocktype
      heading: String
      kicker: String
      text: String
      image: HomepageImage @link(from: "image___NODE")
      links: [HomepageLink] @link(from: "links___NODE")
    }

    type ContentfulHomepageFeatureList implements Node & HomepageBlock & HomepageFeatureList
      @dontInfer {
      blocktype: String @blocktype
      kicker: String
      heading: String
      text: String
      content: [HomepageFeature] @link(from: "content___NODE")
    }

    type ContentfulHomepageCta implements Node & HomepageBlock & HomepageCta
      @dontInfer {
      blocktype: String @blocktype
      kicker: String
      heading: String
      text: String
      image: HomepageImage @link(from: "image___NODE")
      links: [HomepageLink] @link(from: "links___NODE")
    }

    type ContentfulHomepageBenefit implements Node & HomepageBenefit
      @dontInfer {
      id: ID!
      heading: String
      text: String
      image: HomepageImage @link(from: "image___NODE")
    }

    type ContentfulHomepageBenefitList implements Node & HomepageBlock & HomepageBenefitList
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      heading: String
      text: String
      content: [HomepageBenefit] @link(from: "content___NODE")
    }

    type ContentfulHomepageStat implements Node & HomepageStat @dontInfer {
      id: ID!
      value: String
      label: String
      heading: String
    }

    type ContentfulHomepageProduct implements Node & HomepageProduct
      @dontInfer {
      heading: String
      text: String
      image: HomepageImage @link(from: "image___NODE")
      links: [HomepageLink] @link(from: "links___NODE")
    }

    type ContentfulHomepageProductList implements Node & HomepageProductList & HomepageBlock
      @dontInfer {
      blocktype: String @blocktype
      heading: String
      kicker: String
      text: String
      content: [HomepageProduct] @link(from: "content___NODE")
    }

    type ContentfulHomepage implements Node & Homepage @dontInfer {
      id: ID!
      title: String
      description: String
      image: HomepageImage @link(from: "image___NODE")
      content: [HomepageBlock] @link(from: "content___NODE")
    }
  `);

  // CMS specific types for News page
  actions.createTypes(/* GraphQL */ `
    type ContentfulNewsPage implements Node & NewsPage @dontInfer {
      id: ID!
      title: String
      content: [HomepageBlock] @link(from: "content___NODE")
    }
  `);

  // CMS specific types for About page
  actions.createTypes(/* GraphQL */ `
    type ContentfulAboutHero implements Node & AboutHero & HomepageBlock
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      heading: String
      text: String
      image: HomepageImage @link(from: "image___NODE")
    }

    type ContentfulAboutStat implements Node & AboutStat @dontInfer {
      id: ID!
      value: String
      label: String
    }

    type ContentfulAboutStatList implements Node & AboutStatList & HomepageBlock
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      content: [AboutStat] @link(from: "content___NODE")
    }

    type ContentfulAboutProfile implements Node & AboutProfile @dontInfer {
      id: ID!
      image: HomepageImage @link(from: "image___NODE")
      name: String
      jobTitle: String
    }

    type ContentfulAboutLeadership implements Node & AboutLeadership & HomepageBlock
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      kicker: String
      heading: String
      subhead: String
      content: [AboutProfile] @link(from: "content___NODE")
    }

    type ContentfulAboutPage implements Node & AboutPage @dontInfer {
      id: ID!
      title: String
      description: String
      image: HomepageImage @link(from: "image___NODE")
      content: [HomepageBlock] @link(from: "content___NODE")
    }
  `);

  // Layout types
  actions.createTypes(/* GraphQL */ `
    type ContentfulLayoutHeader implements Node & LayoutHeader @dontInfer {
      id: ID!
      navItems: [HeaderNavItem] @link(from: "navItems___NODE")
      cta: HomepageLink @link(from: "cta___NODE")
    }

    type ContentfulSocialLink implements Node & SocialLink @dontInfer {
      id: ID!
      username: String!
      service: SocialService!
    }

    type ContentfulLayoutFooter implements Node & LayoutFooter @dontInfer {
      id: ID!
      links: [HomepageLink] @link(from: "links___NODE")
      meta: [HomepageLink] @link(from: "meta___NODE")
      socialLinks: [SocialLink] @link(from: "socialLinks___NODE")
      copyright: String
    }

    type ContentfulLayout implements Node & Layout @dontInfer {
      id: ID!
      header: LayoutHeader @link(from: "header___NODE")
      footer: LayoutFooter @link(from: "footer___NODE")
    }
  `);

  // Page types
  actions.createTypes(/* GraphQL */ `
    type ContentfulPage implements Node & Page {
      id: ID!
      slug: String!
      title: String
      description: String
      image: HomepageImage @link(from: "image___NODE")
      blogImages: [HomepageImage] @link(from: "blogImages___NODE")
      body: String! @richText
      body1: String @richText(field:"body1")
      body2: String @richText(field:"body2")
    }
  `);
};
