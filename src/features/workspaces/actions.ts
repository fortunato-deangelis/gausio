"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  rolePermissions,
  roles,
  workspaceInvitations,
  workspaceMembers,
  workspaces,
} from "@/server/db/schema";
import {
  DEFAULT_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  MODULE_VALUES,
  type AppModule,
} from "@/server/auth/permissions";
import {
  ACTIVE_WORKSPACE_COOKIE,
  getWorkspaceContext,
  requirePermission,
} from "@/server/workspace";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  inviteMemberSchema,
  onboardingSchema,
  updateRolePermissionsSchema,
  updateWorkspaceSchema,
  type InviteMemberInput,
  type OnboardingInput,
  type UpdateRolePermissionsInput,
  type UpdateWorkspaceInput,
} from "./schema";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "workspace"
  );
}

/**
 * Onboarding: crea il workspace (azienda), semina i ruoli predefiniti con i
 * relativi permessi e rende l'utente corrente amministratore.
 */
export async function createWorkspace(
  input: OnboardingInput
): Promise<ActionResult<{ workspaceId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return fail(new Error("Non autenticato."));
    const parsed = onboardingSchema.parse(input);

    const baseSlug = slugify(parsed.name);
    const existing = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, baseSlug),
    });
    const slug = existing ? `${baseSlug}-${randomUUID().slice(0, 6)}` : baseSlug;

    const workspaceId = await db.transaction(async (tx) => {
      const [workspace] = await tx
        .insert(workspaces)
        .values({
          name: parsed.name,
          slug,
          vatNumber: parsed.vatNumber || null,
          fiscalCode: parsed.fiscalCode || null,
          address: parsed.address || null,
          city: parsed.city || null,
          zipCode: parsed.zipCode || null,
          province: parsed.province || null,
          email: parsed.email || null,
          phone: parsed.phone || null,
          pec: parsed.pec || null,
          sdiCode: parsed.sdiCode || null,
          onboarding: {
            sector: parsed.sector,
            companySize: parsed.companySize,
            goal: parsed.goal,
            discoveryChannel: parsed.discoveryChannel ?? "",
          },
          createdBy: session.user.id,
        })
        .returning({ id: workspaces.id });

      let adminRoleId: string | null = null;
      for (const roleDef of DEFAULT_ROLES) {
        const [role] = await tx
          .insert(roles)
          .values({
            workspaceId: workspace.id,
            key: roleDef.key,
            name: roleDef.name,
            description: roleDef.description,
            isSystem: roleDef.isSystem,
          })
          .returning({ id: roles.id });
        if (roleDef.key === "admin") adminRoleId = role.id;

        const permissionMap = DEFAULT_ROLE_PERMISSIONS[roleDef.key];
        await tx.insert(rolePermissions).values(
          MODULE_VALUES.map((module) => ({
            roleId: role.id,
            module,
            canView: permissionMap[module].view,
            canCreate: permissionMap[module].create,
            canEdit: permissionMap[module].edit,
            canDelete: permissionMap[module].delete,
          }))
        );
      }

      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: session.user.id,
        roleId: adminRoleId!,
      });

      return workspace.id;
    });

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidatePath("/app", "layout");
    return ok({ workspaceId });
  } catch (error) {
    return fail(error);
  }
}

