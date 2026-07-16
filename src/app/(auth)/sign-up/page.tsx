import type { Metadata } from "next";
import { SignUpPageContent } from "@/features/auth/components/sign-up-page";

export const metadata: Metadata = {
  title: "Registrati",
  description: "Crea il tuo account Gausio.",
};

type SignUpPageProps = Readonly<{
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}>;

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  return <SignUpPageContent {...params} />;
}
