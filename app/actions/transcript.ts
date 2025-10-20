"use server";

import { processTranscript } from "@/lib/ai/processor";
import { db } from "@/db";
import { intakeFormData, matters, transcripts, turns } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    // STEP 1: Create a temporary matter to get an ID (we'll update it later)
    console.log(`\n[Server Action] Creating temporary matter...`);
    const [tempIntakeForm] = await db
      .insert(intakeFormData)
      .values({
        caseType: "mva", // temporary default
        liability: {
          atFault: "unclear",
          rationale: "",
          hasPoliceReport: false,
        },
        damages: { severity: "low", indications: [] },
        coverage: {
          clientHasInsurance: null,
          otherPartyHasInsurance: null,
          medicalCoverageAvailable: null,
          underinsuredMotoristCoverage: null,
        },
      })
      .returning();

    const [tempMatter] = await db
      .insert(matters)
      .values({
        name: matterName,
        intakeFormDataId: tempIntakeForm.id,
        citations: null,
      })
      .returning();

    console.log(`[Server Action] Created temporary matter with ID: ${tempMatter.id}`);

    // STEP 2: Store transcript and create turns (NOW we have matter.id)
    console.log(`[Server Action] Storing transcript...`);
    const [newTranscript] = await db
      .insert(transcripts)
      .values({
        matterId: tempMatter.id,
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
    const turnRecords = transcript.segments.map((segment, index) => ({
      transcriptId: newTranscript.id,
      turnIndex: index,
      speaker: segment.speaker,
      content: segment.content,
    }));

    const createdTurns = await db.insert(turns).values(turnRecords).returning();

    console.log(
      `[Server Action] ✓ Created ${createdTurns.length} turn records`
    );

    // STEP 3: NOW process transcript with AI (turns exist, so we can track citations)
    console.log(`\n[Server Action] Processing transcript with turn citation tracking...`);

    // Map created turns to segments with turn IDs
    const segmentsWithTurnIds = createdTurns.map((turn) => ({
      turnId: turn.id,
      turnIndex: turn.turnIndex,
      speaker: turn.speaker,
      content: turn.content,
    }));

    const extracted = await processTranscript(transcript, segmentsWithTurnIds);

    console.log(`\n[Server Action] Updating matter with extracted data...`);

    // Update intake form data with extracted information
    await db
      .update(intakeFormData)
      .set({
        caseType: extracted.clientInfo.caseType,
        liability: extracted.liability,
        damages: extracted.damages,
        coverage: extracted.coverage,
      })
      .where(eq(intakeFormData.id, tempIntakeForm.id));

    // Collect all citations from all sections
    const allCitations = {
      clientInfo: extracted.clientInfo.citations || [],
      liability: extracted.liability.citations || [],
      damages: extracted.damages.citations || [],
      coverage: extracted.coverage.citations || [],
    };

    console.log(`[Server Action] Citations collected:`);
    console.log(`  - Client Info: ${allCitations.clientInfo.length}`);
    console.log(`  - Liability: ${allCitations.liability.length}`);
    console.log(`  - Damages: ${allCitations.damages.length}`);
    console.log(`  - Coverage: ${allCitations.coverage.length}`);

    // Update matter with extracted client info
    await db
      .update(matters)
      .set({
        clientName: extracted.clientInfo.clientName,
        clientDob: extracted.clientInfo.clientDob,
        clientPhone: extracted.clientInfo.clientPhone,
        clientEmail: extracted.clientInfo.clientEmail,
        clientAddress: extracted.clientInfo.clientAddress,
        incidentDate: extracted.clientInfo.incidentDate,
        incidentLocation: extracted.clientInfo.incidentLocation,
        brief: extracted.clientInfo.brief,
        citations: allCitations,
      })
      .where(eq(matters.id, tempMatter.id));

    console.log(`[Server Action] ✓ Updated matter with extracted data`);
    console.log(
      `[Server Action] ✓ Successfully created matter from transcript\n`
    );

    revalidatePath("/");
    return { success: true, matterId: tempMatter.id };
  } catch (error) {
    console.error(`[Server Action] ✗ Failed to process transcript:`, error);
    throw error;
  }
}
