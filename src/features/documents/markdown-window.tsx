"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import MarkdownViewer from "./view/markdown-viewer";
import MarkdownEditor from "./editor/markdown-editor";
import {
  createPresenceChannel,
  subscribeToPresence,
  broadcastDocUpdate,
  closeChannel,
} from "@/lib/channel/documents";
import { supabase } from "@/lib/supabase/client";
import { Button } from "../../components/ui/button";
import { Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

interface MarkdownWindowProps {
  defaultValue: string;
  docUrl?: string;
  viewMode?: "edit" | "view" | "both";
  setConnectedUsers?: React.Dispatch<React.SetStateAction<number>>;
  setSaveStatus?: React.Dispatch<
    React.SetStateAction<"idle" | "saving" | "saved" | "error">
  >;
}

export default function MarkdownWindow({
  defaultValue,
  docUrl,
  viewMode = "both",
  setConnectedUsers,
  setSaveStatus,
}: MarkdownWindowProps) {
  const [content, setContent] = useState(defaultValue);
  const channelRef = useRef<
    import("@/lib/channel/documents").RealtimeChannel | null
  >(null);
  const lastSavedRef = useRef<string>(defaultValue ?? "");
  const contentRef = useRef<string | undefined>(defaultValue);
  const initialGraceRef = useRef(true);

  const getGuestId = useCallback(() => {
    try {
      const key = "weave_guest_id";
      let id = sessionStorage.getItem(key);
      if (!id) {
        id = `guest_${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(key, id);
      }
      return id;
    } catch (_err: unknown) {
      console.error(_err);
      return `guest_${Math.random().toString(36).slice(2, 10)}`;
    }
  }, []);

  const handleEditorChange = useCallback(
    async (value: string | undefined) => {
      const next = value || "";

      if (contentRef.current !== next) {
        contentRef.current = next;

        if (viewMode === "both" || viewMode === "view") {
          setContent(next);
        }
      }

      if (!docUrl) return;

      // Broadcast update immediately without debouncing
      if (channelRef.current) {
        broadcastDocUpdate(channelRef.current, {
          type: "content",
          content: next,
          meta: { docUrl },
        });
      }

      // Save to database immediately
      try {
        if (lastSavedRef.current === next) return;

        setSaveStatus?.("saving");

        const { error } = await supabase
          .from("documents")
          .update({ content: next, updated_at: new Date().toISOString() })
          .eq("url", docUrl);

        if (error) {
          console.error("Failed to save document:", error);
          setSaveStatus?.("error");
        } else {
          lastSavedRef.current = next;
          setSaveStatus?.("saved");
        }
      } catch (err) {
        console.error("Autosave error:", err);
        setSaveStatus?.("error");
      }
    },
    [docUrl, setSaveStatus, viewMode],
  );

  useEffect(() => {
    if (!docUrl) return;

    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user;

      const presenceKey = currentUser ? undefined : getGuestId();
      const channel = await createPresenceChannel(docUrl, presenceKey);
      if (!channel) return;

      channelRef.current = channel;

      subscribeToPresence(channel, (connectedUsers) => {
        if (!mounted) return;
        setConnectedUsers?.(connectedUsers);
      });

      try {
        if (currentUser) {
          const displayName =
            currentUser.user_metadata?.full_name || currentUser.email || null;
          channel.track({
            user: {
              id: currentUser.id,
              email: currentUser.email,
              name: displayName,
            },
          });
        } else {
          channel.track({ user: { id: presenceKey, name: presenceKey } });
        }
      } catch {
        console.warn("Failed to track presence");
      }

      channel.on(
        "broadcast",
        { event: "doc:update" },
        ({
          payload,
        }: {
          payload?: import("@/lib/channel/documents").DocUpdatePayload;
        }) => {
          try {
            if (!mounted) return;
            if (payload?.type === "content" && payload.content !== undefined) {
              if (initialGraceRef.current && contentRef.current) {
                return;
              }

              if (contentRef.current !== payload.content) {
                setContent(payload.content);
                contentRef.current = payload.content;
              }
            }
          } catch {
            console.error("Error handling doc:update payload");
          }
        },
      );

      setTimeout(() => {
        initialGraceRef.current = false;
      }, 500);
    })();

    return () => {
      mounted = false;
      if (channelRef.current) {
        try {
          closeChannel(channelRef.current);
        } catch {
          console.warn("Error closing channel");
        }
      }
    };
  }, [docUrl, setConnectedUsers, getGuestId]);

  return (
    <div className="flex gap-4 flex-1 max-h-[88vh]">
      {(viewMode === "edit" || viewMode === "both") && (
        <div className="w-full border rounded-lg overflow-hidden bg-background">
          <div className="relative">
            <div
              className="absolute top-2 right-2 z-50"
              style={{ top: "10px", right: "10px", pointerEvents: "auto" }}
            >
              <Button
                variant={"outline"}
                size={"icon-lg"}
                onClick={() =>
                  copyToClipboard(
                    content,
                    "Markdown content copied to clipboard",
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <MarkdownEditor
            value={contentRef.current || ""}
            onChange={handleEditorChange}
            docUrl={docUrl}
          />
        </div>
      )}
      {(viewMode === "view" || viewMode === "both") && (
        <div className="w-full border rounded-lg overflow-auto bg-background dark:bg-[#1e1e1e]">
          <MarkdownViewer content={content} />
        </div>
      )}
    </div>
  );
}
