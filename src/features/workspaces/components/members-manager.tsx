"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Trash2, UserPlus } from "lucide-react";
import {
  AppCard,
  AppDialog,
  Avatar,
  AvatarFallback,
  Button,
  ConfirmDialog,
  EmptyState,
  FormError,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectField,
  Spinner,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextField,
} from "@/components/shared";
import { formatDate } from "@/lib/format";
import { inviteMemberSchema, type InviteMemberInput } from "../schema";
import { inviteMember, removeMember, updateMemberRole } from "../actions";
import type { MemberRow, PendingInvitationRow } from "../queries";

type RoleOption = Readonly<{ id: string; name: string }>;

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

/** Gestione membri: elenco, cambio ruolo, rimozione, inviti. */
export function MembersManager({
  members,
  invitations,
  roleOptions,
  currentUserId,
  canEdit,
  canDelete,
  canInvite,
}: Readonly<{
  members: MemberRow[];
  invitations: PendingInvitationRow[];
  roleOptions: RoleOption[];
  currentUserId: string;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
}>) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", roleId: "" },
  });

  const onInvite = form.handleSubmit(async (values) => {
    setError(null);
    const result = await inviteMember(values);
    if (result.ok) {
      const absolute = `${window.location.origin}${result.data.inviteUrl}`;
      setInviteUrl(absolute);
      toast.success("Invito creato.");
      router.refresh();
    } else {
      setError(result.error);
    }
  });

  const onRoleChange = async (memberId: string, roleId: string) => {
    const result = await updateMemberRole(memberId, roleId);
    if (result.ok) {
      toast.success("Ruolo aggiornato.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Link copiato negli appunti.");
  };

  return (
    <div className="flex flex-col gap-4">
      <AppCard
        title="Membri del workspace"
        description="Le persone che hanno accesso a questo workspace e il loro ruolo."
        actions={
          canInvite ? (
            <Button
              onClick={() => {
                form.reset({ email: "", roleId: "" });
                setInviteUrl(null);
                setError(null);
                setInviteOpen(true);
              }}
            >
              <UserPlus aria-hidden className="size-4" />
              Invita membro
            </Button>
          ) : undefined
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utente</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Membro dal</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.memberId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                        {initials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.name ?? "—"}
                        {member.userId === currentUserId && (
                          <span className="text-muted-foreground"> (tu)</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {canEdit && member.userId !== currentUserId ? (
                    <Select
                      value={member.roleId}
                      onValueChange={(roleId) =>
                        onRoleChange(member.memberId, roleId)
                      }
                    >
                      <SelectTrigger
                        className="w-44"
                        aria-label={`Ruolo di ${member.email}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge
                      label={member.roleName}
                      tone={member.roleKey === "admin" ? "default" : "muted"}
                    />
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(member.joinedAt)}
                </TableCell>
                <TableCell>
                  {canDelete && member.userId !== currentUserId && (
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Rimuovi ${member.email}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      }
                      title="Rimuovere il membro?"
                      description={`${member.email} perderà l'accesso al workspace.`}
                      confirmLabel="Rimuovi"
                      onConfirm={async () => {
                        const result = await removeMember(member.memberId);
                        if (result.ok) {
                          toast.success("Membro rimosso.");
                          router.refresh();
                        } else {
                          toast.error(result.error);
                        }
                      }}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AppCard>

      <AppCard
        title="Inviti in sospeso"
        description="Inviti creati ma non ancora accettati."
      >
        {invitations.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Nessun invito in sospeso"
            description="Gli inviti che crei appariranno qui finché non vengono accettati."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Scade il</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="text-sm">{invitation.email}</TableCell>
                  <TableCell>
                    <StatusBadge label={invitation.roleName} tone="muted" />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(invitation.expiresAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Copia link invito per ${invitation.email}`}
                      onClick={() =>
                        copy(`${window.location.origin}/invito/${invitation.token}`)
                      }
                    >
                      <Copy />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AppCard>

      <AppDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invita un membro"
        description="Genera un link di invito da condividere con il collega."
      >
        {inviteUrl ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Invito creato! Condividi questo link: chi lo apre e accede potrà
              unirsi al workspace.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">
                {inviteUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                aria-label="Copia link"
                onClick={() => copy(inviteUrl)}
              >
                <Copy />
              </Button>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setInviteOpen(false)}>Chiudi</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onInvite} noValidate className="flex flex-col gap-4">
            <TextField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="collega@azienda.it"
              required
            />
            <SelectField
              control={form.control}
              name="roleId"
              label="Ruolo"
              options={roleOptions.map((r) => ({ value: r.id, label: r.name }))}
              required
            />
            <FormError message={error} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Spinner className="size-4" />}
                Crea invito
              </Button>
            </div>
          </form>
        )}
      </AppDialog>
    </div>
  );
}
