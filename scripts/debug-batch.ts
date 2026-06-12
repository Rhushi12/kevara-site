import { getCustomProducts } from '../lib/custom-products';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const products = await getCustomProducts({ includeDrafts: true });
    const batch2002 = products.filter(p => p.node.title.includes('2002'));
    
    console.log(`Found ${batch2002.length} products for batch 2002`);
    
    batch2002.forEach(p => {
        const node = p.node;
        console.log(`Product: ${node.title} (${node.handle})`);
        console.log(`  Colors: ${node.colors ? node.colors.map((c: any) => `${c.name} [${c.hex}]`).join(', ') : 'None'}`);
        console.log(`  Primary Color: ${node.colors && node.colors.length > 0 ? node.colors[0].name : 'None'}`);
    });
}

main().catch(console.error);
