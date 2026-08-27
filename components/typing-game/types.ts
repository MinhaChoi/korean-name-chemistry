export type FallingWord = {
  id: string;
  text: string;
  meaning: string;
  lane: number;
  spawnedAt: number;
  fallDurationMs: number;
};

export type RoundOutcome = "survived" | "burned";

export type InputResult =
  | { type: "no-match" }
  | { type: "progress"; targetId: string }
  | { type: "complete"; targetId: string };
