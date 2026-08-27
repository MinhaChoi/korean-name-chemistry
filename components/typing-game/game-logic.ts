import type { FallingWord, InputResult } from "@/components/typing-game/types";

export function fallProgress(word: FallingWord, now: number): number {
  return (now - word.spawnedAt) / word.fallDurationMs;
}

export function selectTarget(
  words: FallingWord[],
  input: string,
  now: number
): string | null {
  if (input === "") return null;

  const candidates = words.filter((w) => w.text.startsWith(input));
  if (candidates.length === 0) return null;

  const closest = candidates.reduce((a, b) =>
    fallProgress(b, now) > fallProgress(a, now) ? b : a
  );
  return closest.id;
}

export function processInput(
  words: FallingWord[],
  input: string,
  currentTargetId: string | null,
  now: number
): InputResult {
  if (input === "") return { type: "no-match" };

  const currentTarget = currentTargetId
    ? words.find((w) => w.id === currentTargetId)
    : undefined;

  if (currentTarget && currentTarget.text.startsWith(input)) {
    return currentTarget.text === input
      ? { type: "complete", targetId: currentTarget.id }
      : { type: "progress", targetId: currentTarget.id };
  }

  const targetId = selectTarget(words, input, now);
  if (!targetId) return { type: "no-match" };

  const target = words.find((w) => w.id === targetId)!;
  return target.text === input
    ? { type: "complete", targetId }
    : { type: "progress", targetId };
}
