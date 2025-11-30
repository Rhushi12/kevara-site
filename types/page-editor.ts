export type SectionType = 'hero_slider' | 'shop_essentials' | 'lookbook' | 'featured_product' | 'collection_grid';

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

export type PageSection =
    | HeroSliderSection
    | ShopEssentialsSection
    | LookbookSection
    | FeaturedProductSection
    | CollectionGridSection;

export interface PageContent {
    sections: PageSection[];
}
