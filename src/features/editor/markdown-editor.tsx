"use client";
import dynamic from "next/dynamic";
import React, { useRef, useImperativeHandle, useState, forwardRef } from "react";

const Editor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.Editor),
  { ssr: false }
);


export interface MarkdownEditorProps {
  defaultValue?: string;
  height?: string | number;
  width?: string | number;
}

export interface MarkdownEditorRef {
  getContent: () => string;
}

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ defaultValue = "", height = "80vh", width = "100%" }, ref) => {
    const [content, setContent] = useState(defaultValue);

    useImperativeHandle(ref, () => ({
      getContent: () => content,
    }), [content]);

    return (
      <Editor
        height={height}
        width={width}
        defaultLanguage="markdown"
        value={content}
        onChange={v => setContent(v ?? "")}
        options={{ minimap: { enabled: false } }}
      />
    );
  }
);
