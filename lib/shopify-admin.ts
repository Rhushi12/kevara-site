
import { Buffer } from 'buffer';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

import { extractMediaGids } from './shopify-utils';

function logDebug(message: string, data?: any) {
}

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Exported fetch function for admin API with timeout and retry
export async function shopifyFetch(query: string, variables: any = {}, options?: {
  cache?: RequestCache;
  timeout?: number;
  retries?: number;
}) {
  const url = `https://${domain}/admin/api/2024-07/graphql.json`;
  const timeout = options?.timeout ?? 30000; // 30 second default timeout
  const maxRetries = options?.retries ?? 3;
  const cacheOption = options?.cache ?? 'no-store';

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken!,
        },
        body: JSON.stringify({ query, variables }),
        cache: cacheOption,
      }, timeout);

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
      lastError = error;
      console.error(`Shopify Fetch attempt ${attempt}/${maxRetries} failed:`, error.message);

      // Don't retry on GraphQL errors or auth errors
      if (error.message?.includes('GraphQL') || error.message?.includes('401')) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

async function upsertMetaobject(type: string, handle: string, fields: any[], publish: boolean = true) {
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

  const metaobjectInput: any = { fields };
  if (publish) {
    metaobjectInput.capabilities = {
      publishable: {
        status: "ACTIVE"
      }
    };
  }

  const variables = {
    handle: { type, handle },
    metaobject: metaobjectInput
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
 * Convert File to Buffer for upload
 * Only resizes if image exceeds Shopify's 20MP limit (very rare)
 * Otherwise uploads the original image preserving quality
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

  // Log original file info

  // Only resize images if they exceed Shopify's 20MP limit (very rare for web uploads)
  if (mimeType.startsWith('image/') && !mimeType.includes('gif')) {
    try {
      // Dynamic import of sharp to prevent serverless function failures when sharp is unavailable
      const sharp = (await import('sharp')).default;
      const image = sharp(buffer);
      const metadata = await image.metadata();


      // Shopify limit is 20MP = 20,000,000 pixels
      const SHOPIFY_MAX_PIXELS = 20000000;
      const currentPixels = (metadata.width || 0) * (metadata.height || 0);

      if (currentPixels > SHOPIFY_MAX_PIXELS) {
        // Calculate what dimension to resize to (maintain aspect ratio)
        const scaleFactor = Math.sqrt(SHOPIFY_MAX_PIXELS / currentPixels);
        const newWidth = Math.floor((metadata.width || 4000) * scaleFactor);
        const newHeight = Math.floor((metadata.height || 4000) * scaleFactor);


        const resizedBuffer = await image
          .resize(newWidth, newHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 90 }) // Higher quality for large images
          .toBuffer();

        buffer = resizedBuffer;
        mimeType = 'image/jpeg';

      }
      // If under 20MP, upload original without any resizing
    } catch (err) {
      console.error('[Upload] Image processing failed (sharp may not be available), uploading original:', err);
      // Continue with original if processing fails
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


  const data = await shopifyFetch(mutation, variables);

  if (data.fileCreate.userErrors?.length > 0) {
    const errors = data.fileCreate.userErrors.map((e: any) => e.message).join(', ');
    throw new Error(`File creation failed: ${errors}`);
  }

  const createdFile = data.fileCreate.files[0];
  if (!createdFile) {
    throw new Error('No file returned from fileCreate mutation');
  }


  return createdFile.id;
}

/**
 * Main function: Upload a file to Shopify and return its GID
 * This is the primary export used by the product creation flow
 */
export async function uploadFileToShopify(file: any): Promise<string> {

  // 1. Convert file to buffer (may resize if image is too large)
  const { buffer, mimeType } = await fileToBuffer(file);

  // 2. Stage the upload
  const { url, resourceUrl } = await stageFileForUpload(buffer.length, mimeType, file.name);

  // 3. Upload to GCS
  await uploadToGCS(url, buffer, mimeType);

  // 4. Create file record in Shopify
  const fileId = await createFileRecord(resourceUrl, mimeType);

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

  // Support both R2 URLs (fileUrl) and Shopify file IDs (fileId)
  if (data.fileUrl) {
    // R2 URL - store directly as image_url (text field)
    fields.push({ key: "image_url", value: data.fileUrl });
  } else if (data.image_id || data.fileId) {
    // Shopify file ID - store in image field (file reference)
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
      // Handle Shopify file reference (legacy)
      if (field.key === "image" && field.reference) {
        acc.imageUrl = field.reference.image?.url;
      }
      // Handle R2 URL stored as text field (new)
      if (field.key === "image_url" && field.value) {
        acc.imageUrl = field.value;
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
  const imageMap: Record<string, { url: string, id: string }> = {};

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
// 11. WHOLESALE INQUIRIES

async function createMetaobjectDefinition(type: string, name: string, fieldDefinitions: any[]) {
  const mutation = `
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition {
          id
          type
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    definition: {
      name,
      type,
      access: {
        storefront: "PUBLIC_READ"
      },
      fieldDefinitions
    }
  };

  const result = await shopifyFetch(mutation, variables);

  if (result.metaobjectDefinitionCreate.userErrors.length > 0) {
    console.error(`Failed to create definition for ${type}:`, result.metaobjectDefinitionCreate.userErrors);
    throw new Error(`Failed to create definition: ${JSON.stringify(result.metaobjectDefinitionCreate.userErrors)}`);
  }

  return result.metaobjectDefinitionCreate.metaobjectDefinition.id;
}

async function ensureWholesaleDefinition() {

  const allRequiredFields = [
    { key: "name", name: "Name", type: "single_line_text_field" },
    { key: "email", name: "Email", type: "single_line_text_field" },
    { key: "phone", name: "Phone", type: "single_line_text_field" },
    { key: "requirement_type", name: "Requirement Type", type: "single_line_text_field" },
    { key: "requirement", name: "Requirement", type: "single_line_text_field" },
    { key: "state", name: "State", type: "single_line_text_field" },
    { key: "city", name: "City", type: "single_line_text_field" },
    { key: "address", name: "Address", type: "multi_line_text_field" },
    { key: "description", name: "Description", type: "multi_line_text_field" },
    { key: "product_title", name: "Product Title", type: "single_line_text_field" },
    { key: "product_handle", name: "Product Handle", type: "single_line_text_field" },
    { key: "date", name: "Date", type: "single_line_text_field" }
  ];

  // First check if definition exists and what fields it has
  const checkQuery = `
    query {
      metaobjectDefinitionByType(type: "wholesale_inquiry") {
        id
        fieldDefinitions {
          key
        }
      }
    }
  `;

  const checkResult = await shopifyFetch(checkQuery);

  if (!checkResult.metaobjectDefinitionByType) {
    // Definition doesn't exist, create it
    await createMetaobjectDefinition("wholesale_inquiry", "Wholesale Inquiry", allRequiredFields);
    return;
  }

  // Definition exists, check for missing fields
  const existingFieldKeys = new Set(
    checkResult.metaobjectDefinitionByType.fieldDefinitions.map((f: any) => f.key)
  );

  const missingFields = allRequiredFields.filter(f => !existingFieldKeys.has(f.key));

  if (missingFields.length === 0) {
    return;
  }


  // Update the definition with missing fields
  const updateMutation = `
    mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
      metaobjectDefinitionUpdate(id: $id, definition: $definition) {
        metaobjectDefinition {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const updateResult = await shopifyFetch(updateMutation, {
    id: checkResult.metaobjectDefinitionByType.id,
    definition: {
      fieldDefinitions: missingFields.map(f => ({
        create: {
          key: f.key,
          name: f.name,
          type: f.type
        }
      }))
    }
  });

  if (updateResult.metaobjectDefinitionUpdate.userErrors?.length > 0) {
    console.error("Failed to update wholesale_inquiry definition:", updateResult.metaobjectDefinitionUpdate.userErrors);
    throw new Error("Failed to update wholesale_inquiry definition: " + JSON.stringify(updateResult.metaobjectDefinitionUpdate.userErrors));
  }

}

export async function createWholesaleInquiry(data: any) {
  const handle = `inquiry-${Date.now()}`;
  const fields = [
    { key: "name", value: data.name },
    { key: "email", value: data.email },
    { key: "phone", value: data.phone },
    { key: "requirement_type", value: data.requirementType || "" },
    { key: "requirement", value: data.requirement || "" },
    { key: "state", value: data.state || "" },
    { key: "city", value: data.city || "" },
    { key: "address", value: data.address || "" },
    { key: "description", value: data.description || "" },
    { key: "product_title", value: data.product_title || "" },
    { key: "product_handle", value: data.product_handle || "" },
    { key: "date", value: data.date }
  ];

  logDebug("createWholesaleInquiry payload", { handle, fields });

  try {
    const result = await upsertMetaobject("wholesale_inquiry", handle, fields, false);
    logDebug("createWholesaleInquiry success", { id: result });
    return result;
  } catch (error: any) {
    // Handle missing definition or missing field definitions
    if (error.message && (
      error.message.includes("No metaobject definition exists") ||
      error.message.includes("Field definition") && error.message.includes("does not exist")
    )) {
      await ensureWholesaleDefinition();
      // Retry
      const result = await upsertMetaobject("wholesale_inquiry", handle, fields, false);
      return result;
    }
    console.error("Failed to create wholesale inquiry:", error);
    throw error;
  }
}

export async function getWholesaleLeads() {
  const query = `
    query {
      metaobjects(type: "wholesale_inquiry", first: 50, reverse: true) {
        edges {
          node {
            id
            handle
            updatedAt
            fields {
              key
              value
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch(query);
  return data.metaobjects.edges.map((edge: any) => {
    const node = edge.node;
    const fields = node.fields.reduce((acc: any, field: any) => {
      acc[field.key] = field.value;
      return acc;
    }, {});

    return {
      id: node.id,
      handle: node.handle,
      updatedAt: node.updatedAt,
      ...fields
    };
  });
}

// ============================================================================
// OFFER SLIDES PERSISTENCE
// ============================================================================

/**
 * Get offer slides from metaobject
 */
export async function getOfferSlides() {
  const query = `
    query {
      metaobjectByHandle(handle: { type: "offer_config", handle: "main-offer" }) {
        id
        fields {
          key
          value
          references(first: 20) {
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

  if (!metaobject) {
    return null;
  }

  let slidesJson: any = null;
  const imageMap: Record<string, string> = {};

  metaobject.fields.forEach((field: any) => {
    if (field.key === "slides_json") {
      try {
        slidesJson = JSON.parse(field.value);
      } catch (e) {
        console.error("[getOfferSlides] Failed to parse slides_json:", e);
      }
    }
    if (field.key === "slide_images" && field.references) {
      field.references.nodes.forEach((node: any) => {
        if (node.image?.url) {
          imageMap[node.id] = node.image.url;
        }
      });
    }
  });

  if (!slidesJson) return null;

  // Resolve image GIDs to URLs
  if (Array.isArray(slidesJson)) {
    slidesJson.forEach((slide: any) => {
      if (slide.image_id && imageMap[slide.image_id]) {
        slide.image = imageMap[slide.image_id];
      }
    });
  }

  return slidesJson;
}

/**
 * Ensure offer_config metaobject definition exists
 */
async function ensureOfferDefinition() {
  const checkQuery = `
    query {
      metaobjectDefinitionByType(type: "offer_config") {
        id
      }
    }
  `;

  const checkResult = await shopifyFetch(checkQuery);
  if (checkResult.metaobjectDefinitionByType) {
    return; // Already exists
  }

  const createMutation = `
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const definition = {
    name: "Offer Config",
    type: "offer_config",
    fieldDefinitions: [
      { key: "slides_json", name: "Slides JSON", type: "json" },
      { key: "slide_images", name: "Slide Images", type: "list.file_reference" }
    ]
  };

  const result = await shopifyFetch(createMutation, { definition });
  if (result.metaobjectDefinitionCreate.userErrors?.length > 0) {
    console.error("[ensureOfferDefinition] Failed:", result.metaobjectDefinitionCreate.userErrors);
    throw new Error("Failed to create offer_config definition");
  }
}

/**
 * Save offer slides to metaobject
 */
export async function saveOfferSlides(slides: any[]) {
  // Extract all image GIDs for references
  const imageGids: string[] = [];
  const slidesWithGids = slides.map(slide => {
    const slideData = { ...slide };
    if (slide.image_id && slide.image_id.startsWith("gid://")) {
      imageGids.push(slide.image_id);
    }
    return slideData;
  });

  const fields = [
    { key: "slides_json", value: JSON.stringify(slidesWithGids) },
    { key: "slide_images", value: JSON.stringify(imageGids) }
  ];

  logDebug("saveOfferSlides payload", { fields, imageGids });

  try {
    // Pass false for publish to avoid "Capability is not enabled: publishable" error
    const result = await upsertMetaobject("offer_config", "main-offer", fields, false);
    logDebug("saveOfferSlides success", { id: result });
    return result;
  } catch (error: any) {
    if (error.message && error.message.includes("No metaobject definition exists")) {
      await ensureOfferDefinition();
      const result = await upsertMetaobject("offer_config", "main-offer", fields, false);
      return result;
    }
    console.error("[saveOfferSlides] Failed:", error);
    throw error;
  }
}
