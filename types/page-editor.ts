export type SectionType =
    | 'hero_slider'
    | 'shop_essentials'
    | 'lookbook'
    | 'featured_product'
    | 'collection_grid'
    | 'scroll_banner'
    | 'promo_windows'
    | 'featured_in'
    | 'essentials_hero'
    | 'shop_by_occasion'
    | 'clean_grid'
    | 'shop_category'
    | 'sales_split'
    | 'editorial_section'
    | 'video_promo'
    | 'fabric_feature'
    | 'testimonials'
    | 'features'
    | 'about_us'
    | 'about_hero_banner'
    | 'about_story_section'
    | 'about_image_text_block'
    | 'about_carousel_section'
    | 'about_timeline_section'
    | 'sustainability_banner_section'
    | 'sustainability_slider_section'
    | 'sustainability_section'
    | 'sustainability_values_section'
    | 'sustainability_cta_section'
    | 'sustainability_hero_section'
    | 'sustainability_products_section'
    | 'sustainability_quote_section';

export interface BaseSection {
    id: string;
    type: SectionType;
}

export interface HeroSlide {
    id: string;
    image: string;
    heading: string;
    subheading: string;
    buttonText: string;
    link: string;
    image_id?: string; // For asset persistence
}

export interface HeroSliderSection extends BaseSection {
    type: 'hero_slider';
    settings: {
        slides: HeroSlide[];
    };
}

export interface ShopEssentialItem {
    id: string;
    title: string;
    image: string;
    link: string;
    image_id?: string;
}

export interface ShopEssentialsSection extends BaseSection {
    type: 'shop_essentials';
    settings: {
        title: string;
        description?: string;
        items: ShopEssentialItem[];
    };
}

export interface LookbookSection extends BaseSection {
    type: 'lookbook';
    settings: {
        title: string;
        subtitle: string;
        image: string;
        cta_text: string;
        cta_link: string;
        image_id?: string;
    };
}

export interface FeaturedProductSection extends BaseSection {
    type: 'featured_product';
    settings: {
        product_handle: string;
        // We might store cached product data here or fetch it live
        // For now, let's store the handle and maybe some override text
        title?: string;
        description?: string;
    };
}

export interface CollectionGridItem {
    id: string;
    title: string;
    link: string;
    image: string;
    size?: string; // 'large' | 'small'
    image_id?: string;
}

export interface CollectionGridSection extends BaseSection {
    type: 'collection_grid';
    settings: {
        items: CollectionGridItem[];
    };
}

export interface ScrollBannerSection extends BaseSection {
    type: 'scroll_banner';
    settings: {
        image: string;
        heading: string;
        subheading: string;
        image_id?: string;
    };
}

export interface PromoWindow {
    id: string;
    image: string;
    title: string;
    subtitle: string;
    link: string;
    linkText: string;
    image_id?: string;
}

export interface PromoWindowsSection extends BaseSection {
    type: 'promo_windows';
    settings: {
        windows: PromoWindow[];
    };
}

export interface FeaturedBrand {
    name: string;
    logo?: string;
    logo_id?: string;
}

export interface FeaturedInSection extends BaseSection {
    type: 'featured_in';
    settings: {
        title: string;
        brands: FeaturedBrand[];
    };
}

export interface EssentialsHeroSection extends BaseSection {
    type: 'essentials_hero';
    settings: {
        label: string;
        heading: string;
        description: string;
        buttonText: string;
        buttonLink: string;
        image: string;
        imageTag: string;
        image_id?: string;
    };
}

export interface ShopByOccasionSection extends BaseSection {
    type: 'shop_by_occasion';
    settings: {
        title: string;
        tab1Label: string;
        tab2Label: string;
        tab1Products: string[];
        tab2Products: string[];
    };
}

export interface CleanGridSection extends BaseSection {
    type: 'clean_grid';
    settings: {
        title: string;
        products: string[];
    };
}

// Placeholder types for other sections (can be expanded later)
export interface ShopCategorySection extends BaseSection { type: 'shop_category'; settings: any; }
export interface SalesSplitSection extends BaseSection { type: 'sales_split'; settings: any; }
export interface EditorialSectionSection extends BaseSection { type: 'editorial_section'; settings: any; }
export interface VideoPromoSection extends BaseSection { type: 'video_promo'; settings: any; }
export interface FabricFeatureSection extends BaseSection { type: 'fabric_feature'; settings: any; }
export interface TestimonialsSection extends BaseSection { type: 'testimonials'; settings: any; }
export interface FeaturesSection extends BaseSection { type: 'features'; settings: any; }
export interface AboutUsSection extends BaseSection { type: 'about_us'; settings: any; }
export interface AboutHeroBannerSection extends BaseSection { type: 'about_hero_banner'; settings: any; }
export interface AboutStorySectionType extends BaseSection { type: 'about_story_section'; settings: any; }
export interface AboutImageTextBlockSection extends BaseSection { type: 'about_image_text_block'; settings: any; }
export interface AboutCarouselSectionType extends BaseSection { type: 'about_carousel_section'; settings: any; }
export interface AboutTimelineSectionType extends BaseSection { type: 'about_timeline_section'; settings: any; }
export interface SustainabilityBannerSectionType extends BaseSection { type: 'sustainability_banner_section'; settings: any; }
export interface SustainabilitySliderSectionType extends BaseSection { type: 'sustainability_slider_section'; settings: any; }
export interface SustainabilitySectionType extends BaseSection { type: 'sustainability_section'; settings: any; }
export interface SustainabilityValuesSectionType extends BaseSection { type: 'sustainability_values_section'; settings: any; }
export interface SustainabilityCTASectionType extends BaseSection { type: 'sustainability_cta_section'; settings: any; }
export interface SustainabilityHeroSectionType extends BaseSection { type: 'sustainability_hero_section'; settings: any; }
export interface SustainabilityProductsSectionType extends BaseSection { type: 'sustainability_products_section'; settings: any; }
export interface SustainabilityQuoteSectionType extends BaseSection { type: 'sustainability_quote_section'; settings: any; }

export type PageSection =
    | HeroSliderSection
    | ShopEssentialsSection
    | LookbookSection
    | FeaturedProductSection
    | CollectionGridSection
    | ScrollBannerSection
    | PromoWindowsSection
    | FeaturedInSection
    | EssentialsHeroSection
    | ShopByOccasionSection
    | CleanGridSection
    | ShopCategorySection
    | SalesSplitSection
    | EditorialSectionSection
    | VideoPromoSection
    | FabricFeatureSection
    | TestimonialsSection
    | FeaturesSection
    | AboutUsSection
    | AboutHeroBannerSection
    | AboutStorySectionType
    | AboutImageTextBlockSection
    | AboutCarouselSectionType
    | AboutTimelineSectionType
    | SustainabilityBannerSectionType
    | SustainabilitySliderSectionType
    | SustainabilitySectionType
    | SustainabilityValuesSectionType
    | SustainabilityCTASectionType
    | SustainabilityHeroSectionType
    | SustainabilityProductsSectionType
    | SustainabilityQuoteSectionType;

export interface PageContent {
    sections: PageSection[];
}
