export type FallingWord = {
  id: string;
  text: string;
  lane: number;
  spawnedAt: number;
  fallDurationMs: number;
};

export type InputResult =
  | { type: "no-match" }
  | { type: "progress"; targetId: string }
  | { type: "complete"; targetId: string };
