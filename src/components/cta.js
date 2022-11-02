import * as React from "react";
import { graphql } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import {
  Container,
  Section,
  Heading,
  Text,
  ButtonList,
  Kicker,
  Flex,
} from "./ui";

export default function HomepageCta(props) {
  return (
    <Container width="fullbleed">
      <Section padding={5} radius="large" background="muted">
        <Heading center>
          {props.kicker && <Kicker center>{props.kicker}</Kicker>}
          {props.heading}
        </Heading>
        <Text as="p" center variant="lead">
          {props.text}
        </Text>
        <ButtonList links={props.links} variant="center" reversed />
        {props.image && (
          <Flex variant="center">
            <GatsbyImage
              alt={props.image.alt}
              image={getImage(props.image.gatsbyImageData)}
            />
          </Flex>
        )}
      </Section>
    </Container>
  );
}

export const query = graphql`
  fragment HomepageCtaContent on HomepageCta {
    id
    kicker
    heading
    text
    image {
      alt
      id
      gatsbyImageData
    }
    links {
      id
      href
      text
    }
  }
`;
