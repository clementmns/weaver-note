"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import MarkdownEditor from "./editor";
import MarkdownViewer from "./viewer";
import { Doc, applyUpdate } from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import SupabaseProvider from "@/lib/channel/documents";
import { supabase } from "@/lib/supabase/client";
import { ViewMode } from "@/types/global";

interface MarkdownProps {
  defaultValue: string;
  docUrl?: string;
  viewMode: ViewMode;
  setConnectedUsers?: (count: number) => void;
}

export default function Markdown({
  defaultValue,
  docUrl,
  viewMode,
  setConnectedUsers,
}: MarkdownProps) {
  const [content, setContent] = useState<string>(
    typeof defaultValue === "string" ? defaultValue : "",
  );
  const yjsDocRef = useRef<Doc | null>(null);

  useEffect(() => {
    if (!docUrl) return;

    const yDoc = new Doc();

    const awareness = new awarenessProtocol.Awareness(yDoc);

    const userId = Math.floor(Math.random() * 10000000).toString();
    const userName = `User-${userId.slice(-4)}`;
    const userColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    awareness.setLocalState({
      user: {
        name: userName,
        id: yDoc.clientID,
        color: userColor,
      },
    });

    const provider = new SupabaseProvider(yDoc, supabase, {
      channel: `document-${docUrl}`,
      id: docUrl,
      idName: "url",
      tableName: "documents",
      columnName: "content",
      awareness: awareness,
    });

    const presenceChannel = supabase.channel(`presence-${docUrl}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    const handlePresenceChange = () => {
      if (setConnectedUsers) {
        const presenceState = presenceChannel.presenceState();
        const userCount = Object.keys(presenceState).length;
        setConnectedUsers(userCount);
      }
    };

    presenceChannel
      .on("presence", { event: "sync" }, handlePresenceChange)
      .on("presence", { event: "join" }, handlePresenceChange)
      .on("presence", { event: "leave" }, handlePresenceChange)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user: userName,
            color: userColor,
            online_at: new Date().toISOString(),
          });
        }
      });

    yDoc.on("update", () => {
      try {
        const rawContent = yDoc.getText("monaco").toString();
        const deserializedContent =
          typeof rawContent === "string" ? rawContent : "";
        setContent(deserializedContent);
      } catch (error) {
        console.error("Failed to deserialize content:", error);
        setContent("");
      }
    });

    if (defaultValue) {
      try {
        let dataArray;
        if (typeof defaultValue === "string") {
          try {
            dataArray = JSON.parse(defaultValue);
          } catch {
            if (defaultValue.includes(",")) {
              dataArray = defaultValue
                .split(",")
                .map((num) => parseInt(num.trim(), 10));
            } else {
              yDoc.getText("monaco").insert(0, defaultValue);
              setContent(defaultValue);
              dataArray = null;
            }
          }
        } else if (Array.isArray(defaultValue)) {
          dataArray = defaultValue;
        }

        if (dataArray && Array.isArray(dataArray)) {
          const uint8Array = new Uint8Array(dataArray);
          applyUpdate(yDoc, uint8Array);

          const initialContent = yDoc.getText("monaco").toString();
          setContent(initialContent);
        }
      } catch (error) {
        console.error("Failed to process JSONB data:", error);
      }
    }

    yjsDocRef.current = yDoc;

    return () => {
      if (presenceChannel) {
        presenceChannel.untrack();
        presenceChannel.unsubscribe();
      }
      awareness.setLocalState(null);
      provider.destroy();
      yDoc.destroy();
    };
  }, [docUrl, defaultValue, setConnectedUsers]);

  const handleEditorChange = useCallback((newContent: string | undefined) => {
    if (newContent !== undefined) {
      setContent(newContent);
      if (yjsDocRef.current) {
        const yDoc = yjsDocRef.current;
        const yText = yDoc.getText("monaco");
        yText.delete(0, yText.length);
        yText.insert(0, newContent);
      }
    }
  }, []);

  return (
    <div className="flex gap-4 flex-1 max-h-[88vh]">
      {viewMode !== ViewMode.VIEW && (
        <div className="w-full border rounded-lg overflow-hidden bg-background">
          <MarkdownEditor
            key={`editor-${docUrl || "local"}`}
            value={content}
            onChange={handleEditorChange}
          />
        </div>
      )}
      {viewMode !== ViewMode.EDIT && (
        <div className="w-full border rounded-lg overflow-auto bg-background dark:bg-[#1e1e1e]">
          <MarkdownViewer
            key={`viewer-${docUrl || "local"}`}
            content={content}
          />
        </div>
      )}
    </div>
  );
}
