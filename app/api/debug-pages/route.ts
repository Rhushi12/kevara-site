import { NextResponse } from 'next/server';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

export const dynamic = 'force-dynamic';

export async function GET() {
    const query = `
    query {
      metaobjects(type: "page_content", first: 50) {
        edges {
          node {
            id
            handle
            fields {
              key
              value
            }
          }
        }
      }
    }
  `;

    const url = `https://${domain}/admin/api/2024-07/graphql.json`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken!,
        },
        body: JSON.stringify({ query }),
        cache: 'no-store',
    });

    const json = await response.json();

    // Extract just handles for readability
    const handles = json.data?.metaobjects?.edges?.map((e: any) => e.node.handle) || [];

    return NextResponse.json({
        total: handles.length,
        handles,
        rawResponse: json
    });
}
