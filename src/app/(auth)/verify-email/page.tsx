import type { Metadata } from "next";
import { VerifyEmailPageContent } from "@/features/auth/components/verify-email-page";

export const metadata: Metadata = {
  title: "Verifica email",
  description: "Conferma l'indirizzo email del tuo account Gausio.",
};

type VerifyEmailPageProps = Readonly<{
  searchParams: Promise<{
    userId?: string;
    code?: string;
  }>;
}>;

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  return <VerifyEmailPageContent userId={params.userId} code={params.code} />;
}
