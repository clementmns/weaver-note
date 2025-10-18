"use client";

import MarkdownEditor from "./editor";
import { ViewMode } from "@/types/global";

interface MarkdownProps {
  docUrl: string;
  viewMode: ViewMode;
}

export default function Markdown({ viewMode, docUrl }: MarkdownProps) {
  return (
    <div className="flex gap-4 flex-1 max-h-[88vh]">
      <div
        className={`w-full border rounded-lg overflow-hidden bg-background ${viewMode !== ViewMode.VIEW ? "block" : "hidden"}`}
      >
        <MarkdownEditor documentURL={docUrl} />
      </div>
    </div>
  );
}
