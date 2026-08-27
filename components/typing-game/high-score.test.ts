import { beforeEach, describe, expect, it } from "vitest";

import { loadHighScore, saveHighScore } from "@/components/typing-game/high-score";

beforeEach(() => {
  window.localStorage.clear();
});

describe("loadHighScore / saveHighScore", () => {
  it("저장된 기록이 없으면 0을 반환한다", () => {
    expect(loadHighScore()).toBe(0);
  });

  it("저장한 점수를 다시 불러올 수 있다", () => {
    saveHighScore(1200);
    expect(loadHighScore()).toBe(1200);
  });

  it("저장소에 손상된 값이 있으면 0을 반환한다", () => {
    window.localStorage.setItem("typing-game-high-score", "not-a-number");
    expect(loadHighScore()).toBe(0);
  });
});
