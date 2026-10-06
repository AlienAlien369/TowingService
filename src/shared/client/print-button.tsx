"use client";

import { Printer } from "lucide-react";
import { Button } from "@/shared/ui";

export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="dark" onClick={() => window.print()}>
      <Printer className="size-4" /> {label}
    </Button>
  );
}
