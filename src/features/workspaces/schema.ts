import { z } from "zod";

export const onboardingSchema = z.object({
  // Profilo aziendale
  name: z.string().min(2, "Inserisci la ragione sociale."),
  vatNumber: z.string().optional(),
  fiscalCode: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  province: z.string().optional(),
  email: z.string().email("Email non valida.").optional().or(z.literal("")),
  phone: z.string().optional(),
  pec: z.string().optional(),
  sdiCode: z.string().optional(),
  // Questionario onboarding
  sector: z.string().min(1, "Seleziona il settore."),
  companySize: z.string().min(1, "Seleziona la dimensione."),
  goal: z.string().min(1, "Seleziona l'obiettivo principale."),
  discoveryChannel: z.string().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email("Email non valida."),
  roleId: z.string().uuid("Seleziona un ruolo."),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateWorkspaceSchema = onboardingSchema.omit({
  sector: true,
  companySize: true,
  goal: true,
  discoveryChannel: true,
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const rolePermissionRowSchema = z.object({
  module: z.string(),
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
});

export const updateRolePermissionsSchema = z.object({
  roleId: z.string().uuid(),
  permissions: z.array(rolePermissionRowSchema),
});

export type UpdateRolePermissionsInput = z.infer<
  typeof updateRolePermissionsSchema
>;
