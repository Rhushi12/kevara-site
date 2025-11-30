import 'dotenv/config';
import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = require('dotenv').parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_TOKEN;
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

if (!domain || !token) {
  console.error("❌ Missing .env variables: SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Missing serviceAccountKey.json in project root.");
  console.error("Please download it from Firebase Console > Project Settings > Service Accounts and place it in the root directory.");
  process.exit(1);
}

// Initialize Firebase
const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const SHOPIFY_GRAPHQL_URL = `https://${domain}/admin/api/2024-01/graphql.json`;

async function shopifyRequest(query: string, variables: any = {}) {
  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token!,
    },
    body: JSON.stringify({ query, variables }),
  });

  const scopes = response.headers.get("X-Shopify-API-Scopes");
  if (scopes) {
    console.log("🔑 Current Access Scopes:", scopes);
  }

  const json = await response.json();
  if (json.errors) {
    console.error("API Error:", JSON.stringify(json.errors, null, 2));
    fs.writeFileSync('error.json', JSON.stringify(json.errors, null, 2));
    throw new Error("Shopify API Request Failed");
  }
  return json.data;
}

// --- Task 1: Image Migration Logic ---

async function migrateImageToShopify(firebaseUrl: string): Promise<string> {
  console.log(`   ⬇️ Fetching image from Firebase...`);
  const imgRes = await fetch(firebaseUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${firebaseUrl}`);
  const arrayBuffer = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
  const filename = `migrated-${Date.now()}.jpg`; // Simple naming

  // Step A: Staged Upload
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
      }
    }
  `;
  const stagedVariables = {
    input: [{
      resource: "FILE",
      filename: filename,
      mimeType: contentType,
      httpMethod: "POST",
      acl: "private"
    }]
  };
  const stagedData = await shopifyRequest(stagedUploadQuery, stagedVariables);
  const target = stagedData.stagedUploadsCreate.stagedTargets[0];

  // Step B: Upload to Signed URL
  const formData = new FormData();
  target.parameters.forEach((p: any) => formData.append(p.name, p.value));
  const blob = new Blob([buffer], { type: contentType });
  formData.append("file", blob as any, filename);

  await fetch(target.url, {
    method: "POST",
    body: formData,
  });

  // Step C: Create File
  const fileCreateQuery = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
        }
      }
    }
  `;
  const fileVariables = {
    files: [{
      originalSource: target.resourceUrl,
      contentType: "IMAGE"
    }]
  };
  const fileData = await shopifyRequest(fileCreateQuery, fileVariables);
  const fileId = fileData.fileCreate.files[0].id;
  console.log(`   ✅ Uploaded to Shopify: ${fileId}`);
  return fileId;
}

// --- Helper: Ensure Metaobject Definition Exists ---
async function ensureDefinition() {
  const query = `
    query {
      metaobjectDefinitionByType(type: "global_mega_menu") {
        id
      }
    }
  `;
  const data = await shopifyRequest(query);
  if (data.metaobjectDefinitionByType) {
    console.log("✅ Definition 'global_mega_menu' already exists.");
    return;
  }

  console.log("🔨 Creating 'global_mega_menu' definition...");
  const createMutation = `
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { type id }
        userErrors { field message }
      }
    }
  `;
  const variables = {
    definition: {
      name: "Global Mega Menu",
      type: "global_mega_menu",
      fieldDefinitions: [
        { key: "menu_structure_json", name: "Menu Structure JSON", type: "json" },
        { key: "all_menu_images", name: "All Menu Images", type: "list.file_reference" }
      ],
      access: { storefront: "PUBLIC_READ" }
    }
  };
  await shopifyRequest(createMutation, variables);
  console.log("✅ Created 'global_mega_menu' definition.");
}

// --- Task 2 & 3: Migration Logic ---

async function main() {
  console.log("🚀 Starting Menu Migration...");
  await ensureDefinition();

  // Fetch from Firestore
  const docRef = db.collection('config').doc('navigation');
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.log("⚠️ No navigation data found in Firestore (config/navigation).");
    return;
  }

  const data = docSnap.data();
  const menuItems = data?.items || [];

  if (menuItems.length === 0) {
    console.log("⚠️ Navigation items array is empty.");
    return;
  }

  const menuTabs: any[] = [];
  const allFileIds: string[] = [];

  for (const item of menuItems) {
    console.log(`Processing menu item: ${item.label}`);

    const menuItem: any = {
      id: item.id,
      label: item.label,
      href: item.href || '#',
      shopify_layout_type: item.shopify_layout_type,
      columns: item.columns || [],
      carousel: []
    };

    // Handle Images (using 'images' field as seen in Navbar.tsx/menuData.ts)
    if (item.images && Array.isArray(item.images)) {
      for (const img of item.images) {
        if (img.src && img.src.includes("firebase")) {
          try {
            const shopifyId = await migrateImageToShopify(img.src);
            allFileIds.push(shopifyId);
            menuItem.carousel.push({
              ...img,
              src: shopifyId
            });
          } catch (err) {
            console.error(`   ❌ Failed to migrate image ${img.src}:`, err);
            menuItem.carousel.push(img);
          }
        } else {
          menuItem.carousel.push(img);
        }
      }
    }

    menuTabs.push(menuItem);
  }

  // --- Task 3: Final Push ---
  console.log("📤 Uploading to Shopify Metaobject...");

  const finalJson = { menu_tabs: menuTabs };

  const upsertMutation = `
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

  const result = await shopifyRequest(upsertMutation, variables);
  if (result.metaobjectUpsert.userErrors.length > 0) {
    console.error("❌ Metaobject Upsert Failed:", result.metaobjectUpsert.userErrors);
    fs.writeFileSync('error.json', JSON.stringify(result.metaobjectUpsert.userErrors, null, 2));
  } else {
    console.log("🎉 Migration Complete! Metaobject ID:", result.metaobjectUpsert.metaobject.id);
  }
}

main().catch(console.error);
