"use client";

import { useState, useEffect } from "react";
import TTSButton from "./TTSButton";

interface Word {
  id: string;
  word: string;
  meaning: string;
}

interface QuizCardReverseProps {
  word: Word;
  showMeaning: boolean;
  manualReveal?: boolean;
  onReveal: () => void;
  onAnswer: (memorized: boolean) => void;
}

export default function QuizCardReverse({
  word,
  showMeaning,
  manualReveal = false,
  onReveal,
  onAnswer,
}: QuizCardReverseProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    setCountdown(3);

    if (manualReveal) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReveal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [word.id, manualReveal, onReveal]);

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
      {/* Meaning shown first */}
      <div className="mb-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-500 dark:text-blue-400">
          뜻
        </p>
      </div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {word.meaning}
        </h2>
      </div>

      {/* Word reveal */}
      <div className="mb-8 flex min-h-[80px] items-center justify-center">
        {showMeaning ? (
          <div className="animate-flip-in flex items-center gap-2">
            <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
              {word.word}
            </p>
            <TTSButton text={word.word} />
          </div>
        ) : manualReveal ? (
          <button
            onClick={onReveal}
            className="rounded-lg border-2 border-blue-400 px-6 py-3 text-base font-medium text-blue-500 transition-colors hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            단어 보기
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {countdown}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              잠시 후 단어가 표시됩니다
            </p>
          </div>
        )}
      </div>

      {/* O/X Buttons */}
      {showMeaning && (
        <div className="flex gap-4">
          <button
            onClick={() => onAnswer(true)}
            className="flex-1 rounded-lg border-2 border-green-400 py-3 text-lg font-bold text-green-500 transition-colors hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            O 외웠어요
          </button>
          <button
            onClick={() => onAnswer(false)}
            className="flex-1 rounded-lg border-2 border-red-400 py-3 text-lg font-bold text-red-500 transition-colors hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            X 모르겠어요
          </button>
        </div>
      )}
    </div>
  );
}
