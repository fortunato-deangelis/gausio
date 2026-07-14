import type { PermissionMap, RoleKey } from "@/server/auth/permissions";

/** Sottinsieme serializzabile del WorkspaceContext passato alla shell client. */
export type ShellContext = Readonly<{
  userName: string | null;
  userEmail: string;
  workspaceId: string;
  workspaceName: string;
  roleKey: RoleKey;
  roleName: string;
  permissions: PermissionMap;
  memberships: readonly { workspaceId: string; workspaceName: string }[];
}>;
