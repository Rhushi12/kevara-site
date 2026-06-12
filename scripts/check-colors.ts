import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { getCustomProducts } from '../lib/custom-products';

async function main() {
    const products = await getCustomProducts();
    console.log(`Total products: ${products.length}`);
    const productsWithColors = products.map(p => ({
        title: p.node.title,
        colors: p.node.colors,
        handle: p.node.handle
    }));
    console.log(JSON.stringify(productsWithColors.slice(0, 10), null, 2));
}

main().catch(console.error);
