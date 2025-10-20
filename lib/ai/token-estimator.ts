import { AI_CONFIG } from "./config";

/**
 * Estimate the number of tokens in a text string
 * Uses a rough heuristic: ~4 characters per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length * AI_CONFIG.ESTIMATED_TOKENS_PER_CHAR);
}

/**
 * Estimate the number of characters for a given token count
 */
export function estimateCharactersForTokens(tokens: number): number {
  return Math.floor(tokens / AI_CONFIG.ESTIMATED_TOKENS_PER_CHAR);
}
