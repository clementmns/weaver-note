"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createDoc } from "./createDoc";

export function DocSelector({ onSelect }: { onSelect: (docUrl: string) => void }) {
  const [docName, setDocName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const doc = await createDoc(docName);
      onSelect(doc.url);
    } catch (e) {
      if (typeof e === "object" && e !== null && "message" in e && typeof (e as { message?: string }).message === "string") {
        setError((e as { message: string }).message);
      } else {
        setError("Error creating doc");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-2">Create a Document</h2>
      <Input
        placeholder="Document name..."
        value={docName}
        onChange={e => setDocName(e.target.value)}
        className="mb-2"
      />
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <Button onClick={handleCreate} disabled={!docName || loading} className="w-full">
        {loading ? "Creating..." : "Create & Enter"}
      </Button>
    </Card>
  );
}
