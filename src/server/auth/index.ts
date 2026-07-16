import NextAuth, { type DefaultSession } from "next-auth";
import Zitadel from "next-auth/providers/zitadel";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

/**
 * Auth.js v5. L'autenticazione è delegata a Zitadel (OIDC, code flow +
 * PKCE): unica modalità di login per tutti gli ambienti — in locale si usa
 * un'applicazione OIDC Zitadel dedicata allo sviluppo. Al primo login
 * l'utente viene sincronizzato nella tabella `users`.
 */

declare module "next-auth" {
  interface Session {
    user: {
      /** id della tabella `users` (non il sub Zitadel). */
      id: string;
    } & DefaultSession["user"];
  }
}

async function syncUser(input: {
  zitadelId: string;
  email: string;
  name: string | null;
  image: string | null;
}): Promise<string> {
  const existing = await db.query.users.findFirst({
    where: eq(users.zitadelId, input.zitadelId),
  });

  if (existing) {
    await db
      .update(users)
      .set({
        email: input.email,
        name: input.name ?? existing.name,
        image: input.image ?? existing.image,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return existing.id;
  }

  const byEmail = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });
  if (byEmail) {
    if (byEmail.zitadelId && byEmail.zitadelId !== input.zitadelId) {
      throw new Error("OIDC subject mismatch for an existing local account.");
    }
    await db
      .update(users)
      .set({ zitadelId: input.zitadelId })
      .where(eq(users.id, byEmail.id));
    return byEmail.id;
  }

  const [created] = await db
    .insert(users)
    .values({
      zitadelId: input.zitadelId,
      email: input.email,
      name: input.name,
      image: input.image,
    })
    .returning({ id: users.id });
  return created.id;
}

function verifiedProfileEmail(profile: Record<string, unknown>): string | null {
  if (profile.email_verified !== true || typeof profile.email !== "string") {
    return null;
  }
  const email = profile.email.trim().toLowerCase();
  return email && email.length <= 320 ? email : null;
}

/** Zitadel è attivo solo se configurato: con env vuote il provider
 * farebbe fallire ogni route di auth alla discovery OIDC. Il client
 * secret è opzionale: le app OIDC con Authentication Method "None"
 * (public client, code flow + PKCE) non ne hanno uno. */
export const isZitadelConfigured = Boolean(
  process.env.AUTH_ZITADEL_ISSUER && process.env.AUTH_ZITADEL_ID
);

const providers = [];

if (isZitadelConfigured) {
  const clientSecret = process.env.AUTH_ZITADEL_SECRET;
  providers.push(
    Zitadel({
      issuer: process.env.AUTH_ZITADEL_ISSUER,
      clientId: process.env.AUTH_ZITADEL_ID,
      ...(clientSecret
        ? { clientSecret }
        : { client: { token_endpoint_auth_method: "none" } }),
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "zitadel") return false;
      return Boolean(profile && verifiedProfileEmail(profile));
    },
    async jwt({ token, account, profile }) {
      // Primo login OIDC: sincronizza l'utente su DB e memorizza l'id interno.
      if (account?.provider === "zitadel" && profile) {
        const email = verifiedProfileEmail(profile);
        if (!email) throw new Error("Verified email claim missing from OIDC profile.");
        token.dbUserId = await syncUser({
          zitadelId: String(profile.sub),
          email,
          name: (profile.name as string | null) ?? null,
          image: (profile.picture as string | null) ?? null,
        });
        // Conservato per il logout OIDC (id_token_hint su end_session).
        if (account.id_token) token.idToken = account.id_token;
      }
      return token;
    },
    session({ session, token }) {
      if (token.dbUserId) session.user.id = token.dbUserId as string;
      return session;
    },
  },
});
