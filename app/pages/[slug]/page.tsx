"use client";

import { useParams } from "next/navigation";
import PageRenderer from "@/components/PageRenderer";

export default function DynamicPage() {
    const params = useParams();
    const slug = params?.slug as string;

    return <PageRenderer slug={slug} />;
}
