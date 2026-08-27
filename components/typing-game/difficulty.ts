export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "쉬움",
  normal: "보통",
  hard: "어려움",
};

export type DifficultySettings = {
  initialFallMs: number;
  minFallMs: number;
  spawnIntervalMs: number;
};

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: { initialFallMs: 9000, minFallMs: 5000, spawnIntervalMs: 2200 },
  normal: { initialFallMs: 6500, minFallMs: 2800, spawnIntervalMs: 1600 },
  hard: { initialFallMs: 4500, minFallMs: 1800, spawnIntervalMs: 1100 },
};
