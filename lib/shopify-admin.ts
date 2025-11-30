
const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

import fs from 'fs';
import path from 'path';
import { extractMediaGids } from './save-page-data';

const DEBUG_LOG_PATH = path.resolve(process.cwd(), 'backend-debug.log');

function logDebug(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, logMessage);
  } catch (e) {
    console.error("Failed to write to debug log", e);
  }
}

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

// 1. UPLOAD FILE TO SHOPIFY FILES API
export async function uploadFileToShopify(file: File) {
  const resourceUrl = await stageAndUploadFile(file);

  // Step C: Create the File Record in Shopify
  const fileCreateQuery = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
          ... on GenericFile {
            url
          }
          ... on MediaImage {
            image {
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

  const contentType = file.type.startsWith("image/") ? "IMAGE" : "FILE";

  const fileVariables = {
    files: [{
      originalSource: resourceUrl,
      contentType: contentType
    }]
  };

  const fileData = await shopifyFetch(fileCreateQuery, fileVariables);

  if (fileData.fileCreate.userErrors.length > 0) {
    console.error("File Create Errors:", fileData.fileCreate.userErrors);
    throw new Error("Failed to create file record in Shopify");
  }

  return fileData.fileCreate.files[0].id;
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
      if (node.fileStatus === 'FAILED') throw new Error("File processing failed");
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return null;
}

// Helper: Stage and Upload to GCS
async function stageAndUploadFile(file: File) {
  // Step A: Request Staged Upload
  const stagedUploadQuery = `
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

  const stagedVariables = {
    input: [{
      resource: "IMAGE",
      filename: file.name,
      mimeType: file.type,
      httpMethod: "POST",
    }]
  };

  const stagedData = await shopifyFetch(stagedUploadQuery, stagedVariables);

  if (stagedData.stagedUploadsCreate.userErrors.length > 0) {
    console.error("Staged Upload Errors:", stagedData.stagedUploadsCreate.userErrors);
    throw new Error("Failed to create staged upload");
  }

  const target = stagedData.stagedUploadsCreate.stagedTargets[0];

  // Step B: Upload to the Signed URL (Google Cloud Storage)
  const formData = new FormData();
  target.parameters.forEach((p: any) => formData.append(p.name, p.value));
  formData.append("file", file);

  const uploadRes = await fetch(target.url, {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    console.error("GCS Upload Failed:", await uploadRes.text());
    throw new Error("Failed to upload file to storage");
  }

  return target.resourceUrl;
}

// 9. CREATE PRODUCT
export async function createProduct(data: { title: string; description: string; price: string; images: File[] }) {
  // 1. Upload all images to get resource URLs
  const imageUrls = await Promise.all(data.images.map(file => stageAndUploadFile(file)));
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
      status: "ACTIVE"
    },
    media: mediaInput
  };

  const createResult = await shopifyFetch(createMutation, createVariables);

  if (createResult.productCreate.userErrors.length > 0) {
    console.error("Product Create Errors:", createResult.productCreate.userErrors);
    throw new Error("Failed to create product: " + JSON.stringify(createResult.productCreate.userErrors));
  }

  const product = createResult.productCreate.product;
  const defaultVariantId = product.variants?.edges[0]?.node?.id;
  console.log(`[createProduct] Created product ${product.id}. Default Variant ID: ${defaultVariantId}`);

  // 3. Update Default Variant Price
  if (defaultVariantId && data.price) {
    console.log(`[createProduct] Updating price to ${data.price} for variant ${defaultVariantId}`);
    try {
      const updateVariantMutation = `
        mutation productVariantUpdate($input: ProductVariantInput!) {
          productVariantUpdate(input: $input) {
            productVariant {
              id
              price
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const updateVariables = {
        input: {
          id: defaultVariantId,
          price: data.price
        }
      };

      const updateResult = await shopifyFetch(updateVariantMutation, updateVariables);
      if (updateResult.productVariantUpdate.userErrors.length > 0) {
        console.error("Variant Update Errors:", JSON.stringify(updateResult.productVariantUpdate.userErrors));
      } else {
        console.log(`[createProduct] Price update successful. New Price: ${updateResult.productVariantUpdate.productVariant.price}`);
      }
    } catch (error: any) {
      console.error("Failed to update variant price - mutation may not be supported:", error.message);
      // Don't throw - allow product creation to succeed even if price update fails
    }
  } else {
    console.warn("[createProduct] Skipping price update. Missing variant ID or price.");
  }

  // 4. Return Optimistic Data Immediately
  // We don't wait for Shopify to process images or price updates fully.
  // We manually construct the response to make the UI feel instant.

  const optimisticProduct = {
    ...product,
    priceRange: {
      minVariantPrice: {
        amount: data.price,
        currencyCode: product.priceRange?.minVariantPrice?.currencyCode || "INR"
      }
    },
    // Images might not be ready in the 'product' object yet if they are processing,
    // but we can try to return what we have or just trust the UI to handle the loading state.
    // Actually, the 'createResult' already returns the product with images linked (even if processing).
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

  // Default behavior: return slides that DON'T start with specific prefixes (like 'women-') if no prefix requested
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

  // Replace image GIDs with URLs in the JSON, but keep the ID for updates
  if (menuJson.menu_tabs) {
    menuJson.menu_tabs.forEach((tab: any) => {
      if (tab.carousel) {
        tab.carousel.forEach((img: any) => {
          if (imageMap[img.src]) {
            const mapped = imageMap[img.src];
            img.src = mapped.url;
            img.imageId = mapped.id; // Store GID for updates
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
  // 1. Extract all image IDs using the helper
  const allFileIds = extractMediaGids(menuTabs);

  // 2. Prepare JSON for storage
  const cleanTabs = JSON.parse(JSON.stringify(menuTabs)); // Deep copy

  cleanTabs.forEach((tab: any) => {
    if (tab.carousel) {
      tab.carousel.forEach((img: any) => {
        if (img.imageId) {
          img.src = img.imageId; // Restore GID
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
      ],
      capabilities: {
        publishable: {
          status: "ACTIVE"
        }
      }
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

  // 1. Try to read from the new "content_json" field (Unified Storage)
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
      // Fallback to legacy fields if parsing fails
    }
  }

  // 2. Fallback: Read from legacy individual fields (Backward Compatibility)
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

function parseMetaobjectFields(fields: any[]) {
  return fields.reduce((acc: any, field: any) => {
    acc[field.key] = field.value;
    if (field.reference) {
      if (field.reference.image?.url) {
        acc[`image`] = field.reference.image.url; // Override 'image' (GID) with URL for frontend
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

// 8. GET CATEGORY PAGE (for Women's Shop Essentials etc)
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
    // Add other sections as needed
  });

  return result;
}

// 9. GET PAGE CONTENT (Generic)
export async function getPageContent(handle: string) {
  const query = `
    query getPageContent($handle: String!) {
      metaobjectByHandle(handle: { type: "page_content", handle: $handle }) {
        id
        handle
        fields {
          key
          value
        }
      }
    }
  `;

  const data = await shopifyFetch(query, { handle });
  const metaobject = data.metaobjectByHandle;

  if (!metaobject) {
    console.log("getPageContent: No metaobject found for handle:", handle);
    return null;
  }

  // Parse the content_json field
  const contentJsonField = metaobject.fields.find((f: any) => f.key === "content_json");
  if (contentJsonField && contentJsonField.value) {
    try {
      return JSON.parse(contentJsonField.value);
    } catch (e) {
      console.error("Failed to parse content_json for handle:", handle, e);
      return null;
    }
  }

  return null;
}

// 7. UPDATE COLLECTION PAGE LAYOUT
export async function updateCollectionPage(handle: string, data: any) {
  // 1. Upsert Banner
  const bannerHandle = `${handle}-banner`;
  const bannerFields = [
    { key: "heading", value: data.banner?.heading },
    { key: "subheading", value: data.banner?.subheading },
    { key: "text_color", value: data.banner?.textColor || "#ffffff" },
    { key: "overlay_opacity", value: String(data.banner?.overlayOpacity || 0) },
    { key: "height", value: data.banner?.height || "medium" },
    { key: "text_alignment", value: data.banner?.textAlignment || "center" }
  ];
  if (data.banner?.image_id) bannerFields.push({ key: "image", value: data.banner.image_id });
  const bannerId = await upsertMetaobject("page_banner", bannerHandle, bannerFields);

  // 2. Upsert Windows
  const window1Handle = `${handle}-window-1`;
  const window1Fields = [
    { key: "heading", value: data.window1?.heading },
    { key: "subheading", value: data.window1?.subheading },
    { key: "link_text", value: data.window1?.linkText },
    { key: "link_url", value: data.window1?.linkUrl },
    { key: "text_color", value: data.window1?.textColor || "#ffffff" },
    { key: "overlay_opacity", value: String(data.window1?.overlayOpacity || 0) }
  ];
  if (data.window1?.image_id) window1Fields.push({ key: "image", value: data.window1.image_id });
  const window1Id = await upsertMetaobject("page_window", window1Handle, window1Fields);

  const window2Handle = `${handle}-window-2`;
  const window2Fields = [
    { key: "heading", value: data.window2?.heading },
    { key: "subheading", value: data.window2?.subheading },
    { key: "link_text", value: data.window2?.linkText },
    { key: "link_url", value: data.window2?.linkUrl },
    { key: "text_color", value: data.window2?.textColor || "#ffffff" },
    { key: "overlay_opacity", value: String(data.window2?.overlayOpacity || 0) }
  ];
  if (data.window2?.image_id) window2Fields.push({ key: "image", value: data.window2.image_id });
  const window2Id = await upsertMetaobject("page_window", window2Handle, window2Fields);

  // 3. Upsert Product Grid
  const gridHandle = `${handle}-grid`;
  const gridFields = [
    { key: "heading", value: data.products?.heading },
    { key: "subheading", value: data.products?.subheading },
    { key: "products_json", value: JSON.stringify(data.products?.products || []) }
  ];
  const gridId = await upsertMetaobject("product_grid_section", gridHandle, gridFields);

  // 4. Upsert Focal Section
  const focalHandle = `${handle}-focal`;
  const focalFields = [
    { key: "heading", value: data.focalSection?.heading },
    { key: "subheading", value: data.focalSection?.subheading },
    { key: "text_color", value: data.focalSection?.textColor || "#000000" },
    { key: "text_position", value: data.focalSection?.textPosition || "center" },
    { key: "overlay_opacity", value: String(data.focalSection?.overlayOpacity || 0) },
    { key: "height", value: data.focalSection?.height || "medium" }
  ];
  if (data.focalSection?.image_id) focalFields.push({ key: "image", value: data.focalSection.image_id });
  const focalId = await upsertMetaobject("focal_section", focalHandle, focalFields);

  // 5. Upsert Collection Grid
  const collectionGridIds = await Promise.all((data.collectionGrid || []).map(async (item: any, index: number) => {
    const itemHandle = `${handle}-grid-${index}`;
    const itemFields = [
      { key: "heading", value: item.heading },
      { key: "subheading", value: item.subheading },
      { key: "link", value: item.link }
    ];
    if (item.image_id) itemFields.push({ key: "image", value: item.image_id });
    return await upsertMetaobject("collection_grid_item", itemHandle, itemFields);
  }));

  // 6. Link to Collection Page Layout
  const fields = [
    { key: "banner", value: bannerId },
    { key: "window_1", value: window1Id },
    { key: "window_2", value: window2Id },
    { key: "product_grid", value: gridId },
    { key: "focal_section", value: focalId },
    { key: "collection_grid", value: JSON.stringify(collectionGridIds) },
  ];

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
      fields: fields,
      capabilities: {
        publishable: {
          status: "ACTIVE"
        }
      }
    }
  };

  const result = await shopifyFetch(mutation, variables);

  if (result.metaobjectUpsert.userErrors.length > 0) {
    console.error("Error updating collection page:", result.metaobjectUpsert.userErrors);
    throw new Error("Failed to update collection page: " + JSON.stringify(result.metaobjectUpsert.userErrors));
  }

  return result;
}

// 8. UPDATE CATEGORY PAGE (Generic)
export async function updateCategoryPage(handle: string, data: any) {
  // 1. Upsert Hero Slide
  let heroSlideId = null;
  if (data.hero_slide) {
    const heroHandle = `${handle}-hero`;
    heroSlideId = await updateHeroSlide(heroHandle, data.hero_slide);
  }

  // 2. Link to Category Page
  const fields = [];
  if (heroSlideId) {
    fields.push({ key: "hero_slide", value: heroSlideId });
  }

  // Add other sections if needed, for now just hero slide is common

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
    handle: { type: "category_page", handle: handle },
    metaobject: {
      fields: fields,
      capabilities: {
        publishable: {
          status: "ACTIVE"
        }
      }
    }
  };

  const result = await shopifyFetch(mutation, variables);

  if (result.metaobjectUpsert.userErrors.length > 0) {
    console.error("Error updating category page:", result.metaobjectUpsert.userErrors);
    throw new Error("Failed to update category page: " + JSON.stringify(result.metaobjectUpsert.userErrors));
  }

  return result;
}
