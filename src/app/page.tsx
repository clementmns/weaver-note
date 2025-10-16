import { Button } from "@/components/ui/button";

export default function Home() {

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <p className="text-lg mb-2">Welcome to the Collaborative Markdown Editor!</p>
      <p className="text-sm mb-4">Please log in to continue.</p>
      <a href="/auth/login"><Button size="lg">Go to Login</Button></a>
    </div>
  );
}
