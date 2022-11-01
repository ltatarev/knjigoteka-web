import * as React from "react";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import Feature from "../components/feature";

export default function News(props) {
  const { newsPage } = props.data;

  return (
    <Layout {...newsPage}>
      {newsPage.blocks.map((block, i) => {
        const { id, blocktype, ...componentProps } = block;
        return (
          <Feature
            background="background"
            key={id}
            {...componentProps}
            flip={Boolean(i % 2)}
          />
        );
      })}
    </Layout>
  );
}

export const query = graphql`
  {
    newsPage {
      title
      blocks: content {
        id
        blocktype
        ...HomepageFeatureContent
      }
    }
  }
`;
