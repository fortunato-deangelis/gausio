import Link from "next/link";
import type { ReactNode } from "react";
import { Input, Label } from "@/components/shared";

type AuthFieldProps = Readonly<{
  id: string;
  name: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  placeholder: string;
}>;

export function AuthField(props: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        name={props.name}
        type={props.type}
        required
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
      />
    </div>
  );
}

export function AuthLinkRow({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:gap-6 [&>*:last-child]:sm:text-right">
      {children}
    </div>
  );
}

export function AuthTextLink({
  href,
  children,
}: Readonly<{ href: string; children: ReactNode }>) {
  return (
    <Link
      href={href}
      className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
    >
      {children}
    </Link>
  );
}

export function LegalNotice() {
  return (
    <p className="text-center text-sm leading-relaxed text-muted-foreground">
      Consulta la <AuthTextLink href="/privacy-policy">Privacy Policy</AuthTextLink>{" "}
      e i <AuthTextLink href="/termini-e-condizioni">Termini e condizioni</AuthTextLink>.
    </p>
  );
}
