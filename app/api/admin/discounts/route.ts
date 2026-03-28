import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify-admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
    const authError = await requireAdmin(req as any);
    if (authError) return authError;

    const query = `
      query getDiscounts {
        discountNodes(first: 50, reverse: true) {
          edges {
            node {
              id
              discount {
                ... on DiscountCodeBasic {
                  status
                  title
                  codes(first: 1) {
                    nodes {
                      code
                    }
                  }
                  usageLimit
                  appliesOncePerCustomer
                  customerSelection {
                    ... on DiscountCustomerAll {
                      allCustomers
                    }
                  }
                  customerGets {
                    value {
                      ... on DiscountPercentage {
                        percentage
                      }
                      ... on DiscountAmount {
                        amount { amount currencyCode }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
        const data = await shopifyFetch(query);
        return NextResponse.json(data.discountNodes.edges.map((e: any) => e.node));
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const authError = await requireAdmin(req as any);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { code, type, value, oncePerCustomer } = body;

        const mutation = `
        mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
            discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
            codeDiscountNode {
                id
            }
            userErrors {
                field
                message
            }
            }
        }
        `;

        let valueInput: any = {};
        if (type === "percentage") {
            // Shopify expects 0.1 for 10%
            valueInput = { percentage: parseFloat(value) / 100 };
        } else {
            valueInput = { discountAmount: { amount: parseFloat(value), appliesOnEachItem: false } };
        }

        const variables = {
            basicCodeDiscount: {
                title: code.toUpperCase(),
                code: code.toUpperCase(),
                startsAt: new Date().toISOString(),
                customerSelection: { all: true },
                customerGets: {
                    value: valueInput,
                    items: { all: true }
                },
                appliesOncePerCustomer: oncePerCustomer
            }
        };

        const data = await shopifyFetch(mutation, variables);
        if (data.discountCodeBasicCreate?.userErrors?.length > 0) {
            return NextResponse.json({ error: data.discountCodeBasicCreate.userErrors[0].message }, { status: 400 });
        }
        return NextResponse.json({ success: true, node: data.discountCodeBasicCreate?.codeDiscountNode });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const authError = await requireAdmin(req as any);
    if (authError) return authError;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    try {
        const mutation = `
          mutation discountCodeDelete($id: ID!) {
            discountCodeDelete(id: $id) {
              deletedCodeDiscountId
              userErrors {
                field
                message
              }
            }
          }
        `;

        const data = await shopifyFetch(mutation, { id: decodeURIComponent(id) });
        if (data.discountCodeDelete?.userErrors?.length > 0) {
            return NextResponse.json({ error: data.discountCodeDelete.userErrors[0].message }, { status: 400 });
        }
        return NextResponse.json({ success: true, deletedId: data.discountCodeDelete?.deletedCodeDiscountId });
    } catch (e: any) {
        // If the mutation is completely wrong, this will throw a parser error
        return NextResponse.json({ error: e.message || "GraphQL Exception" }, { status: 500 });
    }
}
