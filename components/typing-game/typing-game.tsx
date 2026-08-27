"use client";

import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import { DifficultySelectPanel } from "@/components/typing-game/difficulty-select-panel";
import {
  DIFFICULTY_SETTINGS,
  ROUND_DURATION_MS,
  type Difficulty,
} from "@/components/typing-game/difficulty";
import { EmberParticles } from "@/components/typing-game/ember-particles";
import { RoundResultPanel } from "@/components/typing-game/round-result-panel";
import { processInput } from "@/components/typing-game/game-logic";
import {
  loadHighScore,
  saveHighScore,
} from "@/components/typing-game/high-score";
import { pickRandomWord } from "@/components/typing-game/word-list";
import type { FallingWord, RoundOutcome } from "@/components/typing-game/types";

const INITIAL_LIVES = 5;
const LANE_COUNT = 5;
const MAX_CONCURRENT_WORDS = 3;
// 한 판이 30초로 짧으므로 가속을 빠르게 준다. 모닥불 기준 10개쯤 지우면
// 낙하 속도가, 7개쯤 지우면 등장 간격이 하한에 닿는다. 판의 앞 절반이
// 가속 구간, 뒤 절반이 최고 속도 구간이 되도록 맞춘 값이다.
const FALL_DURATION_STEP_MS = 400;
const SPAWN_INTERVAL_STEP_MS = 120;
const SCORE_PER_WORD = 100;
const TICK_INTERVAL_MS = 100;
// 남은 시간 표시가 붉게 변하며 마지막을 재촉하는 구간.
const TIME_CRITICAL_MS = 5_000;
const LIFE_EMOJI = "🥵";
const LOST_LIFE_EMOJI = "💀";

function wordsClearedFor(score: number): number {
  return Math.floor(score / SCORE_PER_WORD);
}

function fallDurationForScore(score: number, difficulty: Difficulty): number {
  const { initialFallMs, minFallMs } = DIFFICULTY_SETTINGS[difficulty];
  const reduced = initialFallMs - wordsClearedFor(score) * FALL_DURATION_STEP_MS;
  return Math.max(minFallMs, reduced);
}

function spawnIntervalForScore(score: number, difficulty: Difficulty): number {
  const { initialSpawnIntervalMs, minSpawnIntervalMs } =
    DIFFICULTY_SETTINGS[difficulty];
  const reduced =
    initialSpawnIntervalMs - wordsClearedFor(score) * SPAWN_INTERVAL_STEP_MS;
  return Math.max(minSpawnIntervalMs, reduced);
}

