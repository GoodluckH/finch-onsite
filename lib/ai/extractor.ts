import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { AI_CONFIG } from "./config";
import { SYSTEM_PROMPT, getUserPrompt } from "./prompts";
import { ExtractionSchema, type Extraction } from "./schema";

/**
 * Extract intake form data from a single chunk of transcript text
 */
export async function extractFromChunk(
  chunkText: string,
  chunkNumber: number,
  totalChunks: number
): Promise<Extraction> {
  console.log(
    `\n[Extractor] Processing chunk ${chunkNumber}/${totalChunks}...`
  );
  console.log(`[Extractor] Chunk length: ${chunkText.length} characters`);
  console.log(
    `[Extractor] Using model: ${AI_CONFIG.MODEL}, temperature: ${AI_CONFIG.TEMPERATURE}`
  );

  try {
    const result = await generateObject({
      model: openai(AI_CONFIG.MODEL),
      schema: ExtractionSchema,
      system: SYSTEM_PROMPT,
      prompt: getUserPrompt(chunkText, chunkNumber, totalChunks),
      temperature: AI_CONFIG.TEMPERATURE,
    });

    console.log(
      `✓ [Extractor] Successfully extracted data from chunk ${chunkNumber}`
    );
    console.log(
      `[Extractor] Extracted case type: ${result.object.caseType}`
    );
    console.log(
      `[Extractor] Extracted client name: ${result.object.clientName || "N/A"}`
    );
    console.log(
      `[Extractor] Liability content length: ${result.object.liability.content.length} chars`
    );
    console.log(
      `[Extractor] Damage indications: ${result.object.damages.indications.length}`
    );

    return result.object;
  } catch (error) {
    console.error(
      `✗ [Extractor] Error processing chunk ${chunkNumber}:`,
      error
    );
    throw error;
  }
}
