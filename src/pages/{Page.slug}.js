import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import { Container, Box, Heading } from "../components/ui";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

export default function Page(props) {
  const { page } = props.data;
console.log(page)
  return (
    <Layout {...page}>
      <Box paddingY={5}>
        <Container width="narrow">
          <Heading as="h1">{page.title}</Heading>
          <GatsbyImage alt="" image={getImage(page.image)} style={{ borderRadius: '15px' }}/>
          <div
            dangerouslySetInnerHTML={{
              __html: page.body,
            }}
          />
          <div
            dangerouslySetInnerHTML={{
              __html: page.body1,
            }}
          />
          <GatsbyImage alt="" image={getImage(page.blogImages[0])} style={{ borderRadius: '15px', height: '300px' }}/>
          <div
            dangerouslySetInnerHTML={{
              __html: page.body2,
            }}
          />
          <GatsbyImage alt="" image={getImage(page.blogImages[1])} style={{ borderRadius: '15px', height: '300px' }}/>
        </Container>
      </Box>
    </Layout>
  );
}

export const query = graphql`
  query PageContent($id: String!) {
    page(id: { eq: $id }) {
      id
      title
      slug
      description
      image {
        id
        url
        gatsbyImageData
        alt
      }
      body
      body1
      body2
      blogImages {
        id
        url
        gatsbyImageData
        alt
      }
    }
  }
`;
