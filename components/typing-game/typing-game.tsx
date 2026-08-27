"use client";

import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Flame } from "lucide-react";

import { DifficultySelectPanel } from "@/components/typing-game/difficulty-select-panel";
import {
  DIFFICULTY_SETTINGS,
  type Difficulty,
} from "@/components/typing-game/difficulty";
import { GameOverPanel } from "@/components/typing-game/game-over-panel";
import { processInput } from "@/components/typing-game/game-logic";
import {
  loadHighScore,
  saveHighScore,
} from "@/components/typing-game/high-score";
import { pickRandomWord } from "@/components/typing-game/word-list";
import type { FallingWord } from "@/components/typing-game/types";

const INITIAL_LIVES = 5;
const LANE_COUNT = 5;
const MAX_CONCURRENT_WORDS = 3;
const FALL_DURATION_STEP_MS = 200;
const SCORE_PER_WORD = 100;

function fallDurationForScore(score: number, difficulty: Difficulty): number {
  const { initialFallMs, minFallMs } = DIFFICULTY_SETTINGS[difficulty];
  const wordsCleared = Math.floor(score / SCORE_PER_WORD);
  const reduced = initialFallMs - wordsCleared * FALL_DURATION_STEP_MS;
  return Math.max(minFallMs, reduced);
}

