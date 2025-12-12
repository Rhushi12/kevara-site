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

        return await response.json();
    } catch (error: any) {
        console.error("Shopify Fetch Error:", error);
        throw error;
    }
}

export async function GET() {
    const query = `
    query GetLatestCustomProducts {
      metaobjects(type: "custom_product", first: 5, reverse: true) {
        edges {
          node {
            id
            handle
            updatedAt
            fields {
              key
              value
              jsonValue
            }
          }
        }
      }
    }
  `;

    try {
        const result = await shopifyFetch(query);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
