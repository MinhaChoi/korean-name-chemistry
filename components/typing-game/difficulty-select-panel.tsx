import { Flame } from "lucide-react";

import {
  DIFFICULTIES,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_LABELS,
  type Difficulty,
} from "@/components/typing-game/difficulty";

type DifficultySelectPanelProps = {
  onSelect: (difficulty: Difficulty) => void;
};

const FLAME_COUNT: Record<Difficulty, number> = {
  easy: 1,
  normal: 2,
  hard: 3,
};

export function DifficultySelectPanel({
  onSelect,
}: DifficultySelectPanelProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/75 p-4 text-center backdrop-blur-[1px]">
      <div>
        <p className="text-lg font-black tracking-tight text-orange-50">
          얼마나 뜨겁게 타 볼까?
        </p>
        <p className="mt-1 text-xs text-orange-200/60">
          난이도는 언제든 다시 고를 수 있다
        </p>
        <p className="mt-0.5 text-xs text-orange-200/50">
          🥵 5개를 모두 잃으면 게임 끝
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        {DIFFICULTIES.map((difficulty) => (
          <button
            key={difficulty}
            type="button"
            onClick={() => onSelect(difficulty)}
            className="group flex w-52 items-center justify-between gap-3 rounded-xl border-2 border-orange-500/40 px-4 py-2.5 text-left transition-all hover:scale-[1.03] hover:border-orange-400 hover:shadow-[0_0_20px_rgba(255,120,0,0.5)]"
            style={{
              background: "linear-gradient(135deg, #331507 0%, #1a0b03 100%)",
            }}
          >
            <span>
              <span className="block text-base font-black text-orange-50">
                {DIFFICULTY_LABELS[difficulty]}
              </span>
              <span className="block text-xs text-orange-200/60">
                {DIFFICULTY_DESCRIPTIONS[difficulty]}
              </span>
            </span>
            <span className="flex shrink-0 gap-0.5">
              {Array.from({ length: FLAME_COUNT[difficulty] }, (_, i) => (
                <Flame
                  key={i}
                  className="h-4 w-4 fill-orange-500 text-orange-500 transition-transform group-hover:scale-110"
                />
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
