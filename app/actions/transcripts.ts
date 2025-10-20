"use server";

import { db } from "@/db";
import { transcripts, turns } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Transcript } from "@/lib/ai/types";

/**
 * Get transcript for a matter
 */
export async function getTranscriptByMatterId(
  matterId: number
): Promise<Transcript | null> {
  const transcript = await db.query.transcripts.findFirst({
    where: eq(transcripts.matterId, matterId),
  });

  if (!transcript) {
    return null;
  }

  // Return the stored JSON transcript
  return transcript.content as Transcript;
}

/**
 * Get turns for a transcript (with turn IDs)
 */
export async function getTurnsByTranscriptId(transcriptId: number) {
  return await db.query.turns.findMany({
    where: eq(turns.transcriptId, transcriptId),
    orderBy: (turns, { asc }) => [asc(turns.turnIndex)],
  });
}

/**
 * Get transcript metadata
 */
export async function getTranscriptMetadata(matterId: number) {
  return await db.query.transcripts.findFirst({
    where: eq(transcripts.matterId, matterId),
    columns: {
      id: true,
      uploadedAt: true,
    },
  });
}
