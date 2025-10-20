"use server";

import { processTranscript } from "@/lib/ai/processor";
import { db } from "@/db";
import { intakeFormData, matters, transcripts, turns } from "@/db/schema";
import { revalidatePath } from "next/cache";
import type { Transcript } from "@/lib/ai/types";

/**
 * Process a transcript and create a new matter with extracted data
 */
export async function processTranscriptAndCreateMatter(
  matterName: string,
  transcript: Transcript
) {
  console.log(
    `\n[Server Action] Processing transcript for matter: "${matterName}"`
  );

  try {
    // Process the transcript with parallel specialized extraction
    const extracted = await processTranscript(transcript);

    console.log(`\n[Server Action] Creating intake form data...`);

    // Create intake form data
    const [newIntakeForm] = await db
      .insert(intakeFormData)
      .values({
        caseType: extracted.clientInfo.caseType,
        liability: extracted.liability,
        damages: extracted.damages,
        coverage: extracted.coverage,
      })
      .returning();

    console.log(
      `[Server Action] Created intake form data with ID: ${newIntakeForm.id}`
    );

    // Create matter with extracted client info
    const [newMatter] = await db
      .insert(matters)
      .values({
        name: matterName,
        clientName: extracted.clientInfo.clientName,
        clientDob: extracted.clientInfo.clientDob,
        clientPhone: extracted.clientInfo.clientPhone,
        clientEmail: extracted.clientInfo.clientEmail,
        clientAddress: extracted.clientInfo.clientAddress,
        incidentDate: extracted.clientInfo.incidentDate,
        incidentLocation: extracted.clientInfo.incidentLocation,
        intakeFormDataId: newIntakeForm.id,
        citations: null, // Citations will be added when we track them
      })
      .returning();

    console.log(`[Server Action] Created matter with ID: ${newMatter.id}`);

    // Store the transcript
    console.log(`[Server Action] Storing transcript...`);
    const [newTranscript] = await db
      .insert(transcripts)
      .values({
        matterId: newMatter.id,
        content: transcript,
      })
      .returning();

    console.log(
      `[Server Action] Created transcript with ID: ${newTranscript.id}`
    );

    // Create turn records for each segment
    console.log(
      `[Server Action] Creating ${transcript.segments.length} turn records...`
    );
    const turnValues = transcript.segments.map((segment, index) => ({
      transcriptId: newTranscript.id,
      turnIndex: index,
      speaker: segment.speaker,
      content: segment.content,
    }));

    await db.insert(turns).values(turnValues);

    console.log(
      `[Server Action] ✓ Created ${transcript.segments.length} turn records`
    );
    console.log(
      `[Server Action] ✓ Successfully created matter from transcript\n`
    );

    revalidatePath("/");
    return { success: true, matterId: newMatter.id };
  } catch (error) {
    console.error(`[Server Action] ✗ Failed to process transcript:`, error);
    throw error;
  }
}
