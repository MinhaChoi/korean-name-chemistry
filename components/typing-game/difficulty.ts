export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "불씨",
  normal: "모닥불",
  hard: "불지옥",
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: "천천히 몸부터 풀기",
  normal: "적당히 뜨겁게",
  hard: "정신줄 놓고 타자",
};

// 한 판의 길이. 모든 난이도가 같은 시간을 쓴다. 그래야 난이도가 올라갈수록
// 같은 시간 안에 더 많이 지우게 되어 점수 차이로 실력이 드러난다.
export const ROUND_DURATION_MS = 30_000;

export type DifficultySettings = {
  initialFallMs: number;
  minFallMs: number;
  initialSpawnIntervalMs: number;
  minSpawnIntervalMs: number;
};

// 난이도는 시작 속도만 다르게 정한다. 같은 난이도 안에서도 점수가 오를수록
// 낙하 속도와 등장 간격이 각자의 하한까지 계속 빨라진다.
export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    initialFallMs: 9000,
    minFallMs: 4200,
    initialSpawnIntervalMs: 2200,
    minSpawnIntervalMs: 1200,
  },
  normal: {
    initialFallMs: 6500,
    minFallMs: 2600,
    initialSpawnIntervalMs: 1600,
    minSpawnIntervalMs: 800,
  },
  hard: {
    initialFallMs: 4500,
    minFallMs: 1600,
    initialSpawnIntervalMs: 1100,
    minSpawnIntervalMs: 550,
  },
};
