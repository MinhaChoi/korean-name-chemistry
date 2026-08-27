import { Button } from "@/components/ui/button";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  type Difficulty,
} from "@/components/typing-game/difficulty";

type DifficultySelectPanelProps = {
  onSelect: (difficulty: Difficulty) => void;
};

export function DifficultySelectPanel({
  onSelect,
}: DifficultySelectPanelProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/70 p-4 text-center">
      <p className="text-lg font-semibold text-orange-50">
        난이도를 선택하세요
      </p>
      <div className="flex gap-2">
        {DIFFICULTIES.map((difficulty) => (
          <Button key={difficulty} onClick={() => onSelect(difficulty)}>
            {DIFFICULTY_LABELS[difficulty]}
          </Button>
        ))}
      </div>
    </div>
  );
}
