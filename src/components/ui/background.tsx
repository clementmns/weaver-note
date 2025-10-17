import React from "react";
import { DotPattern } from "@/components/ui/dot-pattern";

export default function Background() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 h-[80%] w-full rounded-full bg-gradient-to-br from-primary/60 via-secondary/10 to-transparent blur-3xl opacity-40 -z-1000"
      />
      <DotPattern
        aria-hidden
        className="-z-1000 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]"
        width={24}
        height={24}
      />
    </>
  );
}
