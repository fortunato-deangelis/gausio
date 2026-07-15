"use client";

import { useRouter } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/shared";

export type AuthMode = "login" | "register" | "recover";

const AUTH_MODES: ReadonlyArray<{ value: AuthMode; label: string }> = [
  { value: "login", label: "Accedi" },
  { value: "register", label: "Registrati" },
  { value: "recover", label: "Recupera" },
];

type AuthModeToggleProps = Readonly<{
  mode: AuthMode;
  callbackUrl?: string;
}>;

/** Navigazione segmentata tra i flussi delegati a Zitadel. */
export function AuthModeToggle({ mode, callbackUrl }: AuthModeToggleProps) {
  const router = useRouter();

  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => {
        if (!value || value === mode) return;

        const params = new URLSearchParams({ mode: value });
        if (callbackUrl) params.set("callbackUrl", callbackUrl);
        router.replace(`/sign-in?${params.toString()}`);
      }}
      variant="outline"
      spacing={0}
      aria-label="Scegli il flusso di autenticazione"
      className="grid h-10 w-full grid-cols-3 rounded-[2px]!"
    >
      {AUTH_MODES.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          aria-label={item.label}
          className="h-10 min-w-0 rounded-[2px]! border-border px-2 text-base data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
