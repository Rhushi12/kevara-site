export interface MenuItem {
    id: string;
    label: string;
    href: string;
    shopify_layout_type?: "mixed" | "visual";
    columns?: {
        title: string;
        links: { label: string; href: string }[];
    }[];
    images?: {
        label: string;
        src: string;
        href: string;
    }[];
}

export const MENU_DATA: MenuItem[] = [
    {
        id: "women",
        label: "Women",
        href: "/collections/women",
        shopify_layout_type: "mixed",
        columns: [
            {
                title: "Clothing",
                links: [
                    { label: "New Arrivals", href: "/collections/women-new" },
                    { label: "Dresses", href: "/collections/women-dresses" },
                    { label: "Tops & Shirts", href: "/collections/women-tops" },
                    { label: "Trousers", href: "/collections/women-trousers" },
                    { label: "Knitwear", href: "/collections/women-knitwear" },
                ],
            },
            {
                title: "Collections",
                links: [
                    { label: "Workwear Edit", href: "/collections/workwear" },
                    { label: "Linen Series", href: "/collections/linen" },
                    { label: "Evening Wear", href: "/collections/evening" },
                    { label: "Essentials", href: "/collections/essentials" },
                ],
            },
            {
                title: "Accessories",
                links: [
                    { label: "Bags", href: "/collections/bags" },
                    { label: "Jewelry", href: "/collections/jewelry" },
                    { label: "Scarves", href: "/collections/scarves" },
                ],
            },
        ],
        images: [
            {
                label: "New Season",
                src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-new",
            },
            {
                label: "Best Sellers",
                src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-best-sellers",
            },
            {
                label: "Editor's Pick",
                src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-editors-pick",
            },
        ],
    },
    {
        id: "men",
        label: "Men",
        href: "/collections/men",
        shopify_layout_type: "mixed",
        columns: [
            {
                title: "Clothing",
                links: [
                    { label: "New Arrivals", href: "/collections/men-new" },
                    { label: "Shirts", href: "/collections/men-shirts" },
                    { label: "T-Shirts", href: "/collections/men-tshirts" },
                    { label: "Trousers", href: "/collections/men-trousers" },
                    { label: "Jackets", href: "/collections/men-jackets" },
                ],
            },
            {
                title: "Collections",
                links: [
                    { label: "Office Wear", href: "/collections/men-office" },
                    { label: "Casual Weekend", href: "/collections/men-casual" },
                    { label: "Summer Linen", href: "/collections/men-linen" },
                ],
            },
            {
                title: "Accessories",
                links: [
                    { label: "Belts", href: "/collections/men-belts" },
                    { label: "Wallets", href: "/collections/men-wallets" },
                ],
            },
        ],
        images: [
            {
                label: "New Arrivals",
                src: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=800&auto=format&fit=crop",
                href: "/collections/men-new",
            },
            {
                label: "Summer Edit",
                src: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop",
                href: "/collections/men-summer",
            },
            {
                label: "Essentials",
                src: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop",
                href: "/collections/men-essentials",
            },
        ],
    },
    {
        id: "shop",
        label: "Shop",
        href: "/collections/all",
        shopify_layout_type: "mixed",
        columns: [
            {
                title: "Categories",
                links: [
                    { label: "Shop All", href: "/collections/all" },
                    { label: "Women", href: "/collections/women" },
                    { label: "Men", href: "/collections/men" },
                    { label: "Accessories", href: "/collections/accessories" },
                ],
            },
            {
                title: "Collections",
                links: [
                    { label: "New Arrivals", href: "/collections/new" },
                    { label: "Best Sellers", href: "/collections/best-sellers" },
                    { label: "Essentials", href: "/collections/essentials" },
                    { label: "Sale", href: "/collections/sale" },
                ],
            },
            {
                title: "Featured",
                links: [
                    { label: "Editor's Pick", href: "/collections/editors-pick" },
                    { label: "Gift Guide", href: "/collections/gift-guide" },
                    { label: "Sustainability", href: "/pages/sustainability" },
                ],
            },
        ],
        images: [
            {
                label: "New Collection",
                src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
                href: "/collections/new",
            },
            {
                label: "Lookbook",
                src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
                href: "/pages/lookbook",
            },
            {
                label: "Sale",
                src: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop",
                href: "/collections/sale",
            },
        ],
    },
    {
        id: "about",
        label: "About",
        href: "/about",
        shopify_layout_type: "visual",
        images: [
            {
                label: "Our Story",
                src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                href: "/about/story",
            },
            {
                label: "Sustainability",
                src: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=800&auto=format&fit=crop",
                href: "/about/sustainability",
            },
            {
                label: "Craftsmanship",
                src: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop",
                href: "/about/craftsmanship",
            },
        ],
    },
];
