require('dotenv').config({ path: '.env.local' });
const { getCustomProducts } = require("../lib/custom-products");

async function main() {
    try {
        console.log("Fetching custom products...");
        const products = await getCustomProducts();

        if (products.length === 0) {
            console.log("No products found.");
            return;
        }

        const p = products[0];
        console.log("First Product:", p.node.title);
        console.log("Images:", JSON.stringify(p.node.images, null, 2));

        // Check if images are GIDs
        const firstImage = p.node.images.edges[0]?.node.url;
        if (firstImage && firstImage.startsWith("gid://")) {
            console.log("ISSUE DETECTED: Images are GIDs, not URLs!");
        } else {
            console.log("Images appear to be URLs.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
