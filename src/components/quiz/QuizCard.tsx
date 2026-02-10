"use client";

import { useState, useEffect } from "react";
import TTSButton from "./TTSButton";

interface Word {
  id: string;
  word: string;
  meaning: string;
}

interface QuizCardProps {
  word: Word;
  onAnswer: (memorized: boolean) => void;
}

export default function QuizCard({ word, onAnswer }: QuizCardProps) {
  const [showMeaning, setShowMeaning] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    setShowMeaning(false);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowMeaning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [word.id]);

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
      {/* Word */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {word.word}
          </h2>
          <TTSButton text={word.word} />
        </div>
      </div>

      {/* Meaning / Countdown */}
      <div className="mb-8 flex min-h-[80px] items-center justify-center">
        {showMeaning ? (
          <p className="animate-fade-in text-xl text-gray-700 dark:text-gray-300">
            {word.meaning}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {countdown}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              잠시 후 뜻이 표시됩니다
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
