import * as React from "react";
import { graphql } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import {
  Container,
  Section,
  Flex,
  Box,
  Subhead,
  Kicker,
  Text,
  ButtonList,
} from "./ui";

export default function Feature(props) {
  const background = props?.background || "muted";

  return (
    <Section padding={1} background={background}>
      <Container>
        <Flex gap={4} variant="responsive">
          <Box width="half" order={props.flip ? 1 : null}>
            {props.image && (
              <GatsbyImage
                alt={props.image.alt}
                image={getImage(props.image.gatsbyImageData)}
                style={{borderRadius: 25, maxHeight: 330}}
              />
            )}
          </Box>
          <Box width="half">
            <Subhead>
              {props.kicker && <Kicker>{props.kicker}</Kicker>}
              {props.heading}
            </Subhead>
            <Text variant="lead">{props.text}</Text>
            <ButtonList links={props.links} />
          </Box>
        </Flex>
      </Container>
    </Section>
  );
}

export const query = graphql`
  fragment HomepageFeatureContent on HomepageFeature {
    id
    kicker
    heading
    text
    links {
      id
      href
      text
    }
    image {
      id
      gatsbyImageData
      alt
    }
  }
`;
