import { PageContent } from "@/types/page-editor";

export const TEMPLATE_1: PageContent = {
    template_type: 'template1',
    sections: [
        {
            id: "hero-1",
            type: "hero_slider",
            settings: {
                slides: [
                    {
                        id: "slide-1",
                        image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop",
                        heading: "New Season Arrivals",
                        subheading: "DISCOVER THE LATEST TRENDS",
                        buttonText: "SHOP COLLECTION",
                        link: "/pages/coming-soon"
                    }
                ]
            }
        },
        {
            id: "essentials-1",
            type: "shop_essentials",
            settings: {
                title: "Dress up in the heat",
                description: "SS21 Series of Comfortable textures. With luxurious, natural-looking makeup, we find reasons for the face. New textures and colors bring new inspiration to your everyday life.",
                items: [] // Will use component defaults
            }
        },
        {
            id: "lookbook-1",
            type: "lookbook",
            settings: {
                title: "Summer 2025 \n Collection",
                subtitle: "LOOKBOOK",
                image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
                cta_text: "VIEW LOOKBOOK",
                cta_link: "/pages/coming-soon"
            }
        },
        {
            id: "featured-1",
            type: "featured_product",
            settings: {
                product_handle: "" // Empty to trigger random product
            }
        },
        {
            id: "grid-1",
            type: "collection_grid",
            settings: {
                items: []
            }
        }
    ]
};

export const TEMPLATE_2: PageContent = {
    template_type: 'template2',
    sections: [
        {
            id: "banner-1",
            type: "scroll_banner",
            settings: {
                image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
                heading: "NEW COLLECTION",
                subheading: "Discover the latest trends"
            }
        },
        {
            id: "promo-1",
            type: "promo_windows",
            settings: {
                windows: [
                    {
                        id: "promo-win-1",
                        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=500&auto=format&fit=crop",
                        title: "ESSENTIALS",
                        subtitle: "Basics that never go out of style",
                        link: "/collections/essentials",
                        linkText: "Shop Now"
                    },
                    {
                        id: "promo-win-2",
                        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=500&auto=format&fit=crop",
                        title: "FEATURED",
                        subtitle: "This season's must-haves",
                        link: "/collections/featured",
                        linkText: "Explore"
                    }
                ]
            }
        },
        {
            id: "essentials-hero-1",
            type: "essentials_hero",
            settings: {
                label: "ESSENTIALS",
                heading: "More than basics",
                description: "Starting with our core, we are replacing the conventional composition of our Essentials collections with more sustainable fibres in each product. An action only contributing to the longevity of the classic styles, designed to last and stand the test of time.",
                buttonText: "LEARN MORE",
                buttonLink: "/collections/essentials",
                image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1000&auto=format&fit=crop",
                imageTag: "Fighter"
            }
        },
        {
            id: "featured-in-1",
            type: "featured_in",
            settings: {
                title: "FEATURED IN",
                brands: [
                    { name: "VOGUE", logo: "" },
                    { name: "ELLE", logo: "" },
                    { name: "GQ", logo: "" },
                    { name: "HARPER'S BAZAAR", logo: "" }
                ]
            }
        }
    ]
};

