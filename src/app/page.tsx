"use client";

import { useRouter } from "next/navigation";
import { DocSelector } from "@/features/documents/doc-selector";
import Footer from "@/components/layouts/footer";
import Background from "@/components/ui/background";

export default function HomePage() {
  const router = useRouter();

  const handleDocSelect = (docUrl: string) => {
    if (docUrl) router.push(`/docs/${encodeURIComponent(docUrl)}`);
  };

  return (
    <main className="p-8">
      <Background />
      <section id="doc-selector" className="py-12 mt-16">
        <h2 className="text-2xl font-bold text-center mb-6">WeaveNote</h2>
        <p className="text-center text-muted-foreground mb-4">
          Create a document to begin your journey.
        </p>
        <div className="max-w-md mx-auto">
          <DocSelector onSelect={handleDocSelect} />
          <Footer />
        </div>
      </section>
    </main>
  );
}
