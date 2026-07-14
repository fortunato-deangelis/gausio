import { History } from "lucide-react";
import { AppCard } from "@/components/shared";
import { formatDateTime } from "@/lib/format";
import type { IsoRevisionRow } from "../queries";

type RevisionsListProps = Readonly<{
  revisions: IsoRevisionRow[];
  currentRevision: number;
}>;

/** Storico revisioni del documento (timeline). */
export function RevisionsList({
  revisions,
  currentRevision,
}: RevisionsListProps) {
  return (
    <AppCard
      title={
        <span className="flex items-center gap-2">
          <History aria-hidden className="size-4" />
          Storico revisioni
        </span>
      }
      description={`Revisione corrente: Rev. ${currentRevision}`}
    >
      {revisions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nessuna revisione precedente: il documento è alla sua prima stesura.
        </p>
      ) : (
        <ol className="relative flex flex-col gap-4 border-l pl-4">
          {revisions.map((rev) => (
            <li key={rev.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary"
              />
              <p className="text-sm font-medium">
                Rev. {rev.revision} → Rev. {rev.revision + 1}
              </p>
              <p className="text-sm text-muted-foreground">
                {rev.changeDescription ?? "Modifica al contenuto."}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(rev.createdAt)}
                {rev.authorName ? ` · ${rev.authorName}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </AppCard>
  );
}
