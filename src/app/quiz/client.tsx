"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QuizCard from "@/components/quiz/QuizCard";
import QuizProgress from "@/components/quiz/QuizProgress";
import { toggleMemorized } from "@/actions/words";
import { getQuizWords } from "@/actions/quiz";
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

interface QuizFolder {
  id: string;
  name: string;
  wordCount: number;
}

interface QuizClientProps {
  folders: QuizFolder[];
  userId: string;
}

export default function QuizClient({ folders, userId }: QuizClientProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(true);

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
    if (!initialized || finished || showResumeModal || !quizStarted) return;
    if (words.length === 0) return;

    saveQuizSession(userId, {
      words,
      currentIndex,
      memorizedCount,
      folderIds: selectAll ? undefined : Array.from(selectedFolderIds),
    });
  }, [
    currentIndex,
    memorizedCount,
    finished,
    initialized,
    showResumeModal,
    quizStarted,
    words,
    userId,
    selectAll,
    selectedFolderIds,
  ]);

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
      if (savedSession.folderIds) {
        setSelectedFolderIds(new Set(savedSession.folderIds));
        setSelectAll(false);
      }
      setQuizStarted(true);
    }
    setShowResumeModal(false);
  }

  function handleStartNew() {
    clearQuizSession(userId);
    setShowResumeModal(false);
  }

  function toggleFolder(id: string) {
    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSelectAll(false);
  }

  function handleSelectAll() {
    setSelectAll(true);
    setSelectedFolderIds(new Set());
  }

  async function handleStartQuiz() {
    setLoading(true);
    try {
      const folderIds = selectAll ? undefined : Array.from(selectedFolderIds);
      const quizWords = await getQuizWords(folderIds);
      setWords(quizWords);
      setCurrentIndex(0);
      setMemorizedCount(0);
      setFinished(false);
      setQuizStarted(true);
    } finally {
      setLoading(false);
    }
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

  // Folder selection screen
  if (!quizStarted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8 dark:bg-gray-800">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-white">
            퀴즈 범위 선택
          </h2>

          <div className="space-y-2">
            <button
              onClick={handleSelectAll}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                selectAll
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              }`}
            >
              <span className="font-medium">전체 단어</span>
              {selectAll && (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {folders.length > 0 && (
              <div className="py-2">
                <p className="mb-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  폴더별 선택
                </p>
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => toggleFolder(folder.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                        selectedFolderIds.has(folder.id)
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="font-medium">{folder.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm opacity-60">
                          {folder.wordCount}개
                        </span>
                        {selectedFolderIds.has(folder.id) && (
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={loading || (!selectAll && selectedFolderIds.size === 0)}
            className="mt-6 w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "불러오는 중..." : "퀴즈 시작"}
          </button>
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
