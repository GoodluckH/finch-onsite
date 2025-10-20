import { getMatter } from "@/app/actions/matters";
import { getTranscriptByMatterId } from "@/app/actions/transcripts";
import { MatterDetailView } from "@/components/matter-detail-view";
import { MatterPageClient } from "@/components/matter-page-client";
import { TranscriptViewer } from "@/components/transcript-viewer";
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

  // Fetch transcript if available
  const transcript = await getTranscriptByMatterId(Number(id));

  return (
    <MatterPageClient matter={matter}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column: Intake form */}
        <div>
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
        </div>

        {/* Right column: Transcript viewer */}
        {transcript && (
          <div className="lg:sticky lg:top-4 lg:self-start">
            <TranscriptViewer transcript={transcript} />
          </div>
        )}
      </div>
    </MatterPageClient>
  );
}
