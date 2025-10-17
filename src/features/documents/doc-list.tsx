"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDocs } from "./actions";
import { Document } from "@/types/documents";

export function DocList({ onSelect }: { onSelect: (docUrl: string) => void }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      setError("");
      try {
        const docs = await getDocs();
        setDocs(docs);
      } catch (e) {
        if (
          typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof (e as { message?: string }).message === "string"
        ) {
          setError((e as { message: string }).message);
        } else {
          setError("Error fetching documents");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Your Documents</h2>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li key={doc.id}>
              <Button onClick={() => onSelect(doc.url)} className="w-full">
                {doc.name}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
