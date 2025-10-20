import { getMatter } from "@/app/actions/matters";
import { getTranscriptByMatterId } from "@/app/actions/transcripts";
import { MatterPageClient } from "@/components/matter-page-client";
import { MatterPageContent } from "@/components/matter-page-content";
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

  console.log(matter.intakeFormData.liability)

  // Fetch transcript if available
  const transcript = await getTranscriptByMatterId(Number(id));

  return (
    <MatterPageClient matter={matter}>
      <MatterPageContent matter={matter} transcript={transcript} />
    </MatterPageClient>
  );
}