function pickLane(usedLanes: Set<number>): number {
  const all = Array.from({ length: LANE_COUNT }, (_, i) => i);
  const available = all.filter((lane) => !usedLanes.has(lane));
  const pool = available.length > 0 ? available : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

type GamePhase = "ready" | "playing" | "finished";

type GameState = {
  phase: GamePhase;
  outcome: RoundOutcome | null;
  difficulty: Difficulty;
  score: number;
  lives: number;
  remainingMs: number;
  words: FallingWord[];
  targetId: string | null;
  input: string;
  highScore: number;
  isNewHighScore: boolean;
  // 낱말을 놓칠 때마다 1씩 증가한다. 이 값이 바뀌는 순간을 화면 플래시
  // 애니메이션의 트리거(React key)로 쓴다.
  missFlashKey: number;
  // 방금 맞힌 낱말. 입력창 아래에 뜻을 보여주는 데 쓴다.
  lastCleared: { text: string; meaning: string } | null;
};

type Action =
  | { type: "load-high-score"; highScore: number }
  | { type: "start"; difficulty: Difficulty }
  | { type: "spawn"; word: FallingWord }
  | { type: "land"; wordId: string }
  | { type: "input"; value: string; now: number }
  | { type: "tick"; elapsedMs: number }
  | { type: "restart" };

function createReadyState(highScore: number): GameState {
  return {
    phase: "ready",
    outcome: null,
    difficulty: "normal",
    score: 0,
    lives: INITIAL_LIVES,
    remainingMs: ROUND_DURATION_MS,
    words: [],
    targetId: null,
    input: "",
    highScore,
    isNewHighScore: false,
    missFlashKey: 0,
    lastCleared: null,
  };
}

function finishRound(state: GameState, outcome: RoundOutcome): GameState {
  const isNewHighScore = state.score > state.highScore;
  return {
    ...state,
    phase: "finished",
    outcome,
    words: [],
    targetId: null,
    input: "",
    highScore: isNewHighScore ? state.score : state.highScore,
    isNewHighScore,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "load-high-score":
      return { ...state, highScore: action.highScore };

    case "start": {
      if (state.phase !== "ready") return state;
      return {
        ...createReadyState(state.highScore),
        phase: "playing",
        difficulty: action.difficulty,
      };
    }

    case "spawn": {
      if (state.phase !== "playing") return state;
      if (state.words.length >= MAX_CONCURRENT_WORDS) return state;
      return { ...state, words: [...state.words, action.word] };
    }

    case "tick": {
      if (state.phase !== "playing") return state;
      const remainingMs = Math.max(0, state.remainingMs - action.elapsedMs);
      if (remainingMs === 0) {
        return finishRound({ ...state, remainingMs }, "survived");
      }
      return { ...state, remainingMs };
    }

    case "land": {
      if (state.phase !== "playing") return state;
      const landed = state.words.find((w) => w.id === action.wordId);
      if (!landed) return state;

      const words = state.words.filter((w) => w.id !== action.wordId);
      const lostTarget = state.targetId === action.wordId;
      const lives = state.lives - 1;
      const flashed = { ...state, missFlashKey: state.missFlashKey + 1 };

      if (lives <= 0) {
        return finishRound({ ...flashed, lives: 0 }, "burned");
      }

      return {
        ...flashed,
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

      const cleared = state.words.find((w) => w.id === result.targetId);
      return {
        ...state,
        input: "",
        targetId: null,
        score: state.score + SCORE_PER_WORD,
        words: state.words.filter((w) => w.id !== result.targetId),
        lastCleared: cleared
          ? { text: cleared.text, meaning: cleared.meaning }
          : state.lastCleared,
      };
    }

    case "restart": {
      // 다시 시작할 때는 난이도 선택 화면으로 돌아간다.
      if (state.phase !== "finished") return state;
      return createReadyState(state.highScore);
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
      <span className="text-amber-300">{typed}</span>
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
    if (state.phase === "finished" && state.isNewHighScore) {
      saveHighScore(state.score);
    }
  }, [state.phase, state.isNewHighScore, state.score]);

  // 남은 시간 카운트다운. 경과한 실제 시간을 재서 넘기므로, 탭이 백그라운드로
  // 가서 타이머가 밀리더라도 남은 시간이 실제보다 길게 남지 않는다.
  useEffect(() => {
    if (state.phase !== "playing") return;

    let lastAt = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastAt;
      lastAt = now;
      dispatch({ type: "tick", elapsedMs });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(id);
  }, [state.phase]);

  // 낱말 등장 간격은 setInterval로 한 번 고정하지 않고, 스폰할 때마다
  // 그 시점의 점수를 기준으로 다음 간격을 다시 계산한다(재귀 setTimeout).
  // 그래야 같은 난이도 안에서도 점수가 오를수록 계속 빨라진다.
  useEffect(() => {
    if (state.phase !== "playing") return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const spawnAndScheduleNext = () => {
      const current = stateRef.current;
      if (current.phase !== "playing") return;

      if (current.words.length < MAX_CONCURRENT_WORDS) {
        const usedWords = new Set(current.words.map((w) => w.text));
        const usedLanes = new Set(current.words.map((w) => w.lane));
        const idiom = pickRandomWord(usedWords);
        idCounterRef.current += 1;
        dispatch({
          type: "spawn",
          word: {
            id: `word-${idCounterRef.current}`,
            text: idiom.text,
            meaning: idiom.meaning,
            lane: pickLane(usedLanes),
            spawnedAt: Date.now(),
            fallDurationMs: fallDurationForScore(
              current.score,
              current.difficulty
            ),
          },
        });
      }

      const nextInterval = spawnIntervalForScore(
        current.score,
        current.difficulty
      );
      timeoutId = setTimeout(spawnAndScheduleNext, nextInterval);
    };

    spawnAndScheduleNext();
    return () => clearTimeout(timeoutId);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "playing") inputRef.current?.focus();
  }, [state.phase]);

  const resetInput = () => {
    isComposingRef.current = false;
    setDisplayValue("");
    dispatch({ type: "input", value: "", now: Date.now() });
  };

  const remainingSeconds = Math.ceil(state.remainingMs / 1000);
  const remainingRatio = state.remainingMs / ROUND_DURATION_MS;
  const isTimeCritical =
    state.phase === "playing" && state.remainingMs <= TIME_CRITICAL_MS;

  return (
    <div className="flex w-full flex-col items-center gap-4 px-4 py-8">
      <h1
        className="text-2xl font-black tracking-tight text-orange-500"
        style={{ animation: "title-glow 2.4s ease-in-out infinite" }}
      >
        🔥 불구덩이 사자성어 타자 🔥
      </h1>

      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-orange-600/50 shadow-[0_0_35px_rgba(255,90,0,0.25)]"
        style={{
          height: 480,
          background:
            "linear-gradient(180deg, #140804 0%, #1a0a03 45%, #4a1204 72%, #d8480a 90%, #ffb020 100%)",
        }}
      >
        <EmberParticles />

        {/* HUD 뒤에서 낱말이 나타나도록, 상단에 어두운 그라데이션을 깐다.
            낱말(z-auto)보다 위이고 HUD(z-10)보다 아래다. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-28"
          style={{
            background:
              "linear-gradient(180deg, #140804 0%, #140804 60%, rgba(20,8,4,0) 100%)",
          }}
        />

        <div className="absolute left-3 right-3 top-3 z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-orange-500/40 bg-black/50 px-3 py-1 text-sm font-black text-orange-50">
              점수 {state.score}
            </span>
            <span
              className="flex items-center gap-1 rounded-full border border-orange-500/40 bg-black/50 px-3 py-1"
              aria-label={`남은 목숨 ${state.lives}개`}
            >
              <span className="mr-0.5 text-[10px] font-bold text-orange-200/60">
                목숨
              </span>
              {Array.from({ length: INITIAL_LIVES }, (_, i) => (
                <span
                  key={i}
                  className="text-base leading-none"
                  style={
                    i < state.lives
                      ? {
                          animation: `flame-flicker ${1 + (i % 3) * 0.15}s ease-in-out infinite`,
                          animationDelay: `${i * 0.12}s`,
                        }
                      : { opacity: 0.55, filter: "grayscale(1)" }
                  }
                >
                  {i < state.lives ? LIFE_EMOJI : LOST_LIFE_EMOJI}
                </span>
              ))}
            </span>
          </div>

          <div
            className="flex items-center gap-2 rounded-full border border-orange-500/40 bg-black/50 px-3 py-1"
            aria-label={`남은 시간 ${remainingSeconds}초`}
          >
            <span className="text-[10px] font-bold text-orange-200/60">
              남은 시간
            </span>
            <span
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-orange-950/80"
              data-testid="time-bar"
            >
              <span
                className={
                  "block h-full rounded-full transition-[width] duration-100 ease-linear " +
                  (isTimeCritical ? "bg-red-500" : "bg-amber-400")
                }
                style={{ width: `${remainingRatio * 100}%` }}
              />
            </span>
            <span
              className={
                "w-8 text-right text-xs font-black tabular-nums " +
                (isTimeCritical ? "text-red-400" : "text-orange-50")
              }
            >
              {remainingSeconds}s
            </span>
          </div>
        </div>

        {state.words.map((w) => {
          const isTarget = w.id === state.targetId;
          return (
            <div
              key={w.id}
              data-testid="falling-word"
              onAnimationEnd={() => dispatch({ type: "land", wordId: w.id })}
              className={
                "absolute whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-black tracking-tight " +
                (isTarget
                  ? "border-2 border-amber-300 bg-[#241005] text-orange-50 shadow-[0_0_16px_rgba(255,170,40,0.85)]"
                  : "border border-orange-900/50 bg-[#fff2df] text-[#2b1400] shadow-[0_2px_6px_rgba(0,0,0,0.35)]")
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

        {state.missFlashKey > 0 && (
          <div
            key={state.missFlashKey}
            className="pointer-events-none absolute inset-0 z-20 bg-red-600"
            style={{ animation: "miss-flash 0.45s ease-out forwards" }}
          />
        )}

        {state.phase === "ready" && (
          <DifficultySelectPanel
            onSelect={(difficulty) => dispatch({ type: "start", difficulty })}
          />
        )}

        {state.phase === "finished" && state.outcome && (
          <RoundResultPanel
            outcome={state.outcome}
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
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          resetInput();
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
        className="w-full max-w-lg rounded-xl border-2 border-orange-600/50 bg-[#180a03] px-3 py-2 text-center text-lg font-bold text-orange-50 outline-none transition-shadow placeholder:text-orange-200/40 focus:border-orange-400 focus:shadow-[0_0_18px_rgba(255,140,0,0.55)] disabled:opacity-50"
      />

      {/* 방금 맞힌 사자성어의 뜻. 높이를 고정해 두어야 낱말을 맞힐 때마다
          아래 여백이 늘었다 줄었다 하며 화면이 흔들리지 않는다. */}
      <div
        className="flex h-10 w-full max-w-lg items-center justify-center px-2 text-center"
        aria-live="polite"
        data-testid="last-cleared-meaning"
      >
        {state.lastCleared && (
          <p key={state.lastCleared.text} className="text-sm leading-tight">
            <span className="font-black text-amber-400">
              {state.lastCleared.text}
            </span>
            <span className="text-orange-200/70">
              {" "}
              {state.lastCleared.meaning}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
