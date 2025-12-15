import { Suspense } from 'react';
import ContactPageContent from './ContactPageContent';

export const metadata = {
    title: 'Contact Us | Kevara',
    description: 'Get in touch with us for any questions about our sustainable collections.',
};

export default function ContactPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-warm-cream" />}>
            <ContactPageContent />
        </Suspense>
    );
}
