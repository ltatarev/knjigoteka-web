import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import { Container, Box, Heading } from "../components/ui";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

const coverImageStyle = {
  borderRadius: '15px',
  maxHeight: '500px',
  objectFit: 'cover',
}

const blogImageStyle = {
  borderRadius: '15px', 
  width: '100%', 
  maxHeight: '350px', 
  objectFit: 'cover',
}

export default function Page(props) {
  const { page } = props.data;

  return (
    <Layout {...page}>
      <Box paddingY={5}>
        <Container width="tight">
          <Heading as="h1">{page.title}</Heading>
          <GatsbyImage alt="" image={getImage(page.image)} style={coverImageStyle}/>
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
          {page?.blogImages?.[0] && <GatsbyImage alt="" image={getImage(page.blogImages[0])} style={blogImageStyle}/>}
          <div
            dangerouslySetInnerHTML={{
              __html: page.body2,
            }}
          />
          {page?.blogImages?.[1] && <GatsbyImage alt="" image={getImage(page.blogImages[1])} style={blogImageStyle}/>}
          <p>
            <i>S ljubavlju prema knjigama,</i><br/>
            <b>Knjigoteka Bilje</b>
          </p>
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
