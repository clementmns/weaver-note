"use client";

import React, { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
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
  LoaderCircle,
} from "lucide-react";
import Markdown from "@/features/markdown";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { copyToClipboard } from "@/lib/utils";
import Background from "@/components/ui/background";
import { SaveStatus, ViewMode } from "@/types/global";
import { Document } from "@/types/document";
import { getDoc } from "@/features/documents/actions";

export default function DocPage() {
  const { docUrl } = useParams() as { docUrl: string };
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.BOTH);
  const [connectedUsers, setConnectedUsers] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.IDLE);

  const fetchDocData = async () => {
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
  };

  useEffect(() => {
    fetchDocData();
  }, [docUrl]);

  useEffect(() => {
    let t: number | undefined;
    if (saveStatus === SaveStatus.SAVED) {
      t = window.setTimeout(() => setSaveStatus(SaveStatus.IDLE), 3000);
    }
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [saveStatus]);

  if (loading) {
    return (
      <main className="p-8 min-h-screen flex flex-col">
        <Background />
        <div className="flex justify-center items-center flex-grow">
          <LoaderCircle
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden
          />
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
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {saveStatus === "saved" && (
                <CircleCheck className="h-4 w-4 " aria-hidden />
              )}
              {saveStatus === "error" && (
                <AlertCircle className="h-4 w-4 text-red-500" aria-hidden />
              )}
            </div>
            <Button variant="ghost" className="px-2" disabled aria-hidden>
              <span className="text-sm">{connectedUsers}</span>
              <Users className="h-6" />
            </Button>
          </div>
          <Tabs
            defaultValue={viewMode}
            onValueChange={(value: string) => setViewMode(value as ViewMode)}
          >
            <TabsList>
              <TabsTrigger value={ViewMode.BOTH}>
                <Columns2 />
                Both
              </TabsTrigger>
              <TabsTrigger value={ViewMode.EDIT}>
                <Pencil />
                Edit
              </TabsTrigger>
              <TabsTrigger value={ViewMode.VIEW}>
                <Eye />
                View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      {doc && (
        <Markdown
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
