import { NextResponse } from 'next/server';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

async function shopifyFetch(query: string, variables: any = {}) {
    const url = `https://${domain}/admin/api/2024-07/graphql.json`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken!,
        },
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
    });
    return response.json();
}

export const dynamic = 'force-dynamic';

export async function GET() {
    const handle = "product_1764935598640_ouxkgk"; // The broken product

    const query = `
    query GetMetaobject($handle: String!) {
      metaobjectByHandle(handle: { type: "custom_product", handle: $handle }) {
        id
        handle
        fields {
          key
          value
          references(first: 10) {
            nodes {
              __typename
              ... on MediaImage {
                id
                fileStatus
                image {
                  url
                  originalSrc
                }
              }
              ... on GenericFile {
                id
                fileStatus
                url
              }
            }
          }
        }
      }
    }
  `;

    try {
        const json = await shopifyFetch(query, { handle });
        return NextResponse.json(json);
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
