"use client";

import React, { forwardRef } from "react";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
}

export interface MarkdownEditorRef {
  save?: () => Promise<void>;
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  function MarkdownEditor({ value = "", onChange }: MarkdownEditorProps) {
    const handleEditorChange = (editorValue: string | undefined) => {
      if (editorValue !== undefined && onChange) {
        onChange(editorValue);
      }
    };

    const { resolvedTheme } = useTheme();
    const editorTheme = resolvedTheme === "dark" ? "vs-dark" : "vs-light";

    return (
      <Editor
        value={value}
        onChange={handleEditorChange}
        height="100%"
        width="100%"
        defaultLanguage="markdown"
        theme={editorTheme}
        options={{
          minimap: { enabled: false },
          fontSize: 18,
          suggestOnTriggerCharacters: false,
          quickSuggestions: false,
          wordWrap: "on",
        }}
      />
    );
  },
);

export default MarkdownEditor;
