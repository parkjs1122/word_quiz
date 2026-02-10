"use client";

import { useState } from "react";
import Link from "next/link";
import QuizCard from "@/components/quiz/QuizCard";
import QuizProgress from "@/components/quiz/QuizProgress";
import { toggleMemorized } from "@/actions/words";

interface Word {
  id: string;
  word: string;
  meaning: string;
  memorized: boolean;
}

export default function QuizClient({ initialWords }: { initialWords: Word[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = initialWords.length;
  const currentWord = initialWords[currentIndex];

  if (total === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-4 text-6xl">📚</div>
        <h1 className="mb-2 text-2xl font-bold">암기할 단어가 없습니다</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          모든 단어를 암기했거나 아직 단어를 업로드하지 않았습니다.
        </p>
        <Link
          href="/mypage"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          마이페이지에서 단어 업로드
        </Link>
      </div>
    );
  }

  async function handleAnswer(memorized: boolean) {
    if (memorized) {
      await toggleMemorized(currentWord.id, true);
      setMemorizedCount((prev) => prev + 1);
    }

    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  if (finished) {
    const finalMemorized = memorizedCount;
    const remaining = total - finalMemorized;

    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="mb-4 text-2xl font-bold">퀴즈 완료!</h1>
        <div className="mb-6 space-y-2 text-gray-600 dark:text-gray-400">
          <p>전체 단어: {total}개</p>
          <p className="text-green-600 dark:text-green-400">
            암기 완료: {finalMemorized}개
          </p>
          <p className="text-red-600 dark:text-red-400">
            미암기: {remaining}개
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/quiz"
            className="rounded-md bg-blue-600 px-6 py-3 text-center text-white hover:bg-blue-700"
          >
            다시 하기
          </Link>
          <Link
            href="/mypage"
            className="rounded-md border border-gray-300 px-6 py-3 text-center hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            마이페이지
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <QuizProgress current={currentIndex + 1} total={total} />
      </div>
      <QuizCard word={currentWord} onAnswer={handleAnswer} />
    </div>
  );
}
