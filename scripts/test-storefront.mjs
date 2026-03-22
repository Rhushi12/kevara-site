const token = 'cd7ffdac196549a4155c6671269a06cf';
const handle = 'product_1765255289244_oidt3j';
const domain = 'bkbkiz-7h.myshopify.com';

async function test() {
    const res = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': token
        },
        body: JSON.stringify({
            query: `
                query {
                    product(handle: "${handle}") {
                        id
                        title
                        variants(first: 10) {
                            edges {
                                node { id title }
                            }
                        }
                    }
                }
            `
        })
    });
    console.log(await res.json());
}
test();
