"use client";

import { useState } from "react";
import MarkdownEditor from "./editor";
import MarkdownViewer from "./viewer";
import { ViewMode } from "@/types/global";

interface MarkdownProps {
  docUrl: string;
  viewMode: ViewMode;
  setUserCount: (count: number) => void;
}

export default function Markdown({ viewMode, docUrl }: MarkdownProps) {
  const [editorContent, setEditorContent] = useState("");

  return (
    <div className="flex gap-4 max-h-[88vh] md:flex-row flex-col">
      <div
        className={`w-full md:h-[88vh] h-[44vh] border rounded-lg overflow-hidden bg-background ${viewMode !== ViewMode.VIEW ? "" : "hidden"} ${viewMode === ViewMode.EDIT && "!h-[88vh]"}`}
      >
        <MarkdownEditor
          documentURL={docUrl}
          onContentChange={setEditorContent}
        />
      </div>
      <div
        className={`w-full md:h-[88vh] h-[44vh] border rounded-lg overflow-hidden bg-background ${viewMode !== ViewMode.EDIT ? "" : "hidden"} ${viewMode === ViewMode.VIEW && "!h-[88vh]"}`}
        style={{ overflowY: "auto" }}
      >
        <MarkdownViewer content={editorContent} />
      </div>
    </div>
  );
}
