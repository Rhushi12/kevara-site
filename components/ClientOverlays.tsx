"use client";

import dynamic from "next/dynamic";

const CartDrawer = dynamic(() => import("@/components/CartDrawer"), { ssr: false });
const QuickViewPanel = dynamic(() => import("@/components/QuickViewPanel"), { ssr: false });
const SearchPanel = dynamic(() => import("@/components/SearchPanel"), { ssr: false });
const WholesaleFloatingButton = dynamic(() => import("@/components/WholesaleFloatingButton"), { ssr: false });
const GlobalWholesaleInquiryModal = dynamic(() => import("@/components/GlobalWholesaleInquiryModal"), { ssr: false });
const PageViewsTracker = dynamic(() => import("@/components/PageViewsTracker"), { ssr: false });
const ToastNotification = dynamic(() => import("@/components/admin/ToastNotification"), { ssr: false });
const AdminOfferButton = dynamic(() => import("@/components/admin/AdminOfferButton"), { ssr: false });

export default function ClientOverlays() {
    return (
        <>
            <CartDrawer />
            <QuickViewPanel />
            <SearchPanel />
            <ToastNotification />
            <AdminOfferButton />
            <WholesaleFloatingButton />
            <GlobalWholesaleInquiryModal />
            <PageViewsTracker />
        </>
    );
}
