export interface MenuItem {
    id: string;
    label: string;
    href: string;
    shopify_layout_type?: "mixed" | "visual" | "grid" | "list";
    columns?: {
        title: string;
        items: { label: string; href: string }[];
    }[];
    featuredImage?: string;
    images?: {
        label: string;
        src: string;
        href: string;
    }[];
}

export const MENU_DATA: MenuItem[] = [
    {
        id: "new-arrivals",
        label: "New Arrivals",
        href: "/collections/new-arrivals",
        shopify_layout_type: "mixed",
        columns: [
            {
                title: "CLOTHING",
                items: [
                    { label: "New In", href: "/collections/new-in" },
                    { label: "Best Sellers", href: "/collections/best-sellers" },
                    { label: "Back in Stock", href: "/collections/back-in-stock" },
                    { label: "Coming Soon", href: "/collections/coming-soon" },
                    { label: "Trending Now", href: "/collections/trending" },
                    { label: "Online Exclusives", href: "/collections/online-exclusives" },
                    { label: "Limited Edition", href: "/collections/limited-edition" },
                    { label: "Last Chance", href: "/collections/last-chance" },
                    { label: "Gift Cards", href: "/collections/gift-cards" },
                ],
            },
            {
                title: "COLLECTIONS",
                items: [
                    { label: "Spring 2024", href: "/collections/spring-2024" },
                    { label: "Summer Essentials", href: "/collections/summer-essentials" },
                    { label: "Workwear Edit", href: "/collections/workwear-edit" },
                    { label: "Occasion Wear", href: "/collections/occasion-wear" },
                    { label: "Vacation Shop", href: "/collections/vacation" },
                    { label: "Wedding Guest", href: "/collections/wedding-guest" },
                    { label: "Festival Edit", href: "/collections/festival" },
                    { label: "Denim Guide", href: "/collections/denim-guide" },
                ],
            },
        ],
        images: [
            {
                label: "New Season",
                src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
                href: "/collections/new-in",
            },
            {
                label: "Trending",
                src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
                href: "/collections/trending",
            },
            {
                label: "Editor's Pick",
                src: "https://images.unsplash.com/photo-1485230946086-1d99d529a132?q=80&w=800&auto=format&fit=crop",
                href: "/collections/editors-pick",
            },
            {
                label: "Summer Vibes",
                src: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
                href: "/collections/summer-vibes",
            },
            {
                label: "Essentials",
                src: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop",
                href: "/collections/essentials",
            },
        ],
    },
    {
        id: "women",
        label: "Women",
        href: "/women",
        shopify_layout_type: "mixed",
        columns: [
            {
                title: "CLOTHING",
                items: [
                    { label: "New Arrivals", href: "/collections/women-new" },
                    { label: "Best Sellers", href: "/collections/women-best-sellers" },
                    { label: "Dresses", href: "/collections/women-dresses" },
                    { label: "Tops & Shirts", href: "/collections/women-tops" },
                    { label: "Trousers & Shorts", href: "/collections/women-bottoms" },
                    { label: "Jackets & Coats", href: "/collections/women-jackets" },
                    { label: "Knitwear", href: "/collections/women-knitwear" },
                    { label: "Denim", href: "/collections/women-denim" },
                    { label: "Skirts", href: "/collections/women-skirts" },
                    { label: "Activewear", href: "/collections/women-activewear" },
                    { label: "Swimwear", href: "/collections/women-swimwear" },
                    { label: "Loungewear", href: "/collections/women-loungewear" },
                    { label: "Linen Collection", href: "/collections/women-linen" },
                    { label: "Occasion Wear", href: "/collections/women-occasion" },
                    { label: "Workwear", href: "/collections/women-workwear" },
                ],
            },
            {
                title: "ACCESSORIES",
                items: [
                    { label: "Bags", href: "/collections/women-bags" },
                    { label: "Jewelry", href: "/collections/women-jewelry" },
                    { label: "Shoes", href: "/collections/women-shoes" },
                    { label: "Scarves", href: "/collections/women-scarves" },
                    { label: "Belts", href: "/collections/women-belts" },
                    { label: "Sunglasses", href: "/collections/women-sunglasses" },
                    { label: "Hats", href: "/collections/women-hats" },
                    { label: "Hair Accessories", href: "/collections/women-hair" },
                ],
            },
            {
                title: "COLLECTIONS",
                items: [
                    { label: "Spring 2024", href: "/collections/spring-2024" },
                    { label: "Summer Essentials", href: "/collections/summer-essentials" },
                    { label: "Minimalist Edit", href: "/collections/minimalist" },
                    { label: "Vacation Shop", href: "/collections/vacation" },
                    { label: "Wedding Guest", href: "/collections/wedding-guest" },
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
            {
                label: "Dresses",
                src: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-dresses",
            },
            {
                label: "Accessories",
                src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
                href: "/collections/women-accessories",
            },
        ],
    },
    {
        id: "collections",
        label: "Collections",
        href: "/collections/all",
        shopify_layout_type: "mixed",
        columns: [
            {
                title: "FEATURED",
                items: [
                    { label: "Home Sanctuary", href: "/collections/home-sanctuary" },
                    { label: "Urban Explorer", href: "/collections/urban-explorer" },
                    { label: "Minimalist", href: "/collections/minimalist" },
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
        href: "/pages/about",
        shopify_layout_type: "visual",
        images: [
            {
                label: "Our Story",
                src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                href: "/about-story",
            },
            {
                label: "Sustainability",
                src: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=800&auto=format&fit=crop",
                href: "/pages/sustainability",
            },
            {
                label: "Craftsmanship",
                src: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop",
                href: "/pages/craftsmanship",
            },
        ],
    },
];
