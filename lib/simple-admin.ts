
export async function uploadFileToShopify(file: any) {
    return "gid://shopify/GenericFile/SIMPLE123";
}

export async function pollForFileUrl(fileId: string, maxAttempts = 10, interval = 1000): Promise<string | null> {
    return "https://simple-mock.com/image.png";
}
