import { AI_CONFIG } from "./config";
import { estimateTokens, estimateCharactersForTokens } from "./token-estimator";
import type { Transcript } from "./types";

/**
 * Find the best position to end a chunk, preferring natural break points
 */
function findChunkEnd(text: string, start: number, maxTokens: number): number {
  console.log(
    `[Chunker] Finding chunk end from position ${start}, max tokens: ${maxTokens}`
  );

  // Estimate character position for max tokens
  const estimatedChars = Math.floor(maxTokens / AI_CONFIG.ESTIMATED_TOKENS_PER_CHAR);
  let endPosition = Math.min(start + estimatedChars, text.length);

  console.log(
    `[Chunker] Estimated end position: ${endPosition} (${estimatedChars} chars)`
  );

  // If we're at the end of the text, return it
  if (endPosition >= text.length) {
    console.log(`[Chunker] Reached end of text at position ${text.length}`);
    return text.length;
  }

  // Find natural break point (end of speaker turn, paragraph, sentence)
  // Priority: speaker change > paragraph > sentence > word boundary
  const searchWindow = Math.max(start, endPosition - 200); // Look back up to 200 chars

  // Try to find speaker change: \n[Speaker X]:
  const speakerMatch = text
    .substring(searchWindow, endPosition)
    .lastIndexOf("\n[Speaker ");
  if (speakerMatch !== -1) {
    const position = searchWindow + speakerMatch;
    console.log(`[Chunker] Found speaker change at position ${position}`);
    return position;
  }

  // Try to find paragraph break
  const paragraphMatch = text
    .substring(searchWindow, endPosition)
    .lastIndexOf("\n\n");
  if (paragraphMatch !== -1) {
    const position = searchWindow + paragraphMatch;
    console.log(`[Chunker] Found paragraph break at position ${position}`);
    return position;
  }

  // Try to find sentence end
  const sentenceRegex = /[.!?]\s+(?=[A-Z])/g;
  const textWindow = text.substring(searchWindow, endPosition);
  let lastMatch = -1;
  let match;

  while ((match = sentenceRegex.exec(textWindow)) !== null) {
    lastMatch = match.index;
  }

  if (lastMatch !== -1) {
    const position = searchWindow + lastMatch + 1;
    console.log(`[Chunker] Found sentence end at position ${position}`);
    return position;
  }

  // Fallback: word boundary
  const wordMatch = text.substring(searchWindow, endPosition).lastIndexOf(" ");
  if (wordMatch !== -1) {
    const position = searchWindow + wordMatch;
    console.log(`[Chunker] Found word boundary at position ${position}`);
    return position;
  }

  // Last resort: hard cut
  console.log(`[Chunker] No natural break found, hard cut at ${endPosition}`);
  return endPosition;
}

/**
 * Chunk a transcript into overlapping segments for LLM processing
 */
export function chunkTranscript(
  transcript: Transcript,
  maxChunkTokens: number = AI_CONFIG.MAX_CHUNK_TOKENS,
  overlapTokens: number = AI_CONFIG.OVERLAP_TOKENS
): string[] {
  console.log("\n=== Starting Transcript Chunking ===");
  console.log(`Config: maxChunkTokens=${maxChunkTokens}, overlapTokens=${overlapTokens}`);
  console.log(`Total segments in transcript: ${transcript.segments.length}`);

  // 1. Convert transcript segments to linear text representation
  const fullText = transcript.segments
    .map((seg) => `[Speaker ${seg.speaker}]: ${seg.content}`)
    .join("\n\n"); // Double newline between segments for clarity

  console.log(`Full text length: ${fullText.length} characters`);

  // 2. Estimate tokens for the full text
  const estimatedTotalTokens = estimateTokens(fullText);
  console.log(`Estimated total tokens: ${estimatedTotalTokens}`);

  // 3. If fits in single chunk, return as-is
  if (estimatedTotalTokens <= maxChunkTokens) {
    console.log("✓ Entire transcript fits in single chunk");
    console.log("=== Chunking Complete ===\n");
    return [fullText];
  }

  console.log(
    `⚠ Transcript exceeds max chunk size, will create multiple chunks`
  );

  // 4. Calculate chunk boundaries with overlap
  const chunks: string[] = [];
  let currentPosition = 0;
  let chunkNumber = 1;

  while (currentPosition < fullText.length) {
    console.log(`\n--- Processing Chunk ${chunkNumber} ---`);
    console.log(`Starting at position: ${currentPosition}`);

    // Determine chunk end position
    const chunkEndPosition = findChunkEnd(
      fullText,
      currentPosition,
      maxChunkTokens
    );

    // Extract chunk
    const chunk = fullText.substring(currentPosition, chunkEndPosition);
    const chunkTokens = estimateTokens(chunk);

    console.log(`Chunk ${chunkNumber} end position: ${chunkEndPosition}`);
    console.log(
      `Chunk ${chunkNumber} length: ${chunk.length} chars, ~${chunkTokens} tokens`
    );

    chunks.push(chunk);

    // Move position forward, accounting for overlap
    const overlapCharOffset = estimateCharactersForTokens(overlapTokens);
    const nextPosition = chunkEndPosition - overlapCharOffset;

    console.log(`Overlap: ${overlapCharOffset} chars (~${overlapTokens} tokens)`);
    console.log(`Next chunk will start at position: ${nextPosition}`);

    // Ensure we make progress (prevent infinite loop)
    if (nextPosition <= currentPosition) {
      console.log(
        "⚠ Warning: Overlap would not make progress, advancing past current position"
      );
      currentPosition = chunkEndPosition;
    } else {
      currentPosition = nextPosition;
    }

    chunkNumber++;
  }

  console.log(`\n✓ Created ${chunks.length} chunks total`);
  console.log("=== Chunking Complete ===\n");

  return chunks;
}