export const TEMPLATE_3: PageContent = {
    template_type: 'template3',
    sections: [
        {
            id: "banner-3",
            type: "scroll_banner",
            settings: {
                image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
                heading: "NEW COLLECTION",
                subheading: "Discover the latest trends"
            }
        },
        {
            id: "category-carousel-3",
            type: "category_carousel",
            settings: {
                categories: []
            }
        },
        {
            id: "promo-3",
            type: "promo_windows",
            settings: {
                windows: [
                    {
                        id: "promo-win-3-1",
                        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=500&auto=format&fit=crop",
                        title: "ESSENTIALS",
                        subtitle: "Basics that never go out of style",
                        link: "/collections/essentials",
                        linkText: "Shop Now"
                    },
                    {
                        id: "promo-win-3-2",
                        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=500&auto=format&fit=crop",
                        title: "FEATURED",
                        subtitle: "This season's must-haves",
                        link: "/collections/featured",
                        linkText: "Explore"
                    }
                ]
            }
        },
        {
            id: "focal-on-you-3",
            type: "focal_on_you",
            settings: {
                heading: "Focal on you",
                subheading: "Share your looks on Instagram with #minimumfocal",
                items: []
            }
        },
        {
            id: "essentials-hero-3",
            type: "essentials_hero",
            settings: {
                label: "ESSENTIALS",
                heading: "More than basics",
                description: "Starting with our core, we are replacing the conventional composition of our Essentials collections with more sustainable fibres in each product. An action only contributing to the longevity of the classic styles, designed to last and stand the test of time.",
                buttonText: "LEARN MORE",
                buttonLink: "/collections/essentials",
                image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1000&auto=format&fit=crop",
                imageTag: "Fighter"
            }
        },
        {
            id: "featured-in-3",
            type: "featured_in",
            settings: {
                title: "FEATURED IN",
                brands: [
                    { name: "VOGUE", logo: "" },
                    { name: "ELLE", logo: "" },
                    { name: "GQ", logo: "" },
                    { name: "HARPER'S BAZAAR", logo: "" }
                ]
            }
        }
    ]
};

export const TEMPLATE_HOMEPAGE: PageContent = {
    sections: [
        {
            id: "hero-home",
            type: "hero_slider",
            settings: {
                slides: [
                    {
                        id: "slide-1",
                        image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop",
                        heading: "New Season Arrivals",
                        subheading: "DISCOVER THE LATEST TRENDS",
                        buttonText: "SHOP COLLECTION",
                        link: "/collections/all"
                    }
                ]
            }
        },
        {
            id: "shop-occasion-home",
            type: "shop_by_occasion",
            settings: {
                title: "Shop Essentials",
                tab1Label: "Women",
                tab2Label: "Men",
                tab1Products: [],
                tab2Products: []
            }
        },
        {
            id: "shop-category-home",
            type: "shop_category",
            settings: {}
        },
        {
            id: "sales-split-home",
            type: "sales_split",
            settings: {}
        },
        {
            id: "collection-grid-home",
            type: "collection_grid",
            settings: {
                items: []
            }
        },
        {
            id: "clean-grid-home",
            type: "clean_grid",
            settings: {
                title: "Latest Arrivals",
                products: []
            }
        },
        {
            id: "video-promo-home",
            type: "video_promo",
            settings: {}
        },
        {
            id: "about-us-home",
            type: "about_us",
            settings: {
                label: "ABOUT US",
                heading: "Our Story",
                description: "Starting with our core, we are replacing the conventional composition of our Essentials collections with more sustainable fibres in each product. An action only contributing to the longevity of the classic styles, designed to last and stand the test of time.",
                buttonText: "LEARN MORE",
                buttonLink: "/pages/about-us",
                image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1000&auto=format&fit=crop",
                imageTag: "Philosophy"
            }
        },
        {
            id: "testimonials-home",
            type: "testimonials",
            settings: {}
        },
        {
            id: "features-home",
            type: "features",
            settings: {}
        }
    ]
};

