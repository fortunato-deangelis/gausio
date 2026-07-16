import type { Metadata } from "next";
import { ForgotPasswordPageContent } from "@/features/auth/components/forgot-password-page";

export const metadata: Metadata = {
  title: "Password dimenticata",
  description: "Recupera l'accesso al tuo account Gausio.",
};

type ForgotPasswordPageProps = Readonly<{
  searchParams: Promise<{ callbackUrl?: string }>;
}>;

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  return <ForgotPasswordPageContent {...params} />;
}
