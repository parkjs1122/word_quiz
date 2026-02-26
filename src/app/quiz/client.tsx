"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import QuizCard from "@/components/quiz/QuizCard";

/** Offline-safe link: uses <a> (full page nav) when offline, <Link> (SPA nav) when online */
function OfflineLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const { isOnline } = useOffline();
  if (!isOnline) {
    return <a href={href} className={className}>{children}</a>;
  }
  return <Link href={href} className={className}>{children}</Link>;
}
import QuizCardReverse from "@/components/quiz/QuizCardReverse";
import QuizCardMultipleChoice from "@/components/quiz/QuizCardMultipleChoice";
import QuizProgress from "@/components/quiz/QuizProgress";
import { toggleMemorized } from "@/actions/words";
import { getQuizWords, getReviewWords } from "@/actions/quiz";
import { saveQuizResult } from "@/actions/quiz-history";
import {
  loadQuizSessionFromDB,
  saveQuizSessionToDB,
  clearQuizSessionFromDB,
  type SavedQuizSession,
  type QuizMode,
} from "@/actions/quiz-session";
import { useOffline } from "@/lib/offline/context";
import {
  getLocalWords,
  getLocalReviewWords,
  getLocalFolders,
  updateLocalWord,
  addPendingAction,
  saveQuizSessionToLocal,
  loadQuizSessionFromLocal,
  clearQuizSessionFromLocal,
  getLocalWordById,
  type LocalFolder,
} from "@/lib/offline/db";

