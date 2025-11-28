import { db, storage } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface Product {
    id: string;
    title: string;
    handle: string;
    description: string;
    priceRange: {
        minVariantPrice: {
            amount: string;
            currencyCode: string;
        };
    };
    images: {
        edges: Array<{
            node: {
                url: string;
                altText: string | null;
            };
        }>;
    };
    variants: {
        edges: Array<{
            node: {
                id: string;
                title: string;
                price: {
                    amount: string;
                    currencyCode: string;
                };
            };
        }>;
    };
}

export async function getAllProducts(): Promise<Product[]> {
    try {
        const productsRef = collection(db, "products");
        const snapshot = await getDocs(productsRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    try {
        const docRef = doc(db, "products", slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Product;
        } else {
            console.log("No such product!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
}

export async function saveNavigationMenu(menuData: any[]) {
    try {
        const docRef = doc(db, "config", "navigation");
        await setDoc(docRef, { items: menuData });
        console.log("Navigation menu saved!");
    } catch (error) {
        console.error("Error saving navigation menu:", error);
        throw error;
    }
}

export function subscribeToNavigation(callback: (data: any[]) => void) {
    const docRef = doc(db, "config", "navigation");
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data().items);
        } else {
            callback([]);
        }
    });
}

export async function uploadImage(file: File, path: string): Promise<string> {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
}
