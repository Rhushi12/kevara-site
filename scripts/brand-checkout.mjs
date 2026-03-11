// Script to apply Kevara branding to Shopify checkout
// Run: node scripts/brand-checkout.mjs

const DOMAIN = "bkbkiz-7h.myshopify.com";
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";

async function shopifyFetch(query, variables = {}) {
    const res = await fetch(`https://${DOMAIN}/admin/api/2024-07/graphql.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": TOKEN,
        },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) {
        console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
    }
    return json;
}

async function main() {
    // 1. Get the published checkout profile ID
    console.log("📦 Fetching checkout profiles...");
    const profileRes = await shopifyFetch(`{
        checkoutProfiles(first: 5) {
            edges {
                node {
                    id
                    name
                    isPublished
                }
            }
        }
    }`);

    const profiles = profileRes.data?.checkoutProfiles?.edges || [];
    console.log("Found profiles:", profiles.map(e => `${e.node.name} (published: ${e.node.isPublished})`));

    const publishedProfile = profiles.find(e => e.node.isPublished);
    if (!publishedProfile) {
        console.error("❌ No published checkout profile found!");
        return;
    }

    const profileId = publishedProfile.node.id;
    console.log(`✅ Using profile: ${publishedProfile.node.name} (${profileId})`);

    // 2. Apply Kevara branding
    console.log("\n🎨 Applying Kevara checkout branding...");
    const brandingRes = await shopifyFetch(`
        mutation checkoutBrandingUpsert($checkoutProfileId: ID!, $checkoutBrandingInput: CheckoutBrandingInput!) {
            checkoutBrandingUpsert(checkoutProfileId: $checkoutProfileId, checkoutBrandingInput: $checkoutBrandingInput) {
                checkoutBranding {
                    designSystem {
                        colors {
                            schemes {
                                scheme1 {
                                    base {
                                        background
                                        text
                                    }
                                    primaryButton {
                                        background
                                        text
                                    }
                                }
                            }
                        }
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `, {
        checkoutProfileId: profileId,
        checkoutBrandingInput: {
            designSystem: {
                colors: {
                    global: {
                        accent: "#0E4D55",
                        brand: "#0E4D55",
                    },
                    schemes: {
                        scheme1: {
                            base: {
                                background: "#FFFFFF",
                                text: "#1a1a1a",
                                border: "#e5e7eb",
                                decorative: "#0E4D55",
                                accent: "#0E4D55",
                            },
                            primaryButton: {
                                background: "#0E4D55",
                                text: "#FFFFFF",
                                border: "#0E4D55",
                                decorative: "#0A3A40",
                                accent: "#FFFFFF",
                            },
                            control: {
                                background: "#FFFFFF",
                                text: "#1a1a1a",
                                border: "#d1d5db",
                                decorative: "#0E4D55",
                                accent: "#0E4D55",
                            },
                        },
                    },
                },
                cornerRadius: {
                    base: 8,
                },
                typography: {
                    primary: {
                        shopifyFontGroup: {
                            name: "Assistant",
                            baseWeight: 400,
                            boldWeight: 600,
                        },
                    },
                    secondary: {
                        shopifyFontGroup: {
                            name: "Assistant",
                            baseWeight: 400,
                            boldWeight: 600,
                        },
                    },
                    size: {
                        base: 14.0,
                        ratio: 1.2,
                    },
                },
            },
            customizations: {
                primaryButton: {
                    background: "SOLID",
                    border: "NONE",
                    cornerRadius: "BASE",
                    blockPadding: "BASE",
                    inlinePadding: "BASE",
                    typography: {
                        font: "PRIMARY",
                        letterCase: "NONE",
                        size: "MEDIUM",
                        weight: "BOLD",
                    },
                },
                control: {
                    border: "FULL",
                    cornerRadius: "BASE",
                    labelPosition: "INSIDE",
                },
                header: {
                    position: "START",
                },
                global: {
                    cornerRadius: "NONE",
                    typography: {
                        letterCase: "NONE",
                    },
                },
            },
        },
    });

    const errors = brandingRes.data?.checkoutBrandingUpsert?.userErrors || [];
    if (errors.length > 0) {
        console.error("❌ Branding errors:", errors);
    } else {
        console.log("✅ Checkout branding applied successfully!");
    }

    // 3. Log results
    console.log("\n📋 Results:");
    console.log(JSON.stringify(brandingRes.data?.checkoutBrandingUpsert, null, 2));
}

main().catch(console.error);
