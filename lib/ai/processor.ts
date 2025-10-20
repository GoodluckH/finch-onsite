import { chunkTranscript } from "./chunker";
import { extractFromChunkParallel, type ChunkExtraction } from "./specialized-extractor";
import { mergeChunkExtractions } from "./specialized-merger";
import { AI_CONFIG } from "./config";
import type { Transcript } from "./types";

/**
 * Process a transcript through chunking, parallel extraction, and merging
 */
export async function processTranscript(
  transcript: Transcript
): Promise<ChunkExtraction> {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("TRANSCRIPT PROCESSING STARTED (PARALLEL EXTRACTION MODE)");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Total segments: ${transcript.segments.length}`);
  console.log(`Strategy: 4 parallel LLM calls per chunk`);

  try {
    // Step 1: Chunk the transcript
    const chunks = chunkTranscript(
      transcript,
      AI_CONFIG.MAX_CHUNK_TOKENS,
      AI_CONFIG.OVERLAP_TOKENS
    );

    console.log(`\n📊 Created ${chunks.length} chunk(s) for processing`);
    console.log(
      `🚀 Each chunk will spawn 4 parallel LLM calls (Client Info + Liability + Damages + Coverage)`
    );

    // Step 2: Extract from each chunk with parallel specialized calls
    console.log(
      `\n🤖 Starting parallel extraction for ${chunks.length} chunk(s)...`
    );
    const extractions: ChunkExtraction[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`PROCESSING CHUNK ${i + 1} of ${chunks.length}`);
      console.log("=".repeat(50));

      try {
        const extraction = await extractFromChunkParallel(
          chunks[i],
          i + 1,
          chunks.length
        );
        extractions.push(extraction);
        console.log(`✓ Chunk ${i + 1} processed successfully (4/4 extractions)`);
      } catch (error) {
        console.error(`✗ Chunk ${i + 1} failed:`, error);

        // Retry logic
        if (AI_CONFIG.MAX_RETRIES > 0) {
          console.log(`⟳ Retrying chunk ${i + 1}...`);
          try {
            const extraction = await extractFromChunkParallel(
              chunks[i],
              i + 1,
              chunks.length
            );
            extractions.push(extraction);
            console.log(`✓ Chunk ${i + 1} succeeded on retry`);
          } catch (retryError) {
            console.error(
              `✗ Chunk ${i + 1} failed after retry, skipping...`,
              retryError
            );
          }
        }
      }
    }

    if (extractions.length === 0) {
      throw new Error("All chunks failed to process");
    }

    console.log(
      `\n✓ Successfully extracted data from ${extractions.length}/${chunks.length} chunk(s)`
    );
    console.log(
      `  Total LLM calls made: ${extractions.length * 4} (${extractions.length} chunks × 4 sections)`
    );

    // Step 3: Merge extractions
    console.log(`\n🔀 Merging ${extractions.length} chunk extraction(s)...`);
    const merged = mergeChunkExtractions(extractions);

    console.log("\n" + "=".repeat(60));
    console.log("PROCESSING COMPLETE - FINAL RESULTS");
    console.log("=".repeat(60));
    console.log(`Case Type: ${merged.clientInfo.caseType}`);
    console.log(
      `Client Name: ${merged.clientInfo.clientName || "Not extracted"}`
    );
    console.log(
      `Client Email: ${merged.clientInfo.clientEmail || "Not extracted"}`
    );
    console.log(
      `Client Phone: ${merged.clientInfo.clientPhone || "Not extracted"}`
    );
    console.log(
      `Incident Date: ${merged.clientInfo.incidentDate || "Not extracted"}`
    );
    console.log(
      `Incident Location: ${merged.clientInfo.incidentLocation || "Not extracted"}`
    );
    console.log(
      `Liability Rationale Points: ${merged.liability.rationale.split("\n").filter((l: string) => l.trim()).length}`
    );
    console.log(`At Fault: ${merged.liability.atFault}`);
    console.log(
      `Police Report: ${merged.liability.hasPoliceReport ? "Yes" : "No"}`
    );
    console.log(`Damage Severity: ${merged.damages.severity}`);
    console.log(`Damage Indications: ${merged.damages.indications.length}`);
    console.log(
      `Client Has Insurance: ${merged.coverage.clientHasInsurance === null ? "Unknown" : merged.coverage.clientHasInsurance ? "Yes" : "No"}`
    );
    console.log(
      `Other Party Has Insurance: ${merged.coverage.otherPartyHasInsurance === null ? "Unknown" : merged.coverage.otherPartyHasInsurance ? "Yes" : "No"}`
    );
    console.log("=".repeat(60));
    console.log("\n");

    return merged;
  } catch (error) {
    console.error("\n❌ PROCESSING FAILED");
    console.error("=".repeat(60));
    console.error(error);
    console.error("=".repeat(60));
    console.error("\n");
    throw error;
  }
}
