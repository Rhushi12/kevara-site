import { shopifyFetch } from './shopify-admin';

export interface CustomerInput {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  acceptsMarketing?: boolean;
}

// 1. CREATE CUSTOMER
export async function createShopifyCustomer(input: CustomerInput) {
  const mutation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      emailMarketingConsent: {
        marketingState: input.acceptsMarketing ? "SUBSCRIBED" : "NOT_SUBSCRIBED",
        marketingOptInLevel: "SINGLE_OPT_IN"
      },
      tags: ["lead_from_website"]
    }
  };

  const result = await shopifyFetch(mutation, variables);

  if (result.customerCreate.userErrors.length > 0) {
    // If email already exists, we should try to return that customer instead of failing
    const emailError = result.customerCreate.userErrors.find((e: any) => e.message.includes("taken"));
    if (emailError) {
      return await getCustomerByEmail(input.email);
    }

    console.error("Error creating customer:", result.customerCreate.userErrors);
    throw new Error("Failed to create customer: " + JSON.stringify(result.customerCreate.userErrors));
  }

  return result.customerCreate.customer;
}

// 2. GET CUSTOMER BY EMAIL
export async function getCustomerByEmail(email: string) {
  const query = `
    query getCustomer($query: String!) {
      customers(first: 1, query: $query) {
        edges {
          node {
            id
            email
            firstName
            lastName
            createdAt
            amountSpent {
              amount
              currencyCode
            }
            numberOfOrders
            tags
          }
        }
      }
    }
  `;

  const result = await shopifyFetch(query, { query: `email:${email}` });

  if (result.customers.edges.length === 0) {
    return null;
  }

  return result.customers.edges[0].node;
}

// 3. GET ALL CUSTOMERS (For Admin Dashboard)
export async function getShopifyCustomers(limit = 50) {
  const query = `
    query getCustomers($first: Int!) {
      customers(first: $first, sortKey: UPDATED_AT, reverse: true) {
        edges {
          node {
            id
            email
            firstName
            lastName
            createdAt
            amountSpent {
              amount
              currencyCode
            }
            numberOfOrders
            tags
            lastOrder {
              createdAt
            }
          }
        }
      }
    }
  `;

  const result = await shopifyFetch(query, { first: limit });

  return result.customers.edges.map((edge: any) => edge.node);
}

// 4. UPDATE CUSTOMER (e.g. on login to update last seen or simplified sync)
// Note: Shopify doesn't have a "last login" field we can easily write to without Metafields.
// For now we will just rely on "updatedAt" which changes on any update.
export async function updateShopifyCustomer(id: string, input: Partial<CustomerInput>) {
  const mutation = `
    mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
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
    input: {
      id: id,
      ...input
    }
  };

  const result = await shopifyFetch(mutation, variables);
  return result.customerUpdate.customer;
}
