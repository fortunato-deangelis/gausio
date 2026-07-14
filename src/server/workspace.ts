import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  rolePermissions,
  roles,
  workspaceMembers,
  workspaces,
} from "@/server/db/schema";
import {
  emptyPermissionMap,
  type AppModule,
  type PermissionAction,
  type PermissionMap,
  type RoleKey,
} from "@/server/auth/permissions";

/**
 * Contesto workspace della richiesta corrente: utente autenticato, workspace
 * attivo (cookie `gausio_ws`, con fallback sulla prima membership) e mappa
 * dei permessi del ruolo.
 */

export const ACTIVE_WORKSPACE_COOKIE = "gausio_ws";

export type WorkspaceContext = Readonly<{
  userId: string;
  userName: string | null;
  userEmail: string;
  workspace: typeof workspaces.$inferSelect;
  memberId: string;
  role: Readonly<{ id: string; key: RoleKey; name: string }>;
  permissions: PermissionMap;
  /** Tutte le membership dell'utente, per lo switcher. */
  memberships: readonly { workspaceId: string; workspaceName: string }[];
}>;

async function loadPermissionMap(
  roleId: string,
  roleKey: RoleKey
): Promise<PermissionMap> {
  if (roleKey === "admin") {
    const full = emptyPermissionMap();
    return Object.fromEntries(
      Object.keys(full).map((m) => [
        m,
        { view: true, create: true, edit: true, delete: true },
      ])
    ) as PermissionMap;
  }
  const rows = await db.query.rolePermissions.findMany({
    where: eq(rolePermissions.roleId, roleId),
  });
  const map = { ...emptyPermissionMap() } as Record<
    AppModule,
    { view: boolean; create: boolean; edit: boolean; delete: boolean }
  >;
  for (const row of rows) {
    map[row.module] = {
      view: row.canView,
      create: row.canCreate,
      edit: row.canEdit,
      delete: row.canDelete,
    };
  }
  return map;
}

/**
 * Restituisce il contesto workspace, o null se l'utente non è autenticato
 * o non appartiene ad alcun workspace. Memoizzata per richiesta.
 */
export const getWorkspaceContext = cache(
  async (): Promise<WorkspaceContext | null> => {
    const session = await auth();
    if (!session?.user?.id) return null;
    const userId = session.user.id;

    const memberships = await db
      .select({
        memberId: workspaceMembers.id,
        workspaceId: workspaceMembers.workspaceId,
        workspaceName: workspaces.name,
        roleId: workspaceMembers.roleId,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, userId));

    if (memberships.length === 0) return null;

    const cookieStore = await cookies();
    const preferred = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
    const active =
      memberships.find((m) => m.workspaceId === preferred) ?? memberships[0];

    const [workspace, role] = await Promise.all([
      db.query.workspaces.findFirst({
        where: eq(workspaces.id, active.workspaceId),
      }),
      db.query.roles.findFirst({ where: eq(roles.id, active.roleId) }),
    ]);
    if (!workspace || !role) return null;

    const permissions = await loadPermissionMap(role.id, role.key);

    return {
      userId,
      userName: session.user.name ?? null,
      userEmail: session.user.email ?? "",
      workspace,
      memberId: active.memberId,
      role: { id: role.id, key: role.key, name: role.name },
      permissions,
      memberships: memberships.map((m) => ({
        workspaceId: m.workspaceId,
        workspaceName: m.workspaceName,
      })),
    };
  }
);

/**
 * Come getWorkspaceContext, ma con redirect automatici: utente anonimo →
 * sign-in, utente senza workspace → onboarding.
 */
export async function requireWorkspace(): Promise<WorkspaceContext> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/onboarding");
  return ctx;
}

export function can(
  ctx: WorkspaceContext,
  module: AppModule,
  action: PermissionAction
): boolean {
  return ctx.permissions[module]?.[action] ?? false;
}

/**
 * Guardia per server action e route handler: contesto + permesso richiesto,
 * altrimenti errore.
 */
export async function requirePermission(
  module: AppModule,
  action: PermissionAction
): Promise<WorkspaceContext> {
  const ctx = await getWorkspaceContext();
  if (!ctx) throw new Error("Non autenticato o nessun workspace attivo.");
  if (!can(ctx, module, action)) {
    throw new Error("Permesso negato per questa operazione.");
  }
  return ctx;
}

/** Verifica che un'entità appartenga al workspace attivo. */
export function assertSameWorkspace(
  ctx: WorkspaceContext,
  entityWorkspaceId: string
): void {
  if (ctx.workspace.id !== entityWorkspaceId) {
    throw new Error("Risorsa non appartenente al workspace attivo.");
  }
}
