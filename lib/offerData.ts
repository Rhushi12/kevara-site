export interface OfferSlide {
    id: number;
    image: string;
    image_id?: string;
    heading: string;
    subheading: string;
    buttonText: string;
    link: string;
    alignment?: "left" | "center" | "right";
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
}

export const OFFER_SLIDES: OfferSlide[] = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2070&auto=format&fit=crop",
        heading: "Welcome to Kevara",
        subheading: "Enjoy 10% off your first order",
        buttonText: "Claim Offer",
        link: "/collections/new-arrivals",
        alignment: "center",
        secondaryButtonText: "",
        secondaryButtonLink: ""
    }
];
