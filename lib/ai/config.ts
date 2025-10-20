export const AI_CONFIG = {
  MAX_CHUNK_TOKENS: 30000, // Safe limit under most LLM windows
  OVERLAP_TOKENS: 2000, // ~7% overlap for context preservation
  ESTIMATED_TOKENS_PER_CHAR: 0.25, // Rough heuristic (4 chars = 1 token)
  MODEL: "gpt-4o", // GPT-4o model
  TEMPERATURE: 0.1, // Low temp for consistent extraction
  MAX_RETRIES: 2, // Retry failed chunks
} as const;
