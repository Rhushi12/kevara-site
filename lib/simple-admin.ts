
export async function uploadFileToShopify(file: any) {
    console.log("Simple Admin: Mock uploadFileToShopify called");
    return "gid://shopify/GenericFile/SIMPLE123";
}

export async function pollForFileUrl(fileId: string, maxAttempts = 10, interval = 1000): Promise<string | null> {
    console.log("Simple Admin: Mock poll called");
    return "https://simple-mock.com/image.png";
}
