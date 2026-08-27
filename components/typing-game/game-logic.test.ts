import { describe, expect, it } from "vitest";

import { processInput, selectTarget } from "@/components/typing-game/game-logic";
import type { FallingWord } from "@/components/typing-game/types";

let idCounter = 0;
function word(
  text: string,
  spawnedAt: number,
  fallDurationMs = 1000
): FallingWord {
  idCounter += 1;
  return { id: `w${idCounter}`, text, lane: 0, spawnedAt, fallDurationMs };
}

describe("selectTarget", () => {
  it("입력이 비어있으면 타겟이 없다", () => {
    expect(selectTarget([word("사과", 0)], "", 100)).toBeNull();
  });

  it("일치하는 낱말이 없으면 타겟이 없다", () => {
    expect(selectTarget([word("사과", 0)], "나", 100)).toBeNull();
  });

  it("일치하는 낱말이 하나면 그 낱말이 타겟이 된다", () => {
    const w = word("사과", 0);
    expect(selectTarget([w], "사", 100)).toBe(w.id);
  });

  it("일치하는 낱말이 여럿이면 바닥에 더 가까운 낱말이 타겟이 된다", () => {
    const near = word("사과", 800); // now=1000 -> progress 0.2, 덜 떨어짐
    const far = word("사자", 0); // now=1000 -> progress 1.0, 바닥에 가까움
    expect(selectTarget([near, far], "사", 1000)).toBe(far.id);
  });
});

describe("processInput", () => {
  it("입력이 비어있으면 no-match다", () => {
    const w = word("사과", 0);
    expect(processInput([w], "", null, 100)).toEqual({
      type: "no-match",
    });
  });

  it("일치하는 낱말이 없으면 no-match다", () => {
    const w = word("사과", 0);
    expect(processInput([w], "나", null, 100)).toEqual({
      type: "no-match",
    });
  });

  it("낱말의 일부만 입력하면 progress다", () => {
    const w = word("사과", 0);
    expect(processInput([w], "사", null, 100)).toEqual({
      type: "progress",
      targetId: w.id,
    });
  });

  it("낱말을 끝까지 입력하면 complete다", () => {
    const w = word("사과", 0);
    expect(processInput([w], "사과", null, 100)).toEqual({
      type: "complete",
      targetId: w.id,
    });
  });

  it("이미 타겟이 있으면 다른 낱말이 더 바닥에 가까워도 타겟을 유지한다", () => {
    const first = word("사과", 500);
    const closer = word("사자", 0);
    const result = processInput([first, closer], "사과", first.id, 1000);
    expect(result).toEqual({ type: "complete", targetId: first.id });
  });
});
