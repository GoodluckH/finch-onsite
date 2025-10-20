import { getMatter } from "@/app/actions/matters";
import { MatterDetailView } from "@/components/matter-detail-view";
import { MatterPageClient } from "@/components/matter-page-client";
import { notFound } from "next/navigation";

export default async function MatterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matter = await getMatter(Number(id));

  if (!matter || !matter.intakeFormData) {
    notFound();
  }

  return (
    <MatterPageClient matter={matter}>
      <MatterDetailView
        matter={matter}
        intakeFormDataId={matter.intakeFormData.id}
        initialIntakeData={{
          caseType: matter.intakeFormData.caseType as string,
          liability: matter.intakeFormData.liability as any,
          damages: matter.intakeFormData.damages as any,
          coverage: matter.intakeFormData.coverage as any,
        }}
      />
    </MatterPageClient>
  );
}
