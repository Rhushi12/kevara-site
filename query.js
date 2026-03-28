require('dotenv').config({ path: '.env.local' });

const mutation = `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
        id
    }
    userErrors {
        field
        message
    }
    }
}
`;

const variables = {
    basicCodeDiscount: {
        title: "NEWRANDOM456",
        code: "NEWRANDOM456",
        startsAt: new Date().toISOString(),
        customerSelection: { all: true },
        customerGets: {
            value: { discountAmount: { amount: 500, appliesOnEachItem: false } },
            items: { all: true }
        },
        appliesOncePerCustomer: false
    }
};

fetch('https://bkbkiz-7h.myshopify.com/admin/api/2024-07/graphql.json', {
  method: 'POST',
  headers: {
    'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: mutation, variables })
})
.then(r => r.json())
.then(j => console.log("ERRORS:", JSON.stringify(j.data?.discountCodeBasicCreate?.userErrors, null, 2)))
.catch(console.error);
