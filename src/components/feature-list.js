import * as React from "react";
import { graphql } from "gatsby";
import { Container, Box, Kicker, Heading, Text, Link } from "./ui";
import Feature from "./feature";

export default function FeatureList(props) {
  // TODO: Show only top 3 features on homepage

  return (
    <Container width="fullbleed">
      <Box background="muted" radius="large">
        <Box center paddingY={5}>
          <Heading>
            {props.kicker && <Kicker>{props.kicker}</Kicker>}
            <Link to={'/news'}>{props.heading}</Link>
          </Heading>
          {props.text && <Text>{props.text}</Text>}
        </Box>
        {props.content.map((feature, i) => (
          <Feature key={feature.id} {...feature} flip={Boolean(i % 2)} />
        ))}
      </Box>
    </Container>
  );
}

export const query = graphql`
  fragment HomepageFeatureListContent on HomepageFeatureList {
    id
    kicker
    heading
    text
    content {
      id
      ...HomepageFeatureContent
    }
  }
`;
