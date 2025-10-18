"use client";

import React from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import katex from "katex";
import { getCodeString } from "rehype-rewrite";
import "katex/dist/katex.css";

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
          paddingTop: "10px",
          paddingBottom: "300px",
          fontSize: "16px",
        }}
        components={{
          code: ({ children = [], className, ...props }) => {
            if (
              typeof children === "string" &&
              /^\$\$(.*)\$\$/.test(children)
            ) {
              const html = katex.renderToString(
                children.replace(/^\$\$(.*)\$\$/, "$1"),
                {
                  throwOnError: false,
                },
              );
              return (
                <code
                  dangerouslySetInnerHTML={{ __html: html }}
                  style={{ background: "transparent" }}
                />
              );
            }
            const code =
              props.node && props.node.children
                ? getCodeString(props.node.children)
                : children;
            if (
              typeof code === "string" &&
              typeof className === "string" &&
              /^language-katex/.test(className.toLocaleLowerCase())
            ) {
              const html = katex.renderToString(code, {
                throwOnError: false,
              });
              return (
                <code
                  style={{ fontSize: "150%" }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            }
            return <code className={String(className)}>{children}</code>;
          },
        }}
      />
      <style jsx global>{`
        .wmde-markdown {
          background-color: transparent !important;
        }
        .wmde-markdown ul {
          list-style: disc !important;
        }
        .wmde-markdown ol {
          list-style: decimal !important;
        }
      `}</style>
    </div>
  );
}
