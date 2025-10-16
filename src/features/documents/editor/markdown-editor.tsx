"use client";

import dynamic from "next/dynamic";
import React, { useImperativeHandle, useState, forwardRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import MarkdownViewer from "../view/markdown-viewer";

const Editor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.Editor),
  { ssr: false }
);

export interface MarkdownEditorProps {
  defaultValue?: string;
  height?: string | number;
  width?: string | number;
  onChange?: (value: string) => void;
  docUrl?: string;
}

export interface MarkdownEditorRef {
  getContent: () => string;
}

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ defaultValue = "", height = "80vh", width = "100%", onChange, docUrl }, ref) => {
    const [content, setContent] = useState(defaultValue);
    const [isTyping, setIsTyping] = useState(false);
    useImperativeHandle(
      ref,
      () => ({
        getContent: () => content,
      }),
      [content]
    );

    const handleEditorChange = (value: string | undefined) => {
      const newValue = value ?? "";
      setContent(newValue);
      setIsTyping(true);
      onChange?.(newValue);
      updateDocInSupabase(newValue);

      setTimeout(() => setIsTyping(false), 1000);
    };

    const updateDocInSupabase = async (newContent: string) => {
      if (!docUrl) return;

      const { error } = await supabase
        .from("documents")
        .update({ content: newContent })
        .eq("url", docUrl);

      if (error) {
        console.error("Failed to update document in Supabase:", error);
      }
    };

    useEffect(() => {
      if (!docUrl) return;

      const subscription = supabase
        .channel("realtime:documents")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "documents", filter: `url=eq.${docUrl}` },
          (payload) => {
            if (!isTyping && payload.new.content !== undefined) {
              setContent((prevContent) => {
                if (prevContent !== payload.new.content) {
                  return payload.new.content;
                }
                return prevContent;
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }, [docUrl, isTyping]);

    return (
      <div className="flex gap-4">
        <Editor
          height={height}
          width={width}
          defaultLanguage="markdown"
          value={content}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 18,
            wordWrap: "on",
            wrappingIndent: "indent",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
          }}
          theme={useTheme().resolvedTheme === "dark" ? "vs-dark" : "light"}
        />
        <MarkdownViewer content={content} />
      </div>
    );
  }
);

MarkdownEditor.displayName = "MarkdownEditor";
