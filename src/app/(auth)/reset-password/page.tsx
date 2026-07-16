import type { Metadata } from "next";
import { ResetPasswordPageContent } from "@/features/auth/components/reset-password-page";

export const metadata: Metadata = {
  title: "Reimposta password",
  description: "Imposta una nuova password per il tuo account Gausio.",
};

type ResetPasswordPageProps = Readonly<{
  searchParams: Promise<{
    userId?: string;
    code?: string;
  }>;
}>;

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  return <ResetPasswordPageContent userId={params.userId} code={params.code} />;
}
