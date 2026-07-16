import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInPageContent } from "@/features/auth/components/sign-in-page";

export const metadata: Metadata = {
  title: "Accedi",
  description: "Accedi al tuo account Gausio.",
};

type SignInPageProps = Readonly<{
  searchParams: Promise<{
    callbackUrl?: string;
    mode?: string;
  }>;
}>;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  if (params.mode === "register" || params.mode === "recover") {
    const path = params.mode === "register" ? "/sign-up" : "/forgot-password";
    const query = params.callbackUrl
      ? `?${new URLSearchParams({ callbackUrl: params.callbackUrl }).toString()}`
      : "";
    redirect(`${path}${query}`);
  }

  return <SignInPageContent callbackUrl={params.callbackUrl} />;
}
