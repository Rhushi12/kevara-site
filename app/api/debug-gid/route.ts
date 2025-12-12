import { NextResponse } from 'next/server';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

async function shopifyFetch(query: string, variables: any = {}) {
  const url = `https://${domain}/admin/api/2024-07/graphql.json`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken!,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    });

    const json = await response.json();
    return json.data;
  } catch (error: any) {
    console.error("Shopify Fetch Error:", error);
    throw error;
  }
}

export async function GET() {
  const gids = ["gid://shopify/MediaImage/27179717853219"];

  const query = `
    query GetMediaImages($ids: [ID!]!) {
      nodes(ids: $ids) {
        __typename
        ... on MediaImage {
          id
          image {
            url
          }
          fileStatus
        }
        ... on GenericFile {
            id
            url
            fileStatus
        }
      }
    }
  `;

  try {
    const result = await shopifyFetch(query, { ids: gids });
    return NextResponse.json({ result: result || "No data returned" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
