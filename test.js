require('dotenv').config({ path: '.env.local' });

async function main() {
    const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ADMIN_TOKEN;
    
    if (!domain || !token) {
        console.error("Missing Shopify credentials");
        return;
    }

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
              }
            }
          }
        }
      }
    `;

    const res = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token
        },
        body: JSON.stringify({ query })
    });

    const data = await res.json();
    const products = data.data.metaobjects.edges;
    
    let count = 0;
    products.forEach((p) => {
        const titleField = p.node.fields.find((f) => f.key === 'title');
        const title = titleField ? titleField.value : '';
        if (title.includes('2002')) {
            count++;
            console.log(`Product: ${title} (${p.node.handle})`);
            const colorsField = p.node.fields.find((f) => f.key === 'colors');
            if (colorsField && colorsField.value) {
                try {
                    const colors = JSON.parse(colorsField.value);
                    console.log(`  Colors: ${colors.map((c) => c.name).join(', ')}`);
                } catch (e) {
                    console.log(`  Colors: Invalid JSON (${colorsField.value})`);
                }
            } else {
                console.log(`  Colors: None`);
            }
        }
    });
    
    console.log(`Total 2002 products: ${count}`);
}

main().catch(console.error);
