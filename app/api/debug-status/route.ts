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
  // Check status of the LATEST uploaded GIDs (from the most recent upload)
  const gids = [
    "gid://shopify/MediaImage/27179738529827",
    "gid://shopify/MediaImage/27179738562595",
    "gid://shopify/MediaImage/27179738595363",
    "gid://shopify/MediaImage/27179738628131"
  ];

  const query = `
    query GetFileStatus($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on MediaImage {
          id
          fileStatus
          fileErrors {
            code
            details
            message
          }
          image {
            url
          }
        }
      }
    }
  `;

  try {
    const json = await shopifyFetch(query, { ids: gids });
    return NextResponse.json(json);
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
