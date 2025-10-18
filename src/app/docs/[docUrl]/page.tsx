"use client";

import React, { useCallback, useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import Markdown from "@/features/markdown";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Background from "@/components/ui/background";
import { ViewMode } from "@/types/global";
import { Document } from "@/types/document";
import { getDoc } from "@/features/documents/actions";
import ViewSelector from "@/components/view-selector";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function DocPage() {
  const { docUrl } = useParams() as { docUrl: string };
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.BOTH);

  const fetchDocData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDoc(docUrl);
      if (!data) throw new Error("Document not found");
      setDoc(data);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [docUrl]);

  useEffect(() => {
    fetchDocData();
  }, [fetchDocData]);

  if (loading) {
    return (
      <main className="p-8 min-h-screen flex flex-col">
        <Background />
        <div className="flex justify-center items-center flex-grow">
          <Spinner />
        </div>
      </main>
    );
  }

  if (error || !doc) redirect("/");

  return (
    <main className="p-8 min-h-screen flex flex-col">
      <Background />
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 justify-center">
          <Link href="/">
            <ChevronLeft />
          </Link>
          <h1 className="text-2xl font-bold relative after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-primary after:content-['']">
            {doc?.name}
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard
                .writeText(`${window.location.origin}/docs/${docUrl}`)
                .then(() => {
                  toast.success("Document link copied to clipboard");
                })
                .catch((err) => {
                  console.error("Failed to copy: ", err);
                });
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <ViewSelector viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>
      {doc && <Markdown docUrl={docUrl} viewMode={viewMode} />}
    </main>
  );
}
