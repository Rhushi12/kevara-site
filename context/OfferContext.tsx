"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface OfferContextType {
    isOpen: boolean;
    openSidebar: (adminMode?: boolean) => void;
    closeSidebar: () => void;
    isAdminMode: boolean;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

export function OfferProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);

    const openSidebar = useCallback((adminMode = false) => {
        setIsAdminMode(adminMode);
        setIsOpen(true);
    }, []);

    const closeSidebar = useCallback(() => {
        setIsOpen(false);
        setIsAdminMode(false);
    }, []);

    return (
        <OfferContext.Provider value={{ isOpen, openSidebar, closeSidebar, isAdminMode }}>
            {children}
        </OfferContext.Provider>
    );
}

export function useOffer() {
    const context = useContext(OfferContext);
    if (context === undefined) {
        throw new Error("useOffer must be used within an OfferProvider");
    }
    return context;
}
