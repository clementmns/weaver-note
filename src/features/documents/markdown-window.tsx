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
  const debounceTimer = useRef<number | null>(null);
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
    (value: string | undefined) => {
      const next = value || "";
      setContent(next);
      contentRef.current = next;

      if (!docUrl) return;
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

      debounceTimer.current = window.setTimeout(async () => {
        if (channelRef.current) {
          broadcastDocUpdate(channelRef.current, {
            type: "content",
            content: next,
            meta: { docUrl },
          });
        }

        if (!docUrl) return;
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
      }, 300);
    },
    [docUrl, setSaveStatus],
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

      await subscribeToPresence(channel, (connectedUsers) => {
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

              setContent(payload.content);
              contentRef.current = payload.content;
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
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
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
        <div className="w-full border rounded-lg overflow-hidden">
          <MarkdownEditor value={content} onChange={handleEditorChange} />
        </div>
      )}
      {(viewMode === "view" || viewMode === "both") && (
        <div className="w-full border rounded-lg overflow-auto">
          <MarkdownViewer content={content} />
        </div>
      )}
    </div>
  );
}
