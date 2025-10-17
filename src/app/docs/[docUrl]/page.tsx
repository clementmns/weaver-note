"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Columns2,
  Eye,
  Pencil,
  Users,
  RefreshCw,
  AlertCircle,
  CircleCheck,
  ChevronLeft,
  Link as LinkIcon,
} from "lucide-react";
import MarkdownWindow from "@/features/documents/markdown-window";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { copyToClipboard } from "@/lib/utils";
import Background from "../../../components/ui/background";

interface Doc {
  id: string;
  name: string;
  url: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function DocPage() {
  const { docUrl } = useParams() as { docUrl: string };
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [viewMode, setViewMode] = useState<"edit" | "view" | "both">("both");

  useEffect(() => {
    const fetchDocData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("url", docUrl)
          .single();

        if (error) throw error;
        setDoc(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocData();
  }, [docUrl]);

  const [connectedUsers, setConnectedUsers] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    let t: number | undefined;
    if (saveStatus === "saved") {
      t = window.setTimeout(() => setSaveStatus("idle"), 3000);
    }
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [saveStatus]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

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
            onClick={() =>
              copyToClipboard(
                `${window.location.origin}/docs/${docUrl}`,
                "Document link copied to clipboard",
              )
            }
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {saveStatus === "saving" && (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <CircleCheck className="h-4 w-4 " aria-hidden />
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" aria-hidden />
                </>
              )}
            </div>
            <Button variant="ghost" className="px-2" disabled>
              <span className="text-sm">{connectedUsers}</span>
              <Users className="h-6" />
            </Button>
          </div>
          <Tabs
            defaultValue={viewMode}
            onValueChange={(value) =>
              setViewMode(value as "edit" | "view" | "both")
            }
          >
            <TabsList>
              <TabsTrigger value="both">
                <Columns2 />
                Both
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Pencil />
                Edit
              </TabsTrigger>
              <TabsTrigger value="view">
                <Eye />
                View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      {doc && (
        <MarkdownWindow
          defaultValue={doc.content ?? ""}
          docUrl={docUrl}
          viewMode={viewMode}
          setConnectedUsers={setConnectedUsers}
          setSaveStatus={setSaveStatus}
        />
      )}
    </main>
  );
}
