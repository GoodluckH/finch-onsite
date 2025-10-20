import { getMatter } from "@/app/actions/matters";
import { getTranscriptByMatterId, getTranscriptMetadata, getTurnsByTranscriptId } from "@/app/actions/transcripts";
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

  // Fetch transcript and turns if available
  const transcript = await getTranscriptByMatterId(Number(id));
  const transcriptMeta = await getTranscriptMetadata(Number(id));
  const turns = transcriptMeta ? await getTurnsByTranscriptId(transcriptMeta.id) : null;

  return (
    <MatterPageClient matter={matter}>
      <MatterPageContent matter={matter} transcript={transcript} turns={turns} />
    </MatterPageClient>
  );
}
