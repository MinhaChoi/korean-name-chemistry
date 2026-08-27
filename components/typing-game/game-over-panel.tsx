import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type GameOverPanelProps = {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
};

export function GameOverPanel({
  score,
  highScore,
  isNewHighScore,
  onRestart,
}: GameOverPanelProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-sm border-orange-900/40 bg-[#1a0f0a] text-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-50">게임 종료</CardTitle>
          <CardDescription className="text-orange-200/70">
            {isNewHighScore
              ? "최고 기록을 새로 세웠습니다."
              : "다시 도전해 보세요."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-200/70">이번 판 점수</span>
            <span className="text-lg font-semibold">{score}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-200/70">최고 기록</span>
            <span className="text-lg font-semibold">{highScore}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={onRestart}>
            다시하기
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
