"use client";

import { useState, useEffect, useMemo } from "react";
import TTSButton from "./TTSButton";

interface Word {
  id: string;
  word: string;
  meaning: string;
}

interface QuizCardMultipleChoiceProps {
  word: Word;
  allWords: Word[];
  onAnswer: (correct: boolean) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function QuizCardMultipleChoice({
  word,
  allWords,
  onAnswer,
}: QuizCardMultipleChoiceProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const choices = useMemo(() => {
    const others = allWords.filter((w) => w.id !== word.id);
    const shuffled = shuffleArray(others);
    const wrongChoices = shuffled.slice(0, 3).map((w) => w.meaning);
    const all = shuffleArray([...wrongChoices, word.meaning]);
    return all;
  }, [word.id, allWords]);

  const correctIndex = choices.indexOf(word.meaning);

  useEffect(() => {
    setSelectedIndex(null);
    setAnswered(false);
  }, [word.id]);

  function handleSelect(index: number) {
    if (answered) return;
    setSelectedIndex(index);
    setAnswered(true);

    const isCorrect = index === correctIndex;
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1200);
  }

  function getButtonStyle(index: number) {
    const base =
      "w-full rounded-lg border-2 px-4 py-3 text-left text-base font-medium transition-colors";

    if (!answered) {
      return `${base} border-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/20`;
    }

    if (index === correctIndex) {
      return `${base} border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-900/20 dark:text-green-400`;
    }

    if (index === selectedIndex && index !== correctIndex) {
      return `${base} border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-900/20 dark:text-red-400`;
    }

    return `${base} border-gray-200 opacity-50 dark:border-gray-600`;
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
      {/* Word */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {word.word}
          </h2>
          <TTSButton text={word.word} />
        </div>
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <button
            key={`${word.id}-${index}`}
            onClick={() => handleSelect(index)}
            disabled={answered}
            className={getButtonStyle(index)}
          >
            <span className="mr-2 text-gray-400">{index + 1}.</span>
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
