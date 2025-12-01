import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

if (!domain || !accessToken) {
    console.error('❌ Missing environment variables!');
    console.error('SHOPIFY_STORE_DOMAIN:', domain || 'MISSING');
    console.error('SHOPIFY_ADMIN_TOKEN:', accessToken ? 'SET' : 'MISSING');
    process.exit(1);
}

async function setupCustomProductDefinition() {
    const mutation = `
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition {
          name
          type
          fieldDefinitions {
            name
            key
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    const definition = {
        name: "Custom Product",
        type: "custom_product",
        fieldDefinitions: [
            {
                name: "Handle",
                key: "handle",
                type: "single_line_text_field",
                required: true,
                validations: []
            },
            {
                name: "Title",
                key: "title",
                type: "single_line_text_field",
                required: true,
                validations: []
            },
            {
                name: "Description",
                key: "description",
                type: "multi_line_text_field",
                required: false,
                validations: []
            },
            {
                name: "Price",
                key: "price",
                type: "single_line_text_field",
                required: true,
                validations: []
            },
            {
                name: "Currency",
                key: "currency",
                type: "single_line_text_field",
                required: false,
                validations: []
            },
            {
                name: "Images",
                key: "images",
                type: "list.file_reference",
                required: false,
                validations: []
            },
            {
                name: "Colors",
                key: "colors",
                type: "json",
                required: false,
                validations: []
            },
            {
                name: "Sizes",
                key: "sizes",
                type: "json",
                required: false,
                validations: []
            },
            {
                name: "Status",
                key: "status",
                type: "single_line_text_field",
                required: false,
                validations: []
            },
            {
                name: "Slug",
                key: "slug",
                type: "single_line_text_field",
                required: true,
                validations: []
            }
        ],
        access: {
            admin: "MERCHANT_READ_WRITE",
            storefront: "PUBLIC_READ"
        }
    };

    const response = await fetch(`https://${domain}/admin/api/2024-07/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken!,
        },
        body: JSON.stringify({
            query: mutation,
            variables: { definition }
        })
    });

    const result = await response.json();

    if (result.errors) {
        console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
        throw new Error('Failed to create metaobject definition');
    }

    if (result.data.metaobjectDefinitionCreate.userErrors.length > 0) {
        console.error('User Errors:', JSON.stringify(result.data.metaobjectDefinitionCreate.userErrors, null, 2));
        throw new Error('Failed to create metaobject definition');
    }

    console.log('✅ Custom Product metaobject definition created successfully!');
    console.log(JSON.stringify(result.data.metaobjectDefinitionCreate.metaobjectDefinition, null, 2));
}

setupCustomProductDefinition().catch(console.error);
