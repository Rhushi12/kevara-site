import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify-admin";
import { requireAdmin } from "@/lib/auth";

// GET: Fetch all marquee items from Shopify (public-facing, no auth needed)
export async function GET() {
    const query = `
      query {
        metaobjects(type: "marquee_item", first: 20) {
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

    try {
        const data = await shopifyFetch(query);
        const items = data.metaobjects.edges.map((edge: any) => {
            const node = edge.node;
            const textField = node.fields.find((f: any) => f.key === "text");
            return {
                id: node.id,
                handle: node.handle,
                text: textField?.value || "",
            };
        });
        return NextResponse.json(items);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: Create or update a marquee item (admin only)
export async function POST(req: Request) {
    const authError = await requireAdmin(req as any);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { text, handle } = body;

        if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

        const itemHandle = handle || `marquee-${Date.now()}`;

        const mutation = `
          mutation upsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
            metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
              metaobject {
                id
                handle
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const variables = {
            handle: { type: "marquee_item", handle: itemHandle },
            metaobject: {
                fields: [{ key: "text", value: text }],
                capabilities: { publishable: { status: "ACTIVE" } }
            }
        };

        const data = await shopifyFetch(mutation, variables);
        if (data.metaobjectUpsert.userErrors.length > 0) {
            return NextResponse.json({ error: data.metaobjectUpsert.userErrors[0].message }, { status: 400 });
        }
        return NextResponse.json({ success: true, id: data.metaobjectUpsert.metaobject.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE: Remove a marquee item (admin only)
export async function DELETE(req: Request) {
    const authError = await requireAdmin(req as any);
    if (authError) return authError;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const mutation = `
      mutation metaobjectDelete($id: ID!) {
        metaobjectDelete(id: $id) {
          deletedId
          userErrors {
            message
          }
        }
      }
    `;

    try {
        const data = await shopifyFetch(mutation, { id: decodeURIComponent(id) });
        if (data.metaobjectDelete?.userErrors?.length > 0) {
            return NextResponse.json({ error: data.metaobjectDelete.userErrors[0].message }, { status: 400 });
        }
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
