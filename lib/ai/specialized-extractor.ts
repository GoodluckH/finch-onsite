import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { AI_CONFIG } from "./config";
import {
  CLIENT_INFO_SYSTEM_PROMPT,
  LIABILITY_SYSTEM_PROMPT,
  DAMAGES_SYSTEM_PROMPT,
  COVERAGE_SYSTEM_PROMPT,
  getUserPromptForSection,
} from "./specialized-prompts";
import {
  ClientInfoSchema,
  LiabilitySchema,
  DamagesSchema,
  CoverageSchema,
  type ClientInfo,
  type Liability,
  type Damages,
  type Coverage,
} from "./specialized-schemas";

export type ChunkExtraction = {
  clientInfo: ClientInfo;
  liability: Liability;
  damages: Damages;
  coverage: Coverage;
};

/**
 * Extract all sections from a chunk using parallel specialized LLM calls
 */
export async function extractFromChunkParallel(
  chunkText: string,
  chunkNumber: number,
  totalChunks: number
): Promise<ChunkExtraction> {
  console.log(
    `\n[Specialized Extractor] Processing chunk ${chunkNumber}/${totalChunks} with 4 parallel extractions...`
  );
  console.log(`[Specialized Extractor] Chunk length: ${chunkText.length} characters`);

  try {
    // Run all 4 extractions in parallel
    const [clientInfoResult, liabilityResult, damagesResult, coverageResult] =
      await Promise.all([
        // 1. Client Info Extraction
        generateObject({
          model: openai(AI_CONFIG.MODEL),
          schema: ClientInfoSchema,
          system: CLIENT_INFO_SYSTEM_PROMPT,
          prompt: getUserPromptForSection(
            "client basic information",
            chunkText,
            chunkNumber,
            totalChunks
          ),
          temperature: AI_CONFIG.TEMPERATURE,
        }).then((result) => {
          console.log(
            `  ✓ [Client Info] Case type: ${result.object.caseType}, Client: ${result.object.clientName || "N/A"}`
          );
          return result;
        }),

        // 2. Liability Extraction
        generateObject({
          model: openai(AI_CONFIG.MODEL),
          schema: LiabilitySchema,
          system: LIABILITY_SYSTEM_PROMPT,
          prompt: getUserPromptForSection(
            "liability information",
            chunkText,
            chunkNumber,
            totalChunks
          ),
          temperature: AI_CONFIG.TEMPERATURE,
        }).then((result) => {
          console.log(
            `  ✓ [Liability] At-fault: ${result.object.atFault}, Rationale length: ${result.object.rationale.length} chars, Police report: ${result.object.hasPoliceReport}`
          );
          return result;
        }),

        // 3. Damages Extraction
        generateObject({
          model: openai(AI_CONFIG.MODEL),
          schema: DamagesSchema,
          system: DAMAGES_SYSTEM_PROMPT,
          prompt: getUserPromptForSection(
            "damages information",
            chunkText,
            chunkNumber,
            totalChunks
          ),
          temperature: AI_CONFIG.TEMPERATURE,
        }).then((result) => {
          console.log(
            `  ✓ [Damages] Severity: ${result.object.severity}, Indications: ${result.object.indications.length}`
          );
          return result;
        }),

        // 4. Coverage Extraction
        generateObject({
          model: openai(AI_CONFIG.MODEL),
          schema: CoverageSchema,
          system: COVERAGE_SYSTEM_PROMPT,
          prompt: getUserPromptForSection(
            "insurance coverage information",
            chunkText,
            chunkNumber,
            totalChunks
          ),
          temperature: AI_CONFIG.TEMPERATURE,
        }).then((result) => {
          console.log(
            `  ✓ [Coverage] Client insurance: ${result.object.clientHasInsurance === null ? "unknown" : result.object.clientHasInsurance}, Other party: ${result.object.otherPartyHasInsurance === null ? "unknown" : result.object.otherPartyHasInsurance}`
          );
          return result;
        }),
      ]);

    console.log(
      `✓ [Specialized Extractor] All 4 extractions complete for chunk ${chunkNumber}`
    );

    return {
      clientInfo: clientInfoResult.object,
      liability: liabilityResult.object,
      damages: damagesResult.object,
      coverage: coverageResult.object,
    };
  } catch (error) {
    console.error(
      `✗ [Specialized Extractor] Error processing chunk ${chunkNumber}:`,
      error
    );
    throw error;
  }
}
