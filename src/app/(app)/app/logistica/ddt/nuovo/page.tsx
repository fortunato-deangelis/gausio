import { redirect } from "next/navigation";
import { AppCard, PageHeader } from "@/components/shared";
import { can, requireWorkspace } from "@/server/workspace";
import { contactOptions, jobOptions } from "@/features/documents-shared/queries";
import { itemInfos, itemOptions } from "@/features/warehouse/queries";
import { DdtForm } from "@/features/ddt/components/ddt-form";

export const metadata = { title: "Nuovo DDT" };

export default async function Page({
  searchParams,
}: Readonly<{ searchParams: Promise<{ direction?: string }> }>) {
  const { direction: rawDirection } = await searchParams;
  const direction = rawDirection === "received" ? "received" : "issued";

  const ctx = await requireWorkspace();
  if (!can(ctx, "ddt", "create")) redirect("/app");

  const [contactOpts, jobOpts, itemOpts, infos] = await Promise.all([
    contactOptions(ctx, direction === "issued" ? "client" : "supplier"),
    jobOptions(ctx),
    itemOptions(ctx),
    itemInfos(ctx),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={direction === "issued" ? "Nuovo DDT emesso" : "Nuovo DDT ricevuto"}
        backHref="/app/logistica/ddt"
        backLabel="DDT"
      />
      <AppCard>
        <DdtForm
          direction={direction}
          contactOptions={contactOpts}
          jobOptions={jobOpts}
          itemOptions={itemOpts}
          itemInfos={infos}
        />
      </AppCard>
    </div>
  );
}
