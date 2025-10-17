"use client";

import React from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <div className="w-full px-6 py-2">
      <MarkdownPreview source={content} />
    </div>
  );
};

export default MarkdownViewer;
