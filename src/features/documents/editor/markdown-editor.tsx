"use client";

import React from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.Editor),
  { ssr: false },
);

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  docUrl?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value = "",
  onChange,
}) => {
  return (
    <Editor
      height="100%"
      width="100%"
      defaultLanguage="markdown"
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        fontSize: 18,
        wrappingIndent: "indent",
        scrollBeyondLastLine: true,
        automaticLayout: true,
        wordWrap: "on",
        tabSize: 4,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
      }}
    />
  );
};

export default MarkdownEditor;
