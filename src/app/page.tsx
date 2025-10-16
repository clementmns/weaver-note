import { Button } from "../components/ui/button";
import { MarkdownEditor } from "../features/editor/markdown-editor";

export default function Home() {
  return (
    <main className="w-screen h-screen">
      <MarkdownEditor />
    </main>
  );
}
