"use client";

import { useRouter } from "next/navigation";
import { DocSelector } from "@/features/documents/doc-selector";
import { DocList } from "@/features/documents/doc-list";

export default function HomePage() {
  const router = useRouter();

  const handleDocSelect = (docUrl: string) => {
    if (docUrl) router.push(`/docs/${encodeURIComponent(docUrl)}`);
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Collaborative Markdown Editor</h1>
      <p className="text-gray-600 mb-4">
        Select or create a document to start editing together in real-time.
      </p>
      <DocSelector onSelect={handleDocSelect} />
      <DocList onSelect={handleDocSelect} />
    </main>
  );
}
