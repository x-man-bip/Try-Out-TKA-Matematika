import type { Question } from "@/types";

/**
 * Deterministic shuffle using a string seed (participant code).
 * Same seed always produces the same order, so each participant
 * sees questions in a unique but consistent order.
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const result = [...array];
  let s = Math.abs(hash);
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function shuffleQuestions(questions: Question[], seed: string): Question[] {
  return seededShuffle(questions, seed);
}
