import type { Metadata } from "next";
import { SignInPageContent } from "@/features/auth/components/sign-in-page";

export const metadata: Metadata = {
  title: "Accedi",
  description: "Accedi, registrati o recupera il tuo account Gausio.",
};

type SignInPageProps = Readonly<{
  searchParams: Promise<{
    callbackUrl?: string;
    mode?: string;
    error?: string;
  }>;
}>;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  return <SignInPageContent {...params} />;
}
