const fs = require('fs');

async function testProductAPI() {
    try {
        const res = await fetch('http://localhost:3000/api/products');
        const data = await res.json();

        // Get the last product (most recently created)
        const lastProduct = data.products[data.products.length - 1];

        console.log('=== LAST PRODUCT ===');
        console.log(JSON.stringify(lastProduct, null, 2));

        // Write to file for easier viewing
        fs.writeFileSync('./last-product-debug.json', JSON.stringify(lastProduct, null, 2));
        console.log('\nWritten to last-product-debug.json');
    } catch (error) {
        console.error('Error:', error);
    }
}

testProductAPI();
