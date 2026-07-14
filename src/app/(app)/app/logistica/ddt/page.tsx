import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import {
  Button,
  ExportMenu,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { listDdts } from "@/features/ddt/queries";
import { DdtTable } from "@/features/ddt/components/ddt-table";

export const metadata = { title: "DDT" };

export default async function Page({
  searchParams,
}: Readonly<{ searchParams: Promise<{ direction?: string }> }>) {
  const { direction: rawDirection } = await searchParams;
  const direction = rawDirection === "received" ? "received" : "issued";

  const ctx = await requireWorkspace();
  if (!can(ctx, "ddt", "view")) redirect("/app");

  const rows = await listDdts(ctx, direction);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documenti di trasporto"
        description="DDT emessi e ricevuti."
        actions={
          <>
            <ExportMenu
              pdfUrl={`/api/export/ddt?direction=${direction}&format=pdf`}
              xlsxUrl={`/api/export/ddt?direction=${direction}&format=xlsx`}
            />
            {can(ctx, "ddt", "create") && (
              <Button asChild>
                <Link href={`/app/logistica/ddt/nuovo?direction=${direction}`}>
                  <Plus className="size-4" />
                  Nuovo DDT
                </Link>
              </Button>
            )}
          </>
        }
      />

      <Tabs value={direction}>
        <TabsList>
          <TabsTrigger value="issued" asChild>
            <Link href="/app/logistica/ddt?direction=issued">Emessi</Link>
          </TabsTrigger>
          <TabsTrigger value="received" asChild>
            <Link href="/app/logistica/ddt?direction=received">Ricevuti</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DdtTable
        rows={rows}
        direction={direction}
        canEdit={can(ctx, "ddt", "edit")}
        canDelete={can(ctx, "ddt", "delete")}
      />
    </div>
  );
}
