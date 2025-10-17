"use client";

import React, { useRef, useEffect } from "react";
import type { OnMount } from "@monaco-editor/react";
import { debounce } from "lodash";
import { Editor } from "@monaco-editor/react";

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  docUrl?: string;
}

export default function MarkdownEditor({
  value = "",
  onChange,
}: MarkdownEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const prevValueRef = useRef<string>(value);
  const isUserEditingRef = useRef<boolean>(false);
  const internalValueRef = useRef<string>(value);

  const debouncedOnChange = useRef(
    debounce((newValue: string | undefined) => {
      if (onChange) {
        onChange(newValue);
      }
    }, 300),
  ).current;

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    if (editor.getValue() !== value) {
      editor.setValue(value);
    }

    editor.onDidChangeModelContent((e) => {
      isUserEditingRef.current = true;

      internalValueRef.current = editor.getValue();

      setTimeout(() => {
        isUserEditingRef.current = false;
      }, 100);

      if (e.changes.length > 0) {
        debouncedOnChange(internalValueRef.current);
      }
    });
  };

  useEffect(() => {
    if (!editorRef.current) return;

    if (internalValueRef.current === value) {
      return;
    }

    if (prevValueRef.current !== value && !isUserEditingRef.current) {
      const currentPosition = editorRef.current.getPosition();

      if (currentPosition) {
        const prevCursorOffset =
          editorRef.current.getModel()?.getOffsetAt(currentPosition) || 0;

        try {
          const model = editorRef.current.getModel();
          if (model) {
            model.setValue(value);
            internalValueRef.current = value;

            const newPosition = model.getPositionAt(
              Math.min(prevCursorOffset, value.length),
            );
            editorRef.current.setPosition(newPosition);
            editorRef.current.revealPositionInCenter(newPosition);
          }
        } catch (err) {
          console.error(
            "Error updating content and restoring cursor position:",
            err,
          );
        }
      } else {
        try {
          editorRef.current.setValue(value);
          internalValueRef.current = value;
        } catch (err) {
          console.error("Error updating content:", err);
        }
      }
    }

    prevValueRef.current = value;
  }, [value]);

  return (
    <Editor
      height="100%"
      width="100%"
      defaultLanguage="markdown"
      defaultValue={value}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 18,
        suggestOnTriggerCharacters: false,
        quickSuggestions: false,
        acceptSuggestionOnEnter: "off",
        wrappingIndent: "indent",
        scrollBeyondLastLine: true,
        automaticLayout: true,
        wordWrap: "on",
        tabSize: 4,
      }}
    />
  );
}
