"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "@/shared/ui";

export function TrackLookup({ locale, label, placeholder, submit }: { locale: string; label: string; placeholder: string; submit: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) router.push(`/${locale}/track/${encodeURIComponent(code.trim().toUpperCase())}`);
      }}
    >
      <Field label={label}>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={placeholder} className="font-mono text-lg uppercase tracking-wider" required autoFocus />
      </Field>
      <Button type="submit" size="lg">{submit}</Button>
    </form>
  );
}
