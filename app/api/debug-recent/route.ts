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
    // Check the most recent product that has no images
    const handle = "product_1764937133710_csj459"; // wqeqe

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
                }
              }
            }
          }
        }
      }
    }
  `;

    try {
        const json = await shopifyFetch(query, { handle });

        // Also check what GIDs are stored
        const imagesField = json.data?.metaobjectByHandle?.fields?.find((f: any) => f.key === 'images');

        return NextResponse.json({
            rawResponse: json,
            imagesFieldValue: imagesField?.value,
            imagesReferences: imagesField?.references
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
