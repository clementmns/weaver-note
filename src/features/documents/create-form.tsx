"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createDoc } from "./actions";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function DocumentCreateForm() {
  const [docName, setDocName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const doc = await createDoc(docName);
      router.push(`/docs/${encodeURIComponent(doc.url)}`);
    } catch {
      setError("Error creating document");
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-2">Create a Document</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await handleCreate();
        }}
      >
        <Input
          placeholder="Document name..."
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          className="mb-2"
        />
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <Button
          type="submit"
          disabled={!docName || loading}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoaderCircle className="animate-spin" />
              Creating...
            </>
          ) : (
            "Create & Enter"
          )}
        </Button>
      </form>
    </Card>
  );
}
