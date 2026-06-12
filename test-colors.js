const https = require('https');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) process.env[k] = envConfig[k];

const q = `query { metaobjects(type: "custom_product", first: 5) { edges { node { id handle fields { key value } } } } }`;
const data = JSON.stringify({query: q});

const options = {
    hostname: process.env.SHOPIFY_STORE_DOMAIN,
    path: '/admin/api/2024-01/graphql.json',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
        'Content-Length': data.length
    }
};

const req = https.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const j = JSON.parse(body);
        const products = j.data.metaobjects.edges.map(e => ({
            handle: e.node.handle,
            colors: e.node.fields.find(f => f.key === 'colors')?.value
        }));
        console.log(JSON.stringify(products, null, 2));
    });
});
req.write(data);
req.end();
