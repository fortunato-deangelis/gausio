import NextAuth, { type DefaultSession } from "next-auth";
import Zitadel from "next-auth/providers/zitadel";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

/**
 * Auth.js v5. Il flusso di autenticazione è delegato a Zitadel (OIDC);
 * al primo login l'utente viene sincronizzato nella tabella `users`.
 *
 * In sviluppo, impostando AUTH_DEV_LOGIN=true, è disponibile un provider
 * credenziali che crea/loggail un utente a partire dalla sola email,
 * per lavorare senza un'istanza Zitadel raggiungibile.
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
  zitadelId: string | null;
  email: string;
  name: string | null;
  image: string | null;
}): Promise<string> {
  const existing = input.zitadelId
    ? await db.query.users.findFirst({
        where: eq(users.zitadelId, input.zitadelId),
      })
    : await db.query.users.findFirst({ where: eq(users.email, input.email) });

  if (existing) {
    await db
      .update(users)
      .set({
        email: input.email,
        name: input.name ?? existing.name,
        image: input.image ?? existing.image,
        zitadelId: input.zitadelId ?? existing.zitadelId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return existing.id;
  }

  const byEmail = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });
  if (byEmail) {
    await db
      .update(users)
      .set({ zitadelId: input.zitadelId ?? byEmail.zitadelId })
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

/** Zitadel è attivo solo se configurato: con env vuote il provider
 * farebbe fallire ogni route di auth alla discovery OIDC. */
export const isZitadelConfigured = Boolean(
  process.env.AUTH_ZITADEL_ISSUER &&
    process.env.AUTH_ZITADEL_ID &&
    process.env.AUTH_ZITADEL_SECRET
);

const providers = [];

if (isZitadelConfigured) {
  providers.push(
    Zitadel({
      issuer: process.env.AUTH_ZITADEL_ISSUER,
      clientId: process.env.AUTH_ZITADEL_ID,
      clientSecret: process.env.AUTH_ZITADEL_SECRET,
    })
  );
}

if (process.env.AUTH_DEV_LOGIN === "true") {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Login di sviluppo",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Nome", type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        if (!email.includes("@")) return null;
        const name = String(credentials?.name ?? "") || email.split("@")[0];
        const id = await syncUser({
          zitadelId: null,
          email,
          name,
          image: null,
        });
        return { id, email, name };
      },
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
    async jwt({ token, account, profile, user }) {
      // Primo login OIDC: sincronizza l'utente su DB e memorizza l'id interno.
      if (account?.provider === "zitadel" && profile) {
        token.dbUserId = await syncUser({
          zitadelId: String(profile.sub),
          email: String(profile.email ?? token.email ?? ""),
          name: (profile.name as string | null) ?? null,
          image: (profile.picture as string | null) ?? null,
        });
      }
      if (account?.provider === "dev-login" && user?.id) {
        token.dbUserId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.dbUserId) session.user.id = token.dbUserId as string;
      return session;
    },
  },
});