/** Cambia il workspace attivo (cookie) tra quelli di cui si è membri. */
export async function switchWorkspace(
  workspaceId: string
): Promise<ActionResult<undefined>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return fail(new Error("Non autenticato."));
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, session.user.id)
      ),
    });
    if (!membership) return fail(new Error("Non sei membro di questo workspace."));

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/app", "layout");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/** Aggiorna il profilo aziendale. */
export async function updateWorkspace(
  input: UpdateWorkspaceInput
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("settings", "edit");
    const parsed = updateWorkspaceSchema.parse(input);
    await db
      .update(workspaces)
      .set({
        name: parsed.name,
        vatNumber: parsed.vatNumber || null,
        fiscalCode: parsed.fiscalCode || null,
        address: parsed.address || null,
        city: parsed.city || null,
        zipCode: parsed.zipCode || null,
        province: parsed.province || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        pec: parsed.pec || null,
        sdiCode: parsed.sdiCode || null,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, ctx.workspace.id));
    revalidatePath("/app", "layout");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/**
 * Invita un membro via email. L'invito genera un token; in assenza di un
 * provider email configurato, il link va condiviso manualmente.
 */
export async function inviteMember(
  input: InviteMemberInput
): Promise<ActionResult<{ inviteUrl: string }>> {
  try {
    const ctx = await requirePermission("settings", "create");
    const parsed = inviteMemberSchema.parse(input);

    const role = await db.query.roles.findFirst({
      where: and(
        eq(roles.id, parsed.roleId),
        eq(roles.workspaceId, ctx.workspace.id)
      ),
    });
    if (!role) return fail(new Error("Ruolo non valido."));

    const token = randomUUID();
    await db.insert(workspaceInvitations).values({
      workspaceId: ctx.workspace.id,
      email: parsed.email.toLowerCase(),
      roleId: role.id,
      token,
      invitedBy: ctx.userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    });

    revalidatePath("/app/impostazioni/membri");
    return ok({ inviteUrl: `/invito/${token}` });
  } catch (error) {
    return fail(error);
  }
}

/** Accetta un invito: crea la membership per l'utente autenticato. */
export async function acceptInvitation(
  token: string
): Promise<ActionResult<{ workspaceId: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return fail(new Error("Non autenticato."));

    const invitation = await db.query.workspaceInvitations.findFirst({
      where: eq(workspaceInvitations.token, token),
    });
    if (!invitation || invitation.status !== "pending") {
      return fail(new Error("Invito non valido o già utilizzato."));
    }
    if (invitation.expiresAt < new Date()) {
      return fail(new Error("Invito scaduto."));
    }

    const existing = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, invitation.workspaceId),
        eq(workspaceMembers.userId, session.user.id)
      ),
    });
    if (!existing) {
      await db.insert(workspaceMembers).values({
        workspaceId: invitation.workspaceId,
        userId: session.user.id,
        roleId: invitation.roleId,
      });
    }
    await db
      .update(workspaceInvitations)
      .set({ status: "accepted" })
      .where(eq(workspaceInvitations.id, invitation.id));

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, invitation.workspaceId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidatePath("/app", "layout");
    return ok({ workspaceId: invitation.workspaceId });
  } catch (error) {
    return fail(error);
  }
}

/** Cambia il ruolo di un membro. */
export async function updateMemberRole(
  memberId: string,
  roleId: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("settings", "edit");
    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, ctx.workspace.id)
      ),
    });
    if (!member) return fail(new Error("Membro non trovato."));
    const role = await db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.workspaceId, ctx.workspace.id)),
    });
    if (!role) return fail(new Error("Ruolo non valido."));

    await db
      .update(workspaceMembers)
      .set({ roleId })
      .where(eq(workspaceMembers.id, memberId));
    revalidatePath("/app/impostazioni/membri");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/** Rimuove un membro dal workspace. */
export async function removeMember(
  memberId: string
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("settings", "delete");
    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, ctx.workspace.id)
      ),
    });
    if (!member) return fail(new Error("Membro non trovato."));
    if (member.userId === ctx.userId) {
      return fail(new Error("Non puoi rimuovere te stesso."));
    }
    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId));
    revalidatePath("/app/impostazioni/membri");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/** Aggiorna la matrice permessi di un ruolo (non admin). */
export async function updateRolePermissions(
  input: UpdateRolePermissionsInput
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requirePermission("settings", "edit");
    const parsed = updateRolePermissionsSchema.parse(input);

    const role = await db.query.roles.findFirst({
      where: and(
        eq(roles.id, parsed.roleId),
        eq(roles.workspaceId, ctx.workspace.id)
      ),
    });
    if (!role) return fail(new Error("Ruolo non trovato."));
    if (role.key === "admin") {
      return fail(new Error("I permessi dell'amministratore non sono modificabili."));
    }

    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
      await tx.insert(rolePermissions).values(
        parsed.permissions
          .filter((p) => MODULE_VALUES.includes(p.module as AppModule))
          .map((p) => ({
            roleId: role.id,
            module: p.module as AppModule,
            canView: p.view,
            canCreate: p.create,
            canEdit: p.edit,
            canDelete: p.delete,
          }))
      );
    });

    revalidatePath("/app/impostazioni/ruoli");
    return ok(undefined);
  } catch (error) {
    return fail(error);
  }
}

/** Elenco ruoli del workspace (per select e gestione). */
export async function listRoles(): Promise<
  { id: string; key: string; name: string; isSystem: boolean }[]
> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  const rows = await db.query.roles.findMany({
    where: eq(roles.workspaceId, ctx.workspace.id),
  });
  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    isSystem: r.isSystem,
  }));
}
