
import { Buffer } from 'buffer';
import sharp from 'sharp';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

import { extractMediaGids } from './shopify-utils';

function logDebug(message: string, data?: any) {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Exported fetch function for admin API
export async function shopifyFetch(query: string, variables: any = {}) {
  const url = `https://${domain}/admin/api/2024-07/graphql.json`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken!,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store', // Ensure we always get fresh data from Admin API
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Shopify API Error (${response.status} ${response.statusText}):`, text);
      throw new Error(`Shopify API Error: ${response.status} ${response.statusText} - ${text}`);
    }

    const json = await response.json();
    if (json.errors) {
      console.error("Shopify API GraphQL Error:", json.errors);
      console.error("Query:", query);
      console.error("Variables:", JSON.stringify(variables, null, 2));
      throw new Error("Failed to fetch from Shopify Admin API: " + JSON.stringify(json.errors));
    }
    return json.data;
  } catch (error: any) {
    console.error("Shopify Fetch Network/System Error:", error);
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

  logDebug(`upsertMetaobject ${type} payload`, { handle, fields });

  const result = await shopifyFetch(mutation, variables);
  if (result.metaobjectUpsert.userErrors.length > 0) {
    logDebug(`upsertMetaobject ${type} failed`, result.metaobjectUpsert.userErrors);
    console.error(`Error upserting ${type}:`, result.metaobjectUpsert.userErrors);
    const errorMessages = result.metaobjectUpsert.userErrors.map((e: any) => `${e.field || 'Global'}: ${e.message}`).join(", ");
    throw new Error(`Failed to upsert ${type}: ${errorMessages}`);
  }
  logDebug(`upsertMetaobject ${type} success`, { id: result.metaobjectUpsert.metaobject.id });
  return result.metaobjectUpsert.metaobject.id;
}

// ============================================================================
// FILE UPLOAD SYSTEM - Clean Implementation
// ============================================================================

/**
 * Detect MIME type from file extension if not provided
 */
function getMimeType(file: { name: string; type?: string }): string {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
  };

  return mimeMap[ext || ''] || 'application/octet-stream';
}

/**
 * Get resource type for Shopify staging
 */
function getResourceType(mimeType: string): 'IMAGE' | 'VIDEO' | 'FILE' {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  return 'FILE';
}

/**
 * Convert File to Buffer for upload, resizing large images
 * Shopify has a 20MP limit, so we resize to max 4000x4000 (~16MP)
 */
async function fileToBuffer(file: any): Promise<{ buffer: Buffer; mimeType: string }> {
  let buffer: Buffer;
  let mimeType = getMimeType(file);

  if (typeof file.arrayBuffer === 'function') {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (file.buffer && Buffer.isBuffer(file.buffer)) {
    buffer = file.buffer;
  } else {
    throw new Error('Cannot convert file to buffer - unsupported file type');
  }

  // Log original file signature
  const signature = buffer.slice(0, 16).toString('hex');
  console.log(`[Upload] File "${file.name}" signature (first 16 bytes): ${signature}`);

  // Only resize images, not videos
  if (mimeType.startsWith('image/') && !mimeType.includes('gif')) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      console.log(`[Upload] Image dimensions: ${metadata.width}x${metadata.height}`);

      const MAX_DIMENSION = 4000; // 4000x4000 = 16MP, well under 20MP limit

      if (metadata.width && metadata.height &&
        (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION)) {
        console.log(`[Upload] Resizing image from ${metadata.width}x${metadata.height}...`);

        const resizedBuffer = await image
          .resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 }) // Convert to JPEG for consistency
          .toBuffer();

        buffer = resizedBuffer;
        mimeType = 'image/jpeg'; // After resize, it's JPEG

        console.log(`[Upload] Resized to max ${MAX_DIMENSION}px, new size: ${buffer.length} bytes`);
      }
    } catch (err) {
      console.error('[Upload] Failed to resize image, uploading original:', err);
      // Continue with original if resize fails
    }
  }

  return { buffer, mimeType };
}

/**
 * Stage a file for upload to Shopify's GCS
 */
async function stageFileForUpload(fileSize: number, mimeType: string, filename: string): Promise<{ url: string; resourceUrl: string }> {
  const resourceType = getResourceType(mimeType);

  const mutation = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;


  const variables = {
    input: [{
      resource: resourceType,
      filename: filename,
      mimeType: mimeType,
      fileSize: String(fileSize),
      httpMethod: 'PUT',
    }]
  };

  console.log('[Upload] Staging file:', { filename, fileSize, mimeType, resourceType });

  const data = await shopifyFetch(mutation, variables);

  if (data.stagedUploadsCreate.userErrors?.length > 0) {
    const errors = data.stagedUploadsCreate.userErrors.map((e: any) => e.message).join(', ');
    throw new Error(`Staging failed: ${errors}`);
  }

  const target = data.stagedUploadsCreate.stagedTargets[0];
  if (!target) {
    throw new Error('No staged target returned from Shopify');
  }

  return { url: target.url, resourceUrl: target.resourceUrl };
}

/**
 * Upload file buffer to GCS using the staged URL
 */
async function uploadToGCS(url: string, buffer: Buffer, mimeType: string): Promise<void> {
  console.log('[Upload] Uploading to GCS:', { size: buffer.length, mimeType });

  const response = await fetch(url, {
    method: 'PUT',
    body: buffer as unknown as BodyInit,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(buffer.length),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[Upload] GCS upload failed:', text);
    throw new Error(`GCS upload failed: ${response.status} - ${text}`);
  }

  console.log('[Upload] GCS upload successful');
}

/**
 * Create file record in Shopify Files
 */
async function createFileRecord(resourceUrl: string, mimeType: string): Promise<string> {
  const contentType = getResourceType(mimeType);

  const mutation = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
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
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    files: [{
      originalSource: resourceUrl,
      contentType: contentType,
    }]
  };

  console.log('[Upload] Creating file record:', { resourceUrl, contentType });

  const data = await shopifyFetch(mutation, variables);

  if (data.fileCreate.userErrors?.length > 0) {
    const errors = data.fileCreate.userErrors.map((e: any) => e.message).join(', ');
    throw new Error(`File creation failed: ${errors}`);
  }

  const createdFile = data.fileCreate.files[0];
  if (!createdFile) {
    throw new Error('No file returned from fileCreate mutation');
  }

  console.log('[Upload] File created:', { id: createdFile.id, status: createdFile.fileStatus });

  return createdFile.id;
}

/**
 * Main function: Upload a file to Shopify and return its GID
 * This is the primary export used by the product creation flow
 */
export async function uploadFileToShopify(file: any): Promise<string> {
  console.log('[Upload] Starting upload for:', file.name);

  // 1. Convert file to buffer (may resize if image is too large)
  const { buffer, mimeType } = await fileToBuffer(file);
  console.log('[Upload] Converted to buffer, size:', buffer.length, 'mimeType:', mimeType);

  // 2. Stage the upload
  const { url, resourceUrl } = await stageFileForUpload(buffer.length, mimeType, file.name);
  console.log('[Upload] Staged, uploading to:', url.substring(0, 50) + '...');

  // 3. Upload to GCS
  await uploadToGCS(url, buffer, mimeType);

  // 4. Create file record in Shopify
  const fileId = await createFileRecord(resourceUrl, mimeType);
  console.log('[Upload] Complete! File ID:', fileId);

  return fileId;
}



// Helper: Poll for File URL
export async function pollForFileUrl(fileId: string, maxAttempts = 10, interval = 1000): Promise<string | null> {
  const query = `
    query getFileUrl($id: ID!) {
      node(id: $id) {
        ... on GenericFile {
          url
          fileStatus
        }
        ... on MediaImage {
          image {
            url
          }
          fileStatus
        }
      }
    }
  `;

  for (let i = 0; i < maxAttempts; i++) {
    const data = await shopifyFetch(query, { id: fileId });
    const node = data.node;

    if (node) {
      if (node.url) return node.url;
      if (node.image?.url) return node.image.url;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return null;
}


// 9. CREATE PRODUCT
export async function createProduct(data: { title: string; description: string; price: string; images: any[] }) {
  // 1. Upload all images using the new upload system
  const uploadPromises = data.images.map(async (file) => {
    const { buffer, mimeType } = await fileToBuffer(file);
    const { url, resourceUrl } = await stageFileForUpload(buffer.length, mimeType, file.name);
    await uploadToGCS(url, buffer, mimeType);
    return resourceUrl;
  });
  const imageUrls = await Promise.all(uploadPromises);

  // 2. Create Product (without variants initially)
  const createMutation = `
    mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
      productCreate(input: $input, media: $media) {
        product {
          id
          handle
          title
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const mediaInput = imageUrls.map(url => ({
    originalSource: url,
    mediaContentType: "IMAGE"
  }));

  const createVariables = {
    input: {
      title: data.title,
      descriptionHtml: data.description,
      status: "ACTIVE",
      variants: [
        {
          price: data.price
        }
      ]
    },
    media: mediaInput
  };

  const createResult = await shopifyFetch(createMutation, createVariables);

  if (createResult.productCreate.userErrors.length > 0) {
    console.error("Product Create Errors:", createResult.productCreate.userErrors);
    throw new Error("Failed to create product: " + JSON.stringify(createResult.productCreate.userErrors));
  }

  const product = createResult.productCreate.product;

  // 4. Return Optimistic Data Immediately
  const optimisticProduct = {
    ...product,
    priceRange: {
      minVariantPrice: {
        amount: data.price,
        currencyCode: product.priceRange?.minVariantPrice?.currencyCode || "INR"
      }
    },
  };

  return optimisticProduct;
}

// 2. UPDATE HERO SLIDE METAOBJECT
export async function updateHeroSlide(handle: string, data: any) {
  const fields = [
    { key: "heading", value: data.heading },
    { key: "subheading", value: data.subheading },
    { key: "button_text", value: data.buttonText },
    { key: "link", value: data.link }
  ];

  if (data.image_id || data.fileId) {
    fields.push({ key: "image", value: data.image_id || data.fileId });
  }

  logDebug("updateHeroSlide payload", { handle, fields });

  try {
    const result = await upsertMetaobject("hero_slide", handle, fields);
    logDebug("updateHeroSlide success", { id: result });
    return result;
  } catch (error: any) {
    logDebug("updateHeroSlide failed", { error: error.message, stack: error.stack });
    throw error;
  }
}

// 10. DELETE PRODUCT
export async function deleteProduct(productId: string) {
  const mutation = `
    mutation productDelete($input: ProductDeleteInput!) {
      productDelete(input: $input) {
        deletedProductId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: productId
    }
  };

  const result = await shopifyFetch(mutation, variables);

  if (result.productDelete.userErrors.length > 0) {
    console.error("Product Delete Errors:", result.productDelete.userErrors);
    throw new Error("Failed to delete product");
  }

  return result.productDelete.deletedProductId;
}

// 3. FETCH HERO SLIDES
export async function getHeroSlides(prefix: string = "") {
  const query = `
    query {
      metaobjects(type: "hero_slide", first: 20) {
        edges {
          node {
            id
            handle
            fields {
              key
              value
              reference {
                ... on MediaImage {
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query);
  const slides = data.metaobjects.edges.map((edge: any) => {
    const node = edge.node;
    const fields = node.fields.reduce((acc: any, field: any) => {
      acc[field.key] = field.value;
      if (field.key === "image" && field.reference) {
        acc.imageUrl = field.reference.image?.url;
      }
      return acc;
    }, {});

    return {
      id: node.id,
      handle: node.handle,
      ...fields
    };
  });

  if (prefix) {
    return slides.filter((slide: any) => slide.handle.startsWith(prefix));
  }

  return slides.filter((slide: any) => !slide.handle.startsWith("women-"));
}

// 4. FETCH GLOBAL MENU
export async function getGlobalMenu() {
  const query = `
    query {
      metaobjectByHandle(handle: { type: "global_mega_menu", handle: "main-menu" }) {
        fields {
          key
          value
          references(first: 100) {
            nodes {
              ... on MediaImage {
                id
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

  const data = await shopifyFetch(query);
  const metaobject = data.metaobjectByHandle;
  if (!metaobject) return null;

  let menuJson: any = null;
  let imageMap: Record<string, { url: string, id: string }> = {};

  metaobject.fields.forEach((field: any) => {
    if (field.key === "menu_structure_json") {
      menuJson = JSON.parse(field.value);
    }
    if (field.key === "all_menu_images" && field.references) {
      field.references.nodes.forEach((node: any) => {
        if (node.image?.url) {
          imageMap[node.id] = { url: node.image.url, id: node.id };
        }
      });
    }
  });

  if (!menuJson) return null;

  if (menuJson.menu_tabs) {
    menuJson.menu_tabs.forEach((tab: any) => {
      if (tab.carousel) {
        tab.carousel.forEach((img: any) => {
          if (imageMap[img.src]) {
            const mapped = imageMap[img.src];
            img.src = mapped.url;
            img.imageId = mapped.id;
          }
        });
        if (!tab.images) {
          tab.images = tab.carousel;
        }
      }
      if (tab.images) {
        tab.images.forEach((img: any) => {
          if (imageMap[img.src]) {
            const mapped = imageMap[img.src];
            img.src = mapped.url;
            img.imageId = mapped.id;
          }
        });
      }
    });
  }

  return menuJson.menu_tabs;
}

// 5. UPDATE GLOBAL MENU
export async function updateGlobalMenu(menuTabs: any[]) {
  const allFileIds = extractMediaGids(menuTabs);
  const cleanTabs = JSON.parse(JSON.stringify(menuTabs));

  cleanTabs.forEach((tab: any) => {
    if (tab.carousel) {
      tab.carousel.forEach((img: any) => {
        if (img.imageId) {
          img.src = img.imageId;
        }
        delete img.imageId;
      });
    }
    if (tab.images) {
      tab.images.forEach((img: any) => {
        if (img.imageId) {
          img.src = img.imageId;
        }
        delete img.imageId;
      });
    }
  });

  const finalJson = { menu_tabs: cleanTabs };

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
    handle: { type: "global_mega_menu", handle: "main-menu" },
    metaobject: {
      fields: [
        { key: "menu_structure_json", value: JSON.stringify(finalJson) },
        { key: "all_menu_images", value: JSON.stringify(allFileIds) }
      ]
    }
  };

  const result = await shopifyFetch(mutation, variables);

  if (result.metaobjectUpsert.userErrors.length > 0) {
    console.error("Error updating global menu:", result.metaobjectUpsert.userErrors);
    throw new Error("Failed to update global menu: " + JSON.stringify(result.metaobjectUpsert.userErrors));
  }

  return result;
}

// 6. FETCH COLLECTION PAGE LAYOUT
export async function getCollectionPage(handle: string) {
  const query = `
    query getCollectionPage($handle: String!) {
      metaobjectByHandle(handle: { type: "collection_page_layout", handle: $handle }) {
        id
        handle
        fields {
          key
          value
          reference {
            ... on Metaobject {
              handle
              fields {
                key
                value
                reference {
                  ... on MediaImage {
                    id
                    image {
                      url
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

  const data = await shopifyFetch(query, { handle });
  const metaobject = data.metaobjectByHandle;

  if (!metaobject) {
    console.log("getCollectionPage: No metaobject found for handle:", handle);
    return null;
  }

  const result: any = {
    id: metaobject.id,
    handle: metaobject.handle,
    banner: {},
    window1: {},
    window2: {},
    products: [],
    focalSection: {},
    collectionGrid: []
  };

  const contentJsonField = metaobject.fields.find((f: any) => f.key === "content_json");
  if (contentJsonField && contentJsonField.value) {
    try {
      const parsedData = JSON.parse(contentJsonField.value);
      return {
        id: metaobject.id,
        handle: metaobject.handle,
        ...parsedData
      };
    } catch (e) {
      console.error("Failed to parse content_json for handle:", handle, e);
    }
  }

  metaobject.fields.forEach((field: any) => {
    if (field.key === "banner" && field.reference) {
      result.banner = parseMetaobjectFields(field.reference.fields);
    } else if (field.key === "window_1" && field.reference) {
      result.window1 = parseMetaobjectFields(field.reference.fields);
    } else if (field.key === "window_2" && field.reference) {
      result.window2 = parseMetaobjectFields(field.reference.fields);
    } else if (field.key === "product_grid" && field.reference) {
      const gridFields = parseMetaobjectFields(field.reference.fields);
      if (gridFields.products_json) {
        try {
          result.products = JSON.parse(gridFields.products_json);
        } catch (e) {
          result.products = [];
        }
      }
    } else if (field.key === "focal_section" && field.reference) {
      result.focalSection = parseMetaobjectFields(field.reference.fields);
    } else if (field.key === "collection_grid" && field.references) {
      result.collectionGrid = field.references.nodes.map((node: any) => ({ id: node.id, ...parseMetaobjectFields(node.fields) }));
    }
  });

  return result;
}

export async function updateCollectionPage(handle: string, data: any) {
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
    handle: { type: "collection_page_layout", handle: handle },
    metaobject: {
      fields: [
        { key: "content_json", value: JSON.stringify(data) }
      ]
    }
  };

  const result = await shopifyFetch(mutation, variables);
  return result;
}

function parseMetaobjectFields(fields: any[]) {
  return fields.reduce((acc: any, field: any) => {
    acc[field.key] = field.value;
    if (field.reference) {
      if (field.reference.image?.url) {
        acc[`image`] = field.reference.image.url;
        acc[`image_url`] = field.reference.image.url;
      }
      if (field.reference.id) {
        acc[`image_id`] = field.reference.id;
      }
    }
    return acc;
  }, {});
}

export async function getProducts(first = 10) {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query, { first });
  return data.products.edges;
}

export async function getProductByHandle(handle: string) {
  const query = `
    query getProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        handle
        descriptionHtml
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query, { handle });
  return data.productByHandle;
}

export async function getCategoryPage(handle: string) {
  const query = `
    query getCategoryPage($handle: String!) {
      metaobjectByHandle(handle: { type: "category_page", handle: $handle }) {
        id
        handle
        fields {
          key
          value
          reference {
            ... on Metaobject {
              handle
              fields {
                key
                value
                reference {
                  ... on MediaImage {
                    id
                    image {
                      url
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

  const data = await shopifyFetch(query, { handle });
  const metaobject = data.metaobjectByHandle;

  if (!metaobject) return null;

  const result: any = {
    id: metaobject.id,
    handle: metaobject.handle,
    hero_slide: {},
    sections: []
  };

  metaobject.fields.forEach((field: any) => {
    if (field.key === "hero_slide" && field.reference) {
      result.hero_slide = parseMetaobjectFields(field.reference.fields);
    }
  });

  return result;
}

// 9. GET PAGE CONTENT (by slug stored in content_json)
export async function getPageContent(slug: string) {
  // Query all page_content metaobjects and find the one with matching slug
  const query = `
    query getPagesBySlug {
      metaobjects(type: "page_content", first: 100) {
        edges {
          node {
            id
            handle
            fields {
              key
              value
              reference {
                ... on MediaImage {
                  id
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query, {});
  const edges = data.metaobjects?.edges || [];

  // Find the page with matching slug in content_json
  for (const edge of edges) {
    const metaobject = edge.node;
    const fields = parseMetaobjectFields(metaobject.fields);

    // Check if content_json contains matching slug
    if (fields.content_json) {
      try {
        const parsed = JSON.parse(fields.content_json);
        if (parsed.slug === slug) {
          return {
            ...parsed,
            metaobject_handle: metaobject.handle,
            metaobject_id: metaobject.id
          };
        }
      } catch (e) {
        console.error('[getPageContent] Failed to parse content_json for handle:', metaobject.handle);
      }
    }

    // Also check metaobject handle directly for legacy support
    if (metaobject.handle === slug) {
      if (fields.content_json) {
        try {
          const parsed = JSON.parse(fields.content_json);
          return {
            ...parsed,
            metaobject_handle: metaobject.handle,
            metaobject_id: metaobject.id
          };
        } catch (e) { }
      }
      return {
        ...fields,
        metaobject_handle: metaobject.handle,
        metaobject_id: metaobject.id
      };
    }
  }

  return null;
}

// 10. GET PAGE CONTENT BY SLUG (with metaobject ID)
export async function getPageContentBySlug(slug: string) {
  const result = await getPageContent(slug);
  return result;
}

// 11. DELETE PAGE CONTENT
export async function deletePageContent(metaobjectId: string) {
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

  const result = await shopifyFetch(mutation, { id: metaobjectId });

  if (result.metaobjectDelete.userErrors.length > 0) {
    const errors = result.metaobjectDelete.userErrors.map((e: any) => e.message).join(', ');
    throw new Error(`Failed to delete page content: ${errors}`);
  }

  return result.metaobjectDelete.deletedId;
}
