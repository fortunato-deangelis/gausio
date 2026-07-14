import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  rolePermissions,
  roles,
  users,
  workspaceInvitations,
  workspaceMembers,
} from "@/server/db/schema";
import {
  emptyPermissionMap,
  type AppModule,
  type PermissionMap,
} from "@/server/auth/permissions";

/** Query di supporto per le pagine impostazioni. */

export type MemberRow = Readonly<{
  memberId: string;
  userId: string;
  name: string | null;
  email: string;
  roleId: string;
  roleName: string;
  roleKey: string;
  joinedAt: string;
}>;

export async function listMembers(workspaceId: string): Promise<MemberRow[]> {
  const rows = await db
    .select({
      memberId: workspaceMembers.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      roleId: roles.id,
      roleName: roles.name,
      roleKey: roles.key,
      joinedAt: workspaceMembers.createdAt,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .innerJoin(roles, eq(roles.id, workspaceMembers.roleId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(desc(workspaceMembers.createdAt));
  return rows.map((r) => ({ ...r, joinedAt: r.joinedAt.toISOString() }));
}

export type PendingInvitationRow = Readonly<{
  id: string;
  email: string;
  roleName: string;
  token: string;
  expiresAt: string;
}>;

export async function listPendingInvitations(
  workspaceId: string
): Promise<PendingInvitationRow[]> {
  const rows = await db
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      roleName: roles.name,
      token: workspaceInvitations.token,
      expiresAt: workspaceInvitations.expiresAt,
    })
    .from(workspaceInvitations)
    .innerJoin(roles, eq(roles.id, workspaceInvitations.roleId))
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.status, "pending")
      )
    )
    .orderBy(desc(workspaceInvitations.createdAt));
  return rows.map((r) => ({ ...r, expiresAt: r.expiresAt.toISOString() }));
}

export type RoleWithPermissions = Readonly<{
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionMap;
}>;

export async function listRolesWithPermissions(
  workspaceId: string
): Promise<RoleWithPermissions[]> {
  const roleRows = await db.query.roles.findMany({
    where: eq(roles.workspaceId, workspaceId),
    orderBy: roles.createdAt,
  });

  const result: RoleWithPermissions[] = [];
  for (const role of roleRows) {
    const permissionRows = await db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, role.id),
    });
    const map = { ...emptyPermissionMap() } as Record<
      AppModule,
      { view: boolean; create: boolean; edit: boolean; delete: boolean }
    >;
    for (const p of permissionRows) {
      map[p.module] = {
        view: p.canView,
        create: p.canCreate,
        edit: p.canEdit,
        delete: p.canDelete,
      };
    }
    result.push({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: map,
    });
  }
  return result;
}
