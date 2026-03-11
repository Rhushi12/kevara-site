import { storefrontFetch } from '../lib/shopify-storefront';

async function verifyStorefront() {
    const handle = "product_1765254378168_nm5840";

    const { body } = await storefrontFetch({
        query: `
            query getProduct($handle: String!) {
                product(handle: $handle) {
                    id
                    title
                    variants(first: 10) {
                        edges {
                            node {
                                id
                                title
                                selectedOptions {
                                    name
                                    value
                                }
                            }
                        }
                    }
                }
            }
        `,
        variables: { handle }
    });

    console.log("Storefront API Response:", JSON.stringify(body, null, 2));
}

verifyStorefront();
