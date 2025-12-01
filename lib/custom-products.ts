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

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Shopify API Error: ${response.status} ${response.statusText} - ${text}`);
    }

    const json = await response.json();
    if (json.errors) {
      throw new Error("Failed to fetch from Shopify Admin API: " + JSON.stringify(json.errors));
    }
    return json.data;
  } catch (error: any) {
    console.error("Shopify Fetch Error:", error);
    throw error;
  }
}

async function upsertMetaobject(type: string, handle: string, fields: any[]) {
  const mutation = `
    mutation upsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    handle: { type, handle },
    metaobject: {
      fields,
      capabilities: {
        publishable: {
          status: "ACTIVE"
        }
      }
    }
  };

  const result = await shopifyFetch(mutation, variables);
  if (result.metaobjectUpsert.userErrors.length > 0) {
    console.error(`Error upserting ${type}:`, result.metaobjectUpsert.userErrors);
    const errorMessages = result.metaobjectUpsert.userErrors.map((e: any) => `${e.field || 'Global'}: ${e.message}`).join(", ");
    throw new Error(`Failed to upsert ${type}: ${errorMessages}`);
  }
  return result.metaobjectUpsert.metaobject.id;
}

// Helper to generate unique product handle
function generateProductHandle(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `product_${timestamp}_${random}`;
}

// Helper to slugify title for URL
function slugify(text: string): string {
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

export interface CustomProductInput {
  title: string;
  description: string;
  price: string;
  currency?: string;
  imageGids?: string[]; // Shopify File GIDs
  colors?: Array<{ name: string; hex: string }>;
  sizes?: string[];
  status?: string;
}

// Create a custom product in metaobjects
export async function createCustomProduct(data: CustomProductInput) {
  const handle = generateProductHandle();
  const slug = slugify(data.title);

  console.log(`[createCustomProduct] Creating product with handle: ${handle}`);

  const fields = [
    { key: "product_id", value: handle },
    { key: "title", value: data.title },
    { key: "description", value: data.description || "" },
    { key: "price", value: data.price },
    { key: "currency", value: data.currency || "INR" },
    { key: "status", value: data.status || "ACTIVE" },
    { key: "slug", value: slug }
  ];

  // Add image GIDs as JSON string if provided
  if (data.imageGids && data.imageGids.length > 0) {
    fields.push({
      key: "images",
      value: JSON.stringify(data.imageGids)
    });
  }

  // Add colors if provided
  if (data.colors && data.colors.length > 0) {
    fields.push({
      key: "colors",
      value: JSON.stringify(data.colors)
    });
  }

  // Add sizes if provided
  if (data.sizes && data.sizes.length > 0) {
    fields.push({
      key: "sizes",
      value: JSON.stringify(data.sizes)
    });
  }

  const metaobjectId = await upsertMetaobject("custom_product", handle, fields);

  console.log(`[createCustomProduct] Product created with ID: ${metaobjectId}`);

  // Return the newly created product
  return getCustomProductByHandle(handle);
}

// Get all custom products
export async function getCustomProducts() {
  const query = `
    query GetCustomProducts {
      metaobjects(type: "custom_product", first: 250) {
        edges {
          node {
            id
            handle
            fields {
              key
              value
              ... on MetaobjectField {
                references(first: 10) {
                  edges {
                    node {
                      ... on MediaImage {
                        id
                        image {
                          url
                          altText
                        }
                      }
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

  const result = await shopifyFetch(query);
  const metaobjects = result.metaobjects.edges;

  // Transform metaobjects to product format
  return metaobjects.map((edge: any) => transformMetaobjectToProduct(edge.node));
}

// Helper to transform metaobject to product format
function transformMetaobjectToProduct(metaobject: any) {
  const fields = metaobject.fields.reduce((acc: any, field: any) => {
    acc[field.key] = field.value;

    // Extract image URLs from references
    if (field.key === 'images' && field.references) {
      acc.imageUrls = field.references.edges.map((edge: any) => edge.node.image?.url).filter(Boolean);
    }

    return acc;
  }, {});

  // Parse JSON fields
  const colors = fields.colors ? JSON.parse(fields.colors) : [];
  const sizes = fields.sizes ? JSON.parse(fields.sizes) : [];
  const relatedProducts = fields.related_products ? JSON.parse(fields.related_products) : [];

  // Use imageUrls from references if available, otherwise parse from JSON
  const imageUrls = fields.imageUrls || (fields.images ? JSON.parse(fields.images) : []);

  // Validate and regenerate slug if corrupted or invalid
  let validSlug = fields.slug;
  if (!validSlug || validSlug.length < 3) {
    console.warn(`[transformMetaobjectToProduct] Invalid slug "${validSlug}" for product "${fields.title}", regenerating...`);
    validSlug = slugify(fields.title || fields.product_id);
  }

  return {
    node: {
      id: metaobject.id,
      handle: fields.product_id,
      slug: validSlug,
      title: fields.title,
      descriptionHtml: fields.description,
      priceRange: {
        minVariantPrice: {
          amount: fields.price,
          currencyCode: fields.currency || "INR"
        }
      },
      images: {
        edges: imageUrls.map((url: string) => ({
          node: {
            url,
            altText: fields.title
          }
        }))
      },
      variants: {
        edges: [{
          node: {
            id: `variant_${fields.product_id}`,
            title: "Default"
          }
        }]
      },
      colors,
      sizes,
      relatedProducts,
      status: fields.status
    }
  };
}

// Get a single custom product by handle (product_id)
export async function getCustomProductByHandle(handle: string) {
  // Shopify doesn't support querying metaobjects by handle directly
  // We need to fetch all and filter by product_id field
  const allProducts = await getCustomProducts();
  const product = allProducts.find((p: any) => p.node.handle === handle);
  return product ? product.node : null;
}

// Get custom product by slug (for PDP)
export async function getCustomProductBySlug(slug: string) {
  const products = await getCustomProducts();
  const product = products.find((p: any) => p.node.slug === slug || p.node.handle === slug);
  return product ? product.node : null;
}

// Update related products for a custom product
export async function updateProductRelatedItems(handle: string, relatedIds: string[]) {
  console.log(`[updateProductRelatedItems] Updating related products for ${handle}:`, relatedIds);

  const fields = [
    {
      key: "related_products",
      value: JSON.stringify(relatedIds)
    }
  ];

  const metaobjectId = await upsertMetaobject("custom_product", handle, fields);
  console.log(`[updateProductRelatedItems] Updated metaobject ID: ${metaobjectId}`);
  return metaobjectId;
}

// Delete a custom product by ID
export async function deleteCustomProduct(id: string) {
  const mutation = `
    mutation metaobjectDelete($id: ID!) {
      metaobjectDelete(id: $id) {
        deletedId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = { id };
  const result = await shopifyFetch(mutation, variables);

  if (result.metaobjectDelete.userErrors.length > 0) {
    console.error("Error deleting product:", result.metaobjectDelete.userErrors);
    throw new Error("Failed to delete product");
  }

  return result.metaobjectDelete.deletedId;
}