function pickLane(usedLanes: Set<number>): number {
  const all = Array.from({ length: LANE_COUNT }, (_, i) => i);
  const available = all.filter((lane) => !usedLanes.has(lane));
  const pool = available.length > 0 ? available : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

type GamePhase = "ready" | "playing" | "gameover";

type GameState = {
  phase: GamePhase;
  difficulty: Difficulty;
  score: number;
  lives: number;
  words: FallingWord[];
  targetId: string | null;
  input: string;
  highScore: number;
  isNewHighScore: boolean;
};

type Action =
  | { type: "load-high-score"; highScore: number }
  | { type: "start"; difficulty: Difficulty }
  | { type: "spawn"; word: FallingWord }
  | { type: "land"; wordId: string }
  | { type: "input"; value: string; now: number }
  | { type: "restart" };

function createReadyState(highScore: number): GameState {
  return {
    phase: "ready",
    difficulty: "normal",
    score: 0,
    lives: INITIAL_LIVES,
    words: [],
    targetId: null,
    input: "",
    highScore,
    isNewHighScore: false,
  };
}

function createPlayingState(
  highScore: number,
  difficulty: Difficulty
): GameState {
  return {
    ...createReadyState(highScore),
    phase: "playing",
    difficulty,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "load-high-score":
      return { ...state, highScore: action.highScore };

    case "start": {
      if (state.phase !== "ready") return state;
      return createPlayingState(state.highScore, action.difficulty);
    }

    case "spawn": {
      if (state.phase !== "playing") return state;
      if (state.words.length >= MAX_CONCURRENT_WORDS) return state;
      return { ...state, words: [...state.words, action.word] };
    }

    case "land": {
      if (state.phase !== "playing") return state;
      const landed = state.words.find((w) => w.id === action.wordId);
      if (!landed) return state;

      const words = state.words.filter((w) => w.id !== action.wordId);
      const lostTarget = state.targetId === action.wordId;
      const lives = state.lives - 1;

      if (lives <= 0) {
        const isNewHighScore = state.score > state.highScore;
        return {
          ...state,
          phase: "gameover",
          words: [],
          lives: 0,
          targetId: null,
          input: "",
          highScore: isNewHighScore ? state.score : state.highScore,
          isNewHighScore,
        };
      }

      return {
        ...state,
        words,
        lives,
        targetId: lostTarget ? null : state.targetId,
        input: lostTarget ? "" : state.input,
      };
    }

    case "input": {
      if (state.phase !== "playing") return state;
      const result = processInput(
        state.words,
        action.value,
        state.targetId,
        action.now
      );

      if (result.type === "no-match") {
        return { ...state, input: "", targetId: null };
      }
      if (result.type === "progress") {
        return { ...state, input: action.value, targetId: result.targetId };
      }

      return {
        ...state,
        input: "",
        targetId: null,
        score: state.score + SCORE_PER_WORD,
        words: state.words.filter((w) => w.id !== result.targetId),
      };
    }

    case "restart": {
      if (state.phase !== "gameover") return state;
      return createPlayingState(state.highScore, state.difficulty);
    }

    default:
      return state;
  }
}

function renderWordText(word: FallingWord, isTarget: boolean, input: string) {
  if (!isTarget) return word.text;
  const typed = word.text.slice(0, input.length);
  const remaining = word.text.slice(input.length);
  return (
    <>
      <span className="text-orange-600">{typed}</span>
      <span>{remaining}</span>
    </>
  );
}

export function TypingGame() {
  const [state, dispatch] = useReducer(reducer, 0, createReadyState);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounterRef = useRef(0);
  const isComposingRef = useRef(false);

  // 조합(IME) 중에는 실제 DOM 표시값을 그대로 따라가고, 조합이 끝난 뒤에만
  // state.input과 다시 맞춘다. 조합 중에 state.input(대개 "")로 값을 되돌리면
  // 한글을 치는 동안 입력창이 계속 비어 보이는 문제가 생긴다.
  const [displayValue, setDisplayValue] = useState("");
  useEffect(() => {
    if (isComposingRef.current) return;
    setDisplayValue(state.input);
  }, [state.input]);

  useEffect(() => {
    dispatch({ type: "load-high-score", highScore: loadHighScore() });
  }, []);

  useEffect(() => {
    if (state.phase === "gameover" && state.isNewHighScore) {
      saveHighScore(state.score);
    }
  }, [state.phase, state.isNewHighScore, state.score]);

  useEffect(() => {
    if (state.phase !== "playing") return;

    const { spawnIntervalMs } = DIFFICULTY_SETTINGS[stateRef.current.difficulty];

    const spawnOne = () => {
      const current = stateRef.current;
      if (current.words.length >= MAX_CONCURRENT_WORDS) return;
      const usedWords = new Set(current.words.map((w) => w.text));
      const usedLanes = new Set(current.words.map((w) => w.lane));
      idCounterRef.current += 1;
      dispatch({
        type: "spawn",
        word: {
          id: `word-${idCounterRef.current}`,
          text: pickRandomWord(usedWords),
          lane: pickLane(usedLanes),
          spawnedAt: Date.now(),
          fallDurationMs: fallDurationForScore(
            current.score,
            current.difficulty
          ),
        },
      });
    };

    spawnOne();
    const interval = setInterval(spawnOne, spawnIntervalMs);
    return () => clearInterval(interval);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "playing") inputRef.current?.focus();
  }, [state.phase]);

  return (
    <div className="flex w-full flex-col items-center gap-4 px-4 py-8">
      <h1 className="text-xl font-semibold">불구덩이 사자성어 타자</h1>

      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-orange-950/40"
        style={{
          height: 480,
          background:
            "linear-gradient(180deg, #1a0f0a 0%, #1a0f0a 55%, #5c1a06 75%, #ff6a00 92%, #ffcf4d 100%)",
        }}
      >
        <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between">
          <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-orange-50">
            점수 {state.score}
          </span>
          <span
            className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1"
            aria-label={`남은 목숨 ${state.lives}개`}
          >
            {Array.from({ length: INITIAL_LIVES }, (_, i) => (
              <Flame
                key={i}
                className={
                  i < state.lives
                    ? "h-4 w-4 fill-orange-500 text-orange-500"
                    : "h-4 w-4 text-orange-950"
                }
              />
            ))}
          </span>
        </div>

        {state.words.map((w) => {
          const isTarget = w.id === state.targetId;
          return (
            <div
              key={w.id}
              data-testid="falling-word"
              onAnimationEnd={() => dispatch({ type: "land", wordId: w.id })}
              className={
                "absolute whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-bold " +
                (isTarget
                  ? "bg-orange-100 text-orange-950 ring-2 ring-orange-300"
                  : "bg-[#fff4e2] text-[#3a1c00]")
              }
              style={{
                left: `${(w.lane / LANE_COUNT) * 80 + 4}%`,
                animation: `fall-down ${w.fallDurationMs}ms linear forwards`,
              }}
            >
              {renderWordText(w, isTarget, state.input)}
            </div>
          );
        })}

        {state.phase === "ready" && (
          <DifficultySelectPanel
            onSelect={(difficulty) => dispatch({ type: "start", difficulty })}
          />
        )}

        {state.phase === "gameover" && (
          <GameOverPanel
            score={state.score}
            highScore={state.highScore}
            isNewHighScore={state.isNewHighScore}
            onRestart={() => dispatch({ type: "restart" })}
          />
        )}
      </div>

      <input
        ref={inputRef}
        value={displayValue}
        onChange={(e) => {
          setDisplayValue(e.target.value);
          if (isComposingRef.current) return;
          dispatch({ type: "input", value: e.target.value, now: Date.now() });
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          isComposingRef.current = false;
          const value = e.currentTarget.value;
          setDisplayValue(value);
          dispatch({ type: "input", value, now: Date.now() });
        }}
        onBlur={() => {
          if (stateRef.current.phase === "playing") {
            inputRef.current?.focus();
          }
        }}
        disabled={state.phase !== "playing"}
        autoFocus
        aria-label="낱말 입력"
        placeholder="떨어지는 사자성어를 입력하세요"
        className="w-full max-w-lg rounded-md border border-orange-900/30 bg-[#1a0f0a] px-3 py-2 text-center text-lg text-orange-50 outline-none placeholder:text-orange-200/40 disabled:opacity-50"
      />
    </div>
  );
}
