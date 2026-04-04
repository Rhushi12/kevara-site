require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const token = process.env.SHOPIFY_ADMIN_TOKEN;
fetch('https://bkbkiz-7h.myshopify.com/admin/api/2024-07/graphql.json', {
  method: 'POST',
  headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query { __type(name: "Mutation") { fields { name } } }`
  })
})
  .then(res => res.json())
  .then(json => {
    const fields = json.data.__type.fields.map(f => f.name);
    const discountMuts = fields.filter(f => f.toLowerCase().includes('discount'));
    fs.writeFileSync('discount-mutations.txt', discountMuts.join('\n'));
    console.log('Written to discount-mutations.txt');
  })
  .catch(console.error);