const SRS_INTERVALS = [0, 1, 3, 7, 14, 30];

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
  reviewMode?: boolean;
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function QuizClient({ folders: serverFolders, userId, reviewMode = false }: QuizClientProps) {
  const { isOnline, isOfflineReady } = useOffline();

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

  // Phase 1-2: Quiz settings
  const [manualReveal, setManualReveal] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);

  // Phase 1-3: Quiz mode
  const [quizMode, setQuizMode] = useState<QuizMode>("normal");

  // Phase 1-4: Wrong answers
  const [wrongWords, setWrongWords] = useState<Word[]>([]);

  // Offline: fallback folders from IndexedDB
  const [offlineFolders, setOfflineFolders] = useState<QuizFolder[]>([]);

  const folders = serverFolders.length > 0 ? serverFolders : offlineFolders;

  // Load offline folders if server folders are empty (offline/cached page)
  useEffect(() => {
    if (serverFolders.length === 0 && !isOnline && isOfflineReady) {
      getLocalFolders().then((localFolders: LocalFolder[]) => {
        getLocalWords().then((allWords) => {
          const folderWordCounts = new Map<string, number>();
          for (const w of allWords) {
            if (w.folderId) {
              folderWordCounts.set(
                w.folderId,
                (folderWordCounts.get(w.folderId) || 0) + 1
              );
            }
          }
          setOfflineFolders(
            localFolders.map((f) => ({
              id: f.id,
              name: f.name,
              wordCount: folderWordCounts.get(f.id) || 0,
            }))
          );
        });
      });
    }
  }, [serverFolders.length, isOnline, isOfflineReady]);

  // Load saved session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        if (isOnline) {
          const saved = await loadQuizSessionFromDB();
          if (saved) {
            setSavedSession(saved);
            setShowResumeModal(true);
          }
        } else {
          // Offline: load from IndexedDB
          const localSession = await loadQuizSessionFromLocal();
          if (localSession) {
            const saved = localSession as unknown as SavedQuizSession;
            if (saved.words && saved.words.length > 0) {
              setSavedSession(saved);
              setShowResumeModal(true);
            }
          }
        }
      } catch {
        // Ignore errors
      }
      setInitialized(true);
    }
    loadSession();
  }, [userId, isOnline]);

  // Persist state after each answer
  useEffect(() => {
    if (!initialized || finished || showResumeModal || !quizStarted) return;
    if (words.length === 0) return;

    const sessionData = {
      words,
      currentIndex,
      memorizedCount,
      folderIds: selectAll ? undefined : Array.from(selectedFolderIds),
      quizMode,
      manualReveal,
      wrongWords,
    };

    if (isOnline) {
      saveQuizSessionToDB(sessionData).catch(() => {});
    } else {
      saveQuizSessionToLocal(sessionData).catch(() => {});
    }
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
    quizMode,
    manualReveal,
    wrongWords,
    isOnline,
  ]);

  // Clear saved session and save result when quiz finishes
  useEffect(() => {
    if (finished && words.length > 0) {
      const resultData = {
        totalWords: words.length,
        correctCount: memorizedCount,
        wrongCount: words.length - memorizedCount,
        quizMode,
      };

      if (isOnline) {
        clearQuizSessionFromDB().catch(() => {});
        saveQuizResult(resultData).catch(() => {});
      } else {
        clearQuizSessionFromLocal().catch(() => {});
        addPendingAction({
          type: "QUIZ_RESULT",
          payload: resultData,
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      }
    }
  }, [finished, userId, words.length, memorizedCount, quizMode, isOnline]);

  // Phase 1-2: Reset showMeaning when word changes
  useEffect(() => {
    setShowMeaning(false);
  }, [currentIndex]);

  const handleReveal = useCallback(() => {
    setShowMeaning(true);
  }, []);

  // Phase 1-2: Keyboard shortcuts
  useEffect(() => {
    if (!quizStarted || finished) return;
    if (quizMode === "multipleChoice") return; // MC has its own input

    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!showMeaning) {
          setShowMeaning(true);
        }
      } else if (e.key === "ArrowRight" && showMeaning) {
        e.preventDefault();
        handleAnswer(true);
      } else if (e.key === "ArrowLeft" && showMeaning) {
        e.preventDefault();
        handleAnswer(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizStarted, finished, showMeaning, currentIndex, quizMode]);

  function handleResume() {
    if (savedSession) {
      setWords(savedSession.words);
      setCurrentIndex(savedSession.currentIndex);
      setMemorizedCount(savedSession.memorizedCount);
      if (savedSession.folderIds) {
        setSelectedFolderIds(new Set(savedSession.folderIds));
        setSelectAll(false);
      }
      setQuizMode(savedSession.quizMode);
      setManualReveal(savedSession.manualReveal);
      if (savedSession.wrongWords) {
        setWrongWords(savedSession.wrongWords);
      }
      setQuizStarted(true);
    }
    setShowResumeModal(false);
  }

  function handleStartNew() {
    if (isOnline) {
      clearQuizSessionFromDB().catch(() => {});
    } else {
      clearQuizSessionFromLocal().catch(() => {});
    }
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

      let quizWords: Word[];

      if (isOnline) {
        quizWords = reviewMode
          ? await getReviewWords(folderIds)
          : await getQuizWords(folderIds);
      } else {
        // Offline: load from IndexedDB
        const localWords = reviewMode
          ? await getLocalReviewWords(folderIds)
          : await getLocalWords(folderIds, false);

        quizWords = fisherYatesShuffle(
          localWords.map((w) => ({
            id: w.id,
            word: w.word,
            meaning: w.meaning,
            memorized: w.memorized,
          }))
        );
      }

      setWords(quizWords);
      setCurrentIndex(0);
      setMemorizedCount(0);
      setFinished(false);
      setWrongWords([]);
      setQuizStarted(true);
    } finally {
      setLoading(false);
    }
  }

  const total = words.length;
  const currentWord = words[currentIndex];

  async function handleAnswer(memorized: boolean) {
    if (memorized) {
      if (isOnline) {
        try {
          await toggleMemorized(currentWord.id, true);
        } catch {
          // Word may have been deleted — continue quiz
        }
      } else {
        // Offline: read actual level, compute SRS locally, queue for sync
        try {
          const localWord = await getLocalWordById(currentWord.id);
          const currentLevel = localWord?.level ?? 0;
          const newLevel = Math.min(currentLevel + 1, 5);
          const nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + SRS_INTERVALS[newLevel]);

          await updateLocalWord(currentWord.id, {
            memorized: newLevel >= 5,
            level: newLevel,
            nextReviewAt: nextReview.toISOString(),
          });
        } catch {
          // Continue quiz even if local update fails
        }

        addPendingAction({
          type: "TOGGLE_MEMORIZED",
          payload: { wordId: currentWord.id, memorized: true },
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      }
      setMemorizedCount((prev) => prev + 1);
    } else {
      setWrongWords((prev) => [...prev, currentWord]);
    }

    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  // Multiple choice handler (correct=true maps to memorized=true)
  async function handleMultipleChoiceAnswer(correct: boolean) {
    await handleAnswer(correct);
  }

  function handleRetryWrong() {
    setWords(fisherYatesShuffle(wrongWords));
    setCurrentIndex(0);
    setMemorizedCount(0);
    setFinished(false);
    setWrongWords([]);
    setShowMeaning(false);
  }

  // Wait until session check completes
  if (!initialized) {
    return null;
  }

  // Offline but no data prepared
  if (!isOnline && !isOfflineReady && !quizStarted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-4 text-6xl">📡</div>
        <h1 className="mb-2 text-2xl font-bold">오프라인 데이터 없음</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          인터넷에 연결한 후 대시보드에서 &quot;오프라인 준비&quot;를 눌러주세요.
        </p>
        <OfflineLink
          href="/dashboard"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          대시보드로 이동
        </OfflineLink>
      </div>
    );
  }

  // Resume prompt
  if (showResumeModal && savedSession) {
    const remaining = savedSession.words.length - savedSession.currentIndex;
    const modeLabel =
      savedSession.quizMode === "reverse"
        ? " (역방향)"
        : savedSession.quizMode === "multipleChoice"
          ? " (4지선다)"
          : "";
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="mb-4 text-5xl">📝</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            진행 중인 퀴즈가 있습니다{modeLabel}
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

  // Folder & mode selection screen
  if (!quizStarted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8 dark:bg-gray-800">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-white">
            퀴즈 설정
          </h2>

          {/* Quiz Mode Selection */}
          <div className="mb-6">
            <p className="mb-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              퀴즈 모드
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "normal", label: "기본", desc: "단어 → 뜻" },
                  { value: "reverse", label: "역방향", desc: "뜻 → 단어" },
                  {
                    value: "multipleChoice",
                    label: "4지선다",
                    desc: "보기 선택",
                  },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setQuizMode(mode.value)}
                  className={`rounded-lg border px-3 py-2.5 text-center transition-colors ${
                    quizMode === mode.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="block text-sm font-medium">
                    {mode.label}
                  </span>
                  <span className="block text-xs opacity-60">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual reveal toggle (not for multiple choice) */}
          {quizMode !== "multipleChoice" && (
            <div className="mb-6">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  수동 뜻 공개
                </span>
                <div
                  onClick={() => setManualReveal(!manualReveal)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    manualReveal ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      manualReveal ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </label>
            </div>
          )}

          {/* Folder selection */}
          <div className="mb-6">
            <p className="mb-2 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              퀴즈 범위
            </p>
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
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={loading || (!selectAll && selectedFolderIds.size === 0)}
            className="mt-2 w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        <OfflineLink
          href="/mypage"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          마이페이지에서 단어 업로드
        </OfflineLink>
      </div>
    );
  }

  // Finished screen with wrong answer review
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

        {/* Wrong words list */}
        {wrongWords.length > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                오답 목록 ({wrongWords.length}개)
              </h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {wrongWords.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between border-b border-gray-100 px-4 py-2 last:border-0 dark:border-gray-700"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {w.word}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {w.meaning}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          {wrongWords.length > 0 && (
            <button
              onClick={handleRetryWrong}
              className="rounded-md bg-red-600 px-6 py-3 text-center text-white hover:bg-red-700"
            >
              틀린 단어만 다시 ({wrongWords.length}개)
            </button>
          )}
          <OfflineLink
            href="/quiz"
            className="rounded-md bg-blue-600 px-6 py-3 text-center text-white hover:bg-blue-700"
          >
            다시 하기
          </OfflineLink>
          <OfflineLink
            href="/mypage"
            className="rounded-md border border-gray-300 px-6 py-3 text-center hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            마이페이지
          </OfflineLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <QuizProgress current={currentIndex + 1} total={total} />
      </div>

      {/* Render quiz card based on mode */}
      <div key={currentWord.id} className="animate-slide-in">
        {quizMode === "multipleChoice" ? (
          <QuizCardMultipleChoice
            word={currentWord}
            allWords={words}
            onAnswer={handleMultipleChoiceAnswer}
          />
        ) : quizMode === "reverse" ? (
          <QuizCardReverse
            word={currentWord}
            showMeaning={showMeaning}
            manualReveal={manualReveal}
            onReveal={handleReveal}
            onAnswer={handleAnswer}
          />
        ) : (
          <QuizCard
            word={currentWord}
            showMeaning={showMeaning}
            manualReveal={manualReveal}
            onReveal={handleReveal}
            onAnswer={handleAnswer}
          />
        )}
      </div>

      {/* Keyboard shortcut hints */}
      {quizMode !== "multipleChoice" && (
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          Space: 뜻 보기 &nbsp;|&nbsp; →: 외움 &nbsp;|&nbsp; ←: 모름
        </p>
      )}
    </div>
  );
}