export const TEMPLATE_ABOUT_STORY: PageContent = {
    sections: [
        {
            id: "about-hero-1",
            type: "about_hero_banner",
            settings: {
                image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=2070&auto=format&fit=crop",
                heading: "Our Story",
                subheading: "Discover who we are"
            }
        },
        {
            id: "about-story-1",
            type: "about_story_section",
            settings: {
                heading: "We pride ourselves by following subcultures and translating the essences into fashion just before they become mainstream.",
                leftParagraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
                rightParagraph: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt."
            }
        },
        {
            id: "about-image-text-1",
            type: "about_image_text_block",
            settings: {
                image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop",
                heading: "Minimum is quintessentially bridging our rich nordic heritage with a minimalistic approach to design.",
                description: "We believe in creating timeless pieces that transcend seasonal trends, focusing on quality materials and sustainable practices that honor both our heritage and our future."
            }
        },
        {
            id: "about-carousel-1",
            type: "about_carousel_section",
            settings: {
                heading: "EXPLORE OUR PORTFOLIO",
                images: [
                    { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop", caption: "SS24 - Runway" },
                    { src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop", caption: "The Studio" },
                    { src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop", caption: "Craft Store" }
                ]
            }
        },
        {
            id: "about-timeline-1",
            type: "about_timeline_section",
            settings: {
                sectionHeading: "OUR JOURNEY",
                items: [
                    {
                        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                        heading: "The Beginning in Aarhus",
                        description: "The company was founded in 2010 in Aarhus, Denmark. The philosophy of the company is founded on the legacy of Scandinavian fashion tradition.",
                        year: "2010"
                    },
                    {
                        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
                        heading: "Expanding Horizons",
                        description: "In 2015, we expanded to international markets, bringing our Nordic design philosophy to fashion enthusiasts worldwide.",
                        year: "2015"
                    },
                    {
                        image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
                        heading: "Sustainable Future",
                        description: "By 2020, we committed to 100% sustainable materials, leading the industry in eco-conscious fashion practices.",
                        year: "2020"
                    }
                ]
            }
        }
    ]
};

export const TEMPLATE_SUSTAINABILITY: PageContent = {
    sections: [
        {
            id: "sustainability-hero-1",
            type: "sustainability_hero_section",
            settings: {
                image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop",
                smallHeading: "OUR COMMITMENT",
                heading: "Crafted For A Better Tomorrow",
                description: "At Kevara, sustainability isn't just a commitment—it's our foundation. We believe that fashion should not come at the expense of our planet. Every piece we create is designed with intention, using responsibly sourced materials and ethical production methods."
            }
        },
        {
            id: "sustainability-products-1",
            type: "sustainability_products_section",
            settings: {
                smallHeading: "SUSTAINABLE COLLECTION",
                heading: "Shop Our Eco-Friendly Favorites",
                description: "Each piece in our collection is thoughtfully designed with sustainability at its core. From organic fabrics to ethical production, discover fashion that feels as good as it looks.",
                selectedProducts: []
            }
        },
        {
            id: "sustainability-quote-1",
            type: "sustainability_quote_section",
            settings: {
                quote: "True luxury is consciousness. We are redefining our environmental footprint by integrating regenerative materials and circular practices into every step of our creation process, ensuring beauty that does not compromise the earth.",
                attribution: "— Elena Rossi, Head of Sustainable Innovation"
            }
        },
        {
            id: "sustainability-slider-1",
            type: "sustainability_slider_section",
            settings: {
                items: [
                    {
                        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
                        label: "RESPONSIBLE MATERIALS",
                        heading: "Crafted With Care",
                        description: "We source only the finest sustainable fabrics, from organic cotton to recycled polyester. Each material is carefully selected to minimize environmental impact while maximizing comfort and durability."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=800&auto=format&fit=crop",
                        label: "ETHICAL PRODUCTION",
                        heading: "Made With Purpose",
                        description: "Our manufacturing partners share our values. We ensure fair wages, safe working conditions, and transparent supply chains in every step of our production process."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                        label: "CIRCULAR FASHION",
                        heading: "Designed To Last",
                        description: "Every piece is designed for longevity, not fast fashion. We create timeless styles that transcend seasons, reducing waste and promoting a more sustainable wardrobe."
                    }
                ]
            }
        },
        {
            id: "sustainability-values-1",
            type: "sustainability_values_section",
            settings: {
                smallHeading: "OUR COMMITMENT",
                mainHeading: "Building a Sustainable Future",
                description: "We believe in creating fashion that respects both people and planet. Every decision we make is guided by our commitment to sustainability, from the materials we choose to the partners we work with.",
                items: [
                    {
                        image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=800&auto=format&fit=crop",
                        heading: "Eco-Friendly Materials",
                        description: "We source organic cotton, recycled polyester, and innovative sustainable fabrics to minimize our environmental footprint."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
                        heading: "Ethical Manufacturing",
                        description: "Our factories meet the highest standards for worker welfare, ensuring fair wages and safe working conditions."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                        heading: "Carbon Neutral Shipping",
                        description: "We offset 100% of our shipping emissions through verified carbon offset programs and sustainable logistics."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop",
                        heading: "Circular Design",
                        description: "Our garments are designed for longevity and recyclability, closing the loop on fashion waste."
                    }
                ]
            }
        },
        {
            id: "sustainability-cta-1",
            type: "sustainability_cta_section",
            settings: {
                image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=2000&auto=format&fit=crop",
                smallHeading: "JOIN THE MOVEMENT",
                heading: "Together, We Can Make Fashion Sustainable",
                buttonText: "Learn More",
                buttonLink: "/about/story"
            }
        }
    ]
};

export const TEMPLATE_CRAFTSMANSHIP: PageContent = {
    sections: [
        {
            id: "craftsmanship-banner-1",
            type: "sustainability_banner_section",
            settings: {
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2000&auto=format&fit=crop",
                text: "Every Kevara piece is a testament to exceptional craftsmanship. Our artisans bring decades of experience and an unwavering commitment to quality, ensuring each garment is made to perfection and built to last."
            }
        },
        {
            id: "craftsmanship-slider-1",
            type: "sustainability_slider_section",
            settings: {
                items: [
                    {
                        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
                        label: "HANDCRAFTED QUALITY",
                        heading: "Made By Master Artisans",
                        description: "Each garment passes through the skilled hands of our master craftspeople. With decades of experience, they bring precision and artistry to every stitch, ensuring exceptional quality in every piece."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                        label: "PREMIUM MATERIALS",
                        heading: "Only The Finest Fabrics",
                        description: "We source the world's finest materials, from Italian silks to Japanese denims. Each fabric is carefully selected for its quality, durability, and sustainable sourcing."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
                        label: "ATTENTION TO DETAIL",
                        heading: "Perfection In Every Stitch",
                        description: "From reinforced seams to hand-finished buttons, every detail is considered. Our quality control ensures each piece meets our exacting standards before reaching you."
                    }
                ]
            }
        },
        {
            id: "craftsmanship-values-1",
            type: "sustainability_values_section",
            settings: {
                smallHeading: "OUR CRAFT",
                mainHeading: "The Art Of Fine Tailoring",
                description: "True craftsmanship is an art form passed down through generations. Our artisans combine traditional techniques with modern innovation to create garments that stand the test of time.",
                items: [
                    {
                        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
                        heading: "Pattern Making",
                        description: "Our patterns are drafted by hand, refined over years to achieve the perfect fit and silhouette for every body type."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
                        heading: "Precise Cutting",
                        description: "Expert cutters work with precision, ensuring minimal waste while matching patterns and grains for a flawless finish."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
                        heading: "Hand Finishing",
                        description: "Buttons are sewn by hand, hems are carefully pressed, and every garment receives a final inspection before leaving our atelier."
                    },
                    {
                        image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=800&auto=format&fit=crop",
                        heading: "Quality Assurance",
                        description: "Each piece undergoes rigorous quality checks, examining stitching, fabric integrity, and overall construction to ensure perfection."
                    }
                ]
            }
        },
        {
            id: "craftsmanship-cta-1",
            type: "sustainability_cta_section",
            settings: {
                image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=2000&auto=format&fit=crop",
                smallHeading: "DISCOVER MORE",
                heading: "Experience The Kevara Difference",
                buttonText: "Shop Collection",
                buttonLink: "/collections/all"
            }
        }
    ]
};
