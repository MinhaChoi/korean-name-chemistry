import { Flame, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RoundOutcome } from "@/components/typing-game/types";

type RoundResultPanelProps = {
  outcome: RoundOutcome;
  score: number;
  clearedCount: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
};

const TITLES: Record<RoundOutcome, string> = {
  survived: "불구덩이에서 살아남았다",
  burned: "까맣게 타버렸다",
};

function describe(
  outcome: RoundOutcome,
  clearedCount: number,
  isNewHighScore: boolean
): string {
  const record = isNewHighScore ? " 역대 최고 기록 경신! 🔥" : "";
  return outcome === "survived"
    ? `${clearedCount}개의 사자성어를 습득했다.${record}`
    : isNewHighScore
      ? "역대 최고 기록 경신! 🔥"
      : "다시 불씨를 지펴 보자.";
}

export function RoundResultPanel({
  outcome,
  score,
  clearedCount,
  highScore,
  isNewHighScore,
  onRestart,
}: RoundResultPanelProps) {
  const survived = outcome === "survived";
  const Icon = survived ? Trophy : Flame;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 backdrop-blur-[1px]">
      <div
        className={
          "w-full max-w-sm rounded-2xl border-2 p-5 text-center " +
          (survived
            ? "border-amber-400/70 shadow-[0_0_40px_rgba(255,190,60,0.4)]"
            : "border-orange-500/60 shadow-[0_0_40px_rgba(255,100,0,0.35)]")
        }
        style={{
          background: "linear-gradient(160deg, #2a0f04 0%, #170a04 100%)",
        }}
      >
        <Icon
          className={
            "mx-auto h-10 w-10 " +
            (survived ? "text-amber-400" : "text-orange-500")
          }
          style={{ animation: "flame-flicker 1.1s ease-in-out infinite" }}
        />
        <h2
          className="mt-2 text-2xl font-black tracking-tight text-orange-50"
          style={{ animation: "title-glow 2.2s ease-in-out infinite" }}
        >
          {TITLES[outcome]}
        </h2>
        <p className="mt-1 text-sm text-orange-200/70">
          {describe(outcome, clearedCount, isNewHighScore)}
        </p>

        <div className="mt-5 flex flex-col gap-2 rounded-xl bg-black/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-200/70">이번 판 점수</span>
            <span className="text-xl font-black text-orange-50">{score}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-200/70">최고 기록</span>
            <span className="text-xl font-black text-amber-400">
              {highScore}
            </span>
          </div>
        </div>

        <Button
          className="mt-5 w-full bg-orange-600 text-base font-bold text-orange-50 hover:bg-orange-500"
          onClick={onRestart}
        >
          다시 불붙이기
        </Button>
      </div>
    </div>
  );
}
