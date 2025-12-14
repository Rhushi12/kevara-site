import { pollForFileUrl, shopifyFetch } from './shopify-admin';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

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
  videoGid?: string; // Shopify Video GID
  colors?: Array<{ name: string; hex: string }>;
  sizes?: string[];
  status?: string;
}

// Helper to bulk resolve GIDs to URLs
async function resolveImageGids(gids: string[]) {
  if (gids.length === 0) return {};

  // Deduplicate
  const uniqueGids = Array.from(new Set(gids));

  const query = `
    query GetMediaImages($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on MediaImage {
          id
          image {
            url
          }
        }
        ... on Video {
          id
          sources {
             url
             mimeType
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyFetch(query, { ids: uniqueGids });
    const map: Record<string, string> = {};
    if (data.nodes) {
      data.nodes.forEach((node: any) => {
        if (node) {
          if (node.image?.url) map[node.id] = node.image.url;
          else if (node.sources && node.sources.length > 0) map[node.id] = node.sources[0].url;
        }
      });
    }
    return map;
  } catch (error) {
    console.error("Failed to resolve image GIDs:", error);
    return {};
  }
}

// Create a custom product in metaobjects
export async function createCustomProduct(data: CustomProductInput) {
  console.log('🔥🔥🔥 [createCustomProduct] UPDATED CODE IS RUNNING! 🔥🔥🔥');
  console.log(`[createCustomProduct] Input data:`, {
    title: data.title,
    imageGidsCount: data.imageGids?.length || 0
  });

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

  // Add video GID if provided
  if (data.videoGid) {
    fields.push({
      key: "video",
      value: data.videoGid
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

  // Poll for image URLs to ensure they're ready before returning
  let imageUrls: string[] = [];
  if (data.imageGids && data.imageGids.length > 0) {
    console.log(`[createCustomProduct] Polling for ${data.imageGids.length} image URLs in parallel...`);

    // Concurrently poll for all URLs
    const pollResults = await Promise.all(data.imageGids.map(async (gid) => {
      try {
        const url = await pollForFileUrl(gid, 30, 1000);
        if (url) {
          console.log(`[createCustomProduct] Got URL for ${gid}: ${url}`);
          return url;
        }
      } catch (error) {
        console.error(`[createCustomProduct] Failed to get URL for ${gid}:`, error);
      }
      return null;
    }));

    imageUrls = pollResults.filter((url): url is string => url !== null);

    // Save the polled URLs back to the metaobject so they persist
    if (imageUrls.length > 0) {
      console.log(`[createCustomProduct] Saving ${imageUrls.length} image URLs to metaobject...`);
      try {
        await upsertMetaobject("custom_product", handle, [
          ...fields,
          { key: "image_urls", value: JSON.stringify(imageUrls) }
        ]);
      } catch (error) {
        console.error(`[createCustomProduct] Failed to save image URLs:`, error);
      }
    }
  }

  // Return the product with the polled image URLs for immediate display
  return {
    id: metaobjectId,
    handle,
    slug,
    title: data.title,
    descriptionHtml: data.description || "",
    priceRange: {
      minVariantPrice: {
        amount: data.price,
        currencyCode: data.currency || "INR"
      }
    },
    images: {
      edges: imageUrls.map(url => ({
        node: {
          url,
          altText: data.title
        }
      }))
    },
    variants: {
      edges: [{
        node: {
          id: `variant_${handle}`,
          title: "Default"
        }
      }]
    },
    colors: data.colors || [],
    sizes: data.sizes || [],
    relatedProducts: [],
    video: null,
    status: data.status || "ACTIVE"
  };
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
                      ... on Video {
                        id
                        sources {
                          url
                          mimeType
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

  // 1. First Pass: Transform to products, but capture missing GIDs
  const products = metaobjects.map((edge: any) => transformMetaobjectToProduct(edge.node));

  // 2. Identify Missing URLs
  const gidsToResolve: string[] = [];
  products.forEach((p: any) => {
    if ((!p.node.images.edges || p.node.images.edges.length === 0) && p._params?.imageGids && p._params.imageGids.length > 0) {
      gidsToResolve.push(...p._params.imageGids);
    }
  });

  // 3. Resolve Missing GIDs if any
  let resolvedMap: Record<string, string> = {};
  if (gidsToResolve.length > 0) {
    console.log(`[getCustomProducts] Resolving ${gidsToResolve.length} missing image GIDs...`);
    resolvedMap = await resolveImageGids(gidsToResolve);
  }

  // 4. Fill in missing URLs
  products.forEach((p: any) => {
    if ((!p.node.images.edges || p.node.images.edges.length === 0) && p._params?.imageGids) {
      const recoveredUrls: string[] = [];
      p._params.imageGids.forEach((gid: string) => {
        if (resolvedMap[gid]) {
          recoveredUrls.push(resolvedMap[gid]);
        }
      });

      if (recoveredUrls.length > 0) {
        p.node.images.edges = recoveredUrls.map(url => ({
          node: { url, altText: p.node.title }
        }));
      }
    }
    // Clean up internal params
    delete p._params;
  });

  return products;
}

// Helper to transform metaobject to product format
function transformMetaobjectToProduct(metaobject: any) {
  let rawImageGids: string[] = [];

  const fields = metaobject.fields.reduce((acc: any, field: any) => {
    acc[field.key] = field.value;

    // Extract image URLs from references
    if (field.key === 'images' && field.references) {
      acc.imageUrls = field.references.edges.map((edge: any) => edge.node.image?.url).filter(Boolean);
    }

    // Extract video URL from references
    if (field.key === 'video' && field.references) {
      const videoNode = field.references.edges[0]?.node;
      if (videoNode && videoNode.sources) {
        acc.videoUrl = videoNode.sources[0]?.url;
      }
    }

    return acc;
  }, {});

  // Parse JSON fields
  const colors = fields.colors ? JSON.parse(fields.colors) : [];
  const sizes = fields.sizes ? JSON.parse(fields.sizes) : [];
  const relatedProducts = fields.related_products ? JSON.parse(fields.related_products) : [];

  // Extract image URLs with priority:
  let imageUrls = [];

  if (fields.image_urls) {
    try {
      imageUrls = JSON.parse(fields.image_urls);
    } catch (e) {
      console.warn('[transformMetaobjectToProduct] Failed to parse image_urls:', e);
    }
  }

  if (imageUrls.length === 0 && fields.imageUrls) {
    imageUrls = fields.imageUrls;
  }

  if (imageUrls.length === 0 && fields.images) {
    try {
      const parsed = JSON.parse(fields.images);
      // Capture GIDs for fallback resolution
      rawImageGids = parsed.filter((item: string) => item && typeof item === 'string' && item.startsWith('gid://'));

      // Filter to only include actual URLs (not GIDs) for direct usage
      const directUrls = parsed.filter((item: string) =>
        item && typeof item === 'string' && !item.startsWith('gid://') && item.startsWith('http')
      );
      if (directUrls.length > 0) imageUrls = directUrls;

    } catch (e) {
      console.warn('[transformMetaobjectToProduct] Failed to parse images JSON:', e);
    }
  }

  // Validate and regenerate slug if corrupted or invalid
  let validSlug = fields.slug;
  if (!validSlug || validSlug.length < 3) {
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
      video: fields.videoUrl || null,
      status: fields.status
    },
    // Attach internal params for getCustomProducts to use if needed
    _params: {
      imageGids: rawImageGids
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

// Update an existing custom product
export interface UpdateCustomProductInput {
  handle: string; // Required - the product_id
  title?: string;
  description?: string;
  price?: string;
  currency?: string;
  colors?: Array<{ name: string; hex: string }>;
  sizes?: string[];
  status?: string;
}

export async function updateCustomProduct(data: UpdateCustomProductInput) {
  console.log(`[updateCustomProduct] Updating product: ${data.handle}`);

  const fields: { key: string; value: string }[] = [];

  // Only add fields that are provided
  if (data.title !== undefined) {
    fields.push({ key: "title", value: data.title });
  }
  if (data.description !== undefined) {
    fields.push({ key: "description", value: data.description });
  }
  if (data.price !== undefined) {
    fields.push({ key: "price", value: data.price });
  }
  if (data.currency !== undefined) {
    fields.push({ key: "currency", value: data.currency });
  }
  if (data.colors !== undefined) {
    fields.push({ key: "colors", value: JSON.stringify(data.colors) });
  }
  if (data.sizes !== undefined) {
    fields.push({ key: "sizes", value: JSON.stringify(data.sizes) });
  }
  if (data.status !== undefined) {
    fields.push({ key: "status", value: data.status });
  }

  if (fields.length === 0) {
    throw new Error("No fields provided for update");
  }

  const metaobjectId = await upsertMetaobject("custom_product", data.handle, fields);
  console.log(`[updateCustomProduct] Product updated with ID: ${metaobjectId}`);

  return { success: true, id: metaobjectId };
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
