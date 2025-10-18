"use client";

import React, { useEffect, useRef, useState } from "react";
import Y from "@/lib/yjs";
import SupabaseProvider from "@/lib/channel/documents";
import { supabase } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { Button } from "../../components/ui/button";
import { BookDashed, Copy } from "lucide-react";
import TemplateSelector from "@/features/markdown/template-selector";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

if (typeof window !== "undefined" && !window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
      const workerPath = `/_next/static/chunks/monaco-editor-workers/${label}.worker.js`;
      return workerPath;
    },
  };
}

export default function MarkdownEditor({
  documentURL,
  onContentChange,
}: {
  documentURL: string;
  onContentChange?: (content: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoInstance = useRef<any>(null);
  const ydoc = useRef<Y.Doc | null>(null);

  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);

  const { resolvedTheme } = useTheme();

  useEffect(() => {
    Promise.all([
      import("monaco-editor"),
      import("y-monaco").then((module) => module.MonacoBinding),
    ]).then(([monaco, MonacoBinding]) => {
      ydoc.current = new Y.Doc();

      const yText = ydoc.current.getText("monaco");

      if (!monacoInstance.current) {
        monacoInstance.current = monaco.editor.create(editorRef.current!, {
          language: "markdown",
          theme: resolvedTheme === "dark" ? "vs-dark" : "vs-light",
          quickSuggestions: false,
          minimap: { enabled: false },
          automaticLayout: true,
          contextmenu: false,
          scrollbar: {
            vertical: "hidden",
            horizontal: "hidden",
          },
          padding: { top: 10, bottom: 10 },
          fontSize: 16,
          wordWrap: "on",
          fontLigatures: true,
          readOnly: false,
          cursorSmoothCaretAnimation: "on",
        });
      }

      const model = monacoInstance.current.getModel();

      if (model && ydoc.current) {
        if (!monacoInstance.current.binding) {
          monacoInstance.current.binding = new MonacoBinding(
            yText,
            model,
            new Set([monacoInstance.current]),
          );
        }

        new SupabaseProvider(ydoc.current, supabase, {
          channel: `realtime-channel-${documentURL}`,
          tableName: "documents",
          columnName: "content",
          id: documentURL,
          idName: "url",
        });

        model.onDidChangeContent(() => {
          if (onContentChange) {
            onContentChange(model.getValue());
          }
        });
      }
    });

    return () => {
      monacoInstance.current?.dispose();
      ydoc.current?.destroy();
    };
  }, [documentURL, resolvedTheme, onContentChange]);

  useEffect(() => {
    const handleResize = () => {
      monacoInstance.current?.layout();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!monacoInstance.current) return;

    const updateTheme = () => {
      const theme = resolvedTheme === "dark" ? "vs-dark" : "vs-light";
      monacoInstance.current.updateOptions({ theme });
    };

    updateTheme();
  }, [resolvedTheme]);

  const handleTemplateSelection = (template: string) => {
    if (monacoInstance.current) {
      const model = monacoInstance.current.getModel();
      if (model) {
        model.setValue(template);
      }
    }
    toast.success("Template applied to the editor");
    setIsTemplateSelectorOpen(false);
  };

  const copyEditorContent = () => {
    if (monacoInstance.current) {
      const model = monacoInstance.current.getModel();
      if (model) {
        const content = model.getValue();
        navigator.clipboard
          .writeText(content)
          .then(() => {
            toast.success("Markdown content copied to clipboard");
          })
          .catch((err) => {
            console.error("Failed to copy: ", err);
          });
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute bottom-4 right-4 z-10">
        <Button onClick={copyEditorContent}>
          <Copy />
          <span className="sm:block hidden">Copy Content</span>
        </Button>
      </div>
      <Dialog
        open={isTemplateSelectorOpen}
        onOpenChange={setIsTemplateSelectorOpen}
      >
        <DialogTrigger asChild>
          <div className="absolute bottom-4 left-4 z-10">
            <Button>
              <BookDashed />
              <span className="sm:block hidden">Use Template</span>
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent>
          <TemplateSelector
            onSelect={(templateContent) => {
              handleTemplateSelection(templateContent);
            }}
          />
        </DialogContent>
      </Dialog>
      <div ref={editorRef} className="w-full h-full" />
    </div>
  );
}
