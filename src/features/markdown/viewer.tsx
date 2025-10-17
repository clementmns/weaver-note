"use client";

import React from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  const safeContent = typeof content === "string" ? content : "";

  return (
    <div className="w-full px-6 py-2">
      <MarkdownPreview
        source={safeContent}
        style={{
          backgroundColor: "transparent",
        }}
      />
      <style jsx global>{`
        .wmde-markdown img {
          background-color: transparent !important;
        }
      `}</style>
    </div>
  );
}
