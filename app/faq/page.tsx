import { Suspense } from 'react';
import FaqPageContent from './FaqPageContent';

export const metadata = {
    title: 'FAQ | Kevara',
    description: 'Frequently asked questions about our collections, shipping, and sustainability.',
};

export default function FaqPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-warm-cream" />}>
            <FaqPageContent />
        </Suspense>
    );
}
