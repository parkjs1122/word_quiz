"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QuizCard from "@/components/quiz/QuizCard";
import QuizProgress from "@/components/quiz/QuizProgress";
import { toggleMemorized } from "@/actions/words";
import {
  loadQuizSession,
  saveQuizSession,
  clearQuizSession,
  type SavedQuizSession,
} from "@/lib/quiz-storage";

interface Word {
  id: string;
  word: string;
  meaning: string;
  memorized: boolean;
}

interface QuizClientProps {
  initialWords: Word[];
  userId: string;
}

export default function QuizClient({ initialWords, userId }: QuizClientProps) {
  const [words, setWords] = useState<Word[]>(initialWords);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const [savedSession, setSavedSession] = useState<SavedQuizSession | null>(
    null
  );
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load saved session on mount
  useEffect(() => {
    const saved = loadQuizSession(userId);
    if (saved) {
      setSavedSession(saved);
      setShowResumeModal(true);
    }
    setInitialized(true);
  }, [userId]);

  // Persist state to localStorage after each answer
  useEffect(() => {
    if (!initialized || finished || showResumeModal) return;
    if (words.length === 0) return;

    saveQuizSession(userId, { words, currentIndex, memorizedCount });
  }, [currentIndex, memorizedCount, finished, initialized, showResumeModal, words, userId]);

  // Clear saved session when quiz finishes
  useEffect(() => {
    if (finished) {
      clearQuizSession(userId);
    }
  }, [finished, userId]);

  function handleResume() {
    if (savedSession) {
      setWords(savedSession.words);
      setCurrentIndex(savedSession.currentIndex);
      setMemorizedCount(savedSession.memorizedCount);
    }
    setShowResumeModal(false);
  }

  function handleStartNew() {
    clearQuizSession(userId);
    setShowResumeModal(false);
  }

  const total = words.length;
  const currentWord = words[currentIndex];

  // Wait until localStorage check completes
  if (!initialized) {
    return null;
  }

  // Resume prompt
  if (showResumeModal && savedSession) {
    const remaining = savedSession.words.length - savedSession.currentIndex;
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="mb-4 text-5xl">📝</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            진행 중인 퀴즈가 있습니다
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {savedSession.words.length}개 중 {savedSession.currentIndex}개 완료
            (남은 단어: {remaining}개)
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleResume}
              className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              이어서 하기
            </button>
            <button
              onClick={handleStartNew}
              className="rounded-md border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              새로 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      try {
        await toggleMemorized(currentWord.id, true);
      } catch {
        // Word may have been deleted — continue quiz
      }
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
