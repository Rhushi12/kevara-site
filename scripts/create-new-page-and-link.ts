
import { getGlobalMenu, updateGlobalMenu, updateCollectionPage } from "../lib/shopify-admin";

async function main() {
    console.log("Starting setup...");

    // 1. Create/Update the Page Metaobject (Best Sellers Clone)
    const pageHandle = "new-template-page";
    console.log(`Creating page template: ${pageHandle}...`);

    // We'll try to find an image ID from the menu to use as a placeholder if possible, 
    // but for now we'll just set the text fields.
    // If we had a way to upload an image via script easily we would, but we need a File object.
    // We'll leave images blank for the user to upload, or we could try to fetch one.

    // Let's fetch the menu first to see if we can grab an image ID.
    const menu = await getGlobalMenu();
    if (!menu) {
        console.error("Failed to fetch global menu.");
        return;
    }

    // Find a valid image ID to use as a placeholder
    let placeholderImageId = null;
    for (const tab of menu) {
        if (tab.images && tab.images.length > 0) {
            for (const img of tab.images) {
                if (img.imageId) {
                    placeholderImageId = img.imageId;
                    break;
                }
            }
        }
        if (placeholderImageId) break;
    }

    const pageData = {
        hero_title: "Best Sellers",
        window_1_title: "New Season",
        window_1_subtitle: "Shop the latest trends",
        window_2_title: "Editor's Pick",
        window_2_subtitle: "Curated just for you",
        // Use placeholder if found, otherwise undefined (user will upload)
        hero_image_id: placeholderImageId,
        window_1_image_id: placeholderImageId,
        window_2_image_id: placeholderImageId
    };

    await updateCollectionPage(pageHandle, pageData);
    console.log("Page template created/updated.");

    // 2. Update the Menu
    console.log("Updating 'Women' menu...");
    const womenTab = menu.find((item: any) => item.id === "women");
    if (!womenTab) {
        console.error("Could not find 'Women' menu item.");
        return;
    }

    // Ensure 'columns' exists
    if (!womenTab.columns) {
        womenTab.columns = [];
    }

    // Check if "New Collection" column exists
    let newCollectionCol = womenTab.columns.find((col: any) => col.title === "New Collection");
    if (!newCollectionCol) {
        newCollectionCol = { title: "New Collection", items: [] };
        womenTab.columns.push(newCollectionCol);
        console.log("Created 'New Collection' column.");
    }

    // Check if "New Link" exists
    const linkHref = `/collections/${pageHandle}`;
    const linkLabel = "New Link";

    const linkExists = newCollectionCol.items.some((item: any) => item.href === linkHref);
    if (!linkExists) {
        newCollectionCol.items.push({ label: linkLabel, href: linkHref });
        console.log(`Added '${linkLabel}' to 'New Collection'.`);
    } else {
        console.log("Link already exists.");
    }

    // Save the menu
    await updateGlobalMenu(menu);
    console.log("Menu updated successfully!");
}

main().catch(console.error);
