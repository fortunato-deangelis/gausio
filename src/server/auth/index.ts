import NextAuth, { type DefaultSession } from "next-auth";
import Zitadel from "next-auth/providers/zitadel";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import {
  getOidcEndpoints,
  getZitadelIssuer,
  isZitadelConfigured as isZitadelConfiguredFromEnv,
} from "@/server/security/config";
import { logger } from "@/server/security/log";

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

declare module "next-auth/jwt" {
  interface JWT {
    /** id interno della tabella `users`. */
    dbUserId?: string;
    /** id_token ZITADEL, confinato al JWT server-side (mai nel client). */
    zitadelIdToken?: string;
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
export const isZitadelConfigured = isZitadelConfiguredFromEnv;

const providers = [];

if (isZitadelConfigured) {
  const endpoints = getOidcEndpoints();
  providers.push(
    Zitadel({
      // Discovery OIDC via issuer; gli endpoint token/userinfo/jwks restano
      // sull'issuer ZITADEL e sono usati solo server-side.
      issuer: getZitadelIssuer(),
      clientId: process.env.AUTH_ZITADEL_ID ?? process.env.ZITADEL_CLIENT_ID,
      clientSecret:
        process.env.AUTH_ZITADEL_SECRET ?? process.env.ZITADEL_CLIENT_SECRET,
      // Authorization Code Flow + PKCE (default del provider). Se è configurata
      // una Custom Login App, l'utente raggiunge l'authorization endpoint
      // tramite ZITADEL_LOGIN_BASE_URL (custom login base URL).
      ...(endpoints.authorization
        ? {
            authorization: {
              url: endpoints.authorization,
              params: { scope: "openid email profile" },
            },
          }
        : {}),
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
        try {
          token.dbUserId = await syncUser({
            zitadelId: String(profile.sub),
            email: String(profile.email ?? token.email ?? ""),
            name: (profile.name as string | null) ?? null,
            image: (profile.picture as string | null) ?? null,
          });
        } catch (error) {
          // Non esporre dettagli sensibili: log redatto lato server.
          logger.error("Sincronizzazione utente OIDC fallita", error);
          throw new Error("AccessDenied");
        }
        // id_token conservato SOLO nel JWT cifrato (cookie httpOnly), mai
        // esposto nella sessione inviata al client. Serve come id_token_hint
        // opzionale per il logout federato.
        if (account.id_token) token.zitadelIdToken = account.id_token;
      }
      if (account?.provider === "dev-login" && user?.id) {
        token.dbUserId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      // Esponiamo al client solo l'id utente interno: nessun access/id token.
      if (token.dbUserId) session.user.id = token.dbUserId as string;
      return session;
    },
  },
});
