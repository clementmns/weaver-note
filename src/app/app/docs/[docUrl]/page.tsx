"use client";

import React, { useEffect, useState } from "react";
import { MarkdownEditor } from "@/features/editor/markdown-editor";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

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

  useEffect(() => {
    const fetchDocData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("docs")
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


  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">{doc?.name}</h1>
      {doc && (
        <MarkdownEditor
          height="80vh"
          width="100%"
          defaultValue={doc.content}
          docUrl={docUrl}
        />
      )}
    </main>
  );
}
