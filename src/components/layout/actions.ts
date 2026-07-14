"use server";

import { signOut } from "@/server/auth";

/** Logout dalla topbar: termina la sessione e torna alla landing. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
