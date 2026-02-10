"use client";

import { useState, useMemo } from "react";
import { updateWord, deleteWord, deleteWords } from "@/actions/words";

const PAGE_SIZE = 50;

interface Word {
  id: string;
  word: string;
  meaning: string;
  memorized: boolean;
}

interface WordTableProps {
  initialWords: Word[];
  onRefresh: () => void;
}

export default function WordTable({ initialWords, onRefresh }: WordTableProps) {
  const [words, setWords] = useState(initialWords);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "memorized" | "unmemorized">("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const [editMemorized, setEditMemorized] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useState(() => {
    setWords(initialWords);
  });

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "memorized" && w.memorized) ||
        (filter === "unmemorized" && !w.memorized);

      const matchesSearch =
        !search ||
        w.word.toLowerCase().includes(search.toLowerCase()) ||
        w.meaning.toLowerCase().includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [words, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedWords = filteredWords.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Reset page when filter/search changes
  function handleFilterChange(f: "all" | "memorized" | "unmemorized") {
    setFilter(f);
    setPage(1);
  }
  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  const allPageSelected =
    pagedWords.length > 0 &&
    pagedWords.every((w) => selectedIds.has(w.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedWords.forEach((w) => next.delete(w.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedWords.forEach((w) => next.add(w.id));
        return next;
      });
    }
  }

  function startEdit(w: Word) {
    setEditingId(w.id);
    setEditWord(w.word);
    setEditMeaning(w.meaning);
    setEditMemorized(w.memorized);
  }

  async function saveEdit(id: string) {
    await updateWord(id, { word: editWord, meaning: editMeaning, memorized: editMemorized });
    setWords((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, word: editWord, meaning: editMeaning, memorized: editMemorized } : w
      )
    );
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 단어를 삭제하시겠습니까?")) return;
    await deleteWord(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    onRefresh();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}개의 단어를 삭제하시겠습니까?`)) return;

    setDeleting(true);
    await deleteWords(Array.from(selectedIds));
    setWords((prev) => prev.filter((w) => !selectedIds.has(w.id)));
    setSelectedIds(new Set());
    setDeleting(false);
    onRefresh();
  }

  // Build visible page numbers: always show first, last, current +/- 2, with ellipsis
  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    const left = Math.max(2, safePage - 1);
    const right = Math.min(totalPages - 1, safePage + 1);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);

    return pages;
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="단어 또는 뜻 검색..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <div className="flex gap-1">
          {(["all", "unmemorized", "memorized"] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`rounded-md px-3 py-2 text-sm ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {f === "all" ? "전체" : f === "memorized" ? "암기완료" : "미암기"}
            </button>
          ))}
        </div>
      </div>

      {/* Word count & Bulk actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredWords.length}개의 단어
          {selectedIds.size > 0 && (
            <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
              ({selectedIds.size}개 선택됨)
            </span>
          )}
        </p>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : `선택 삭제 (${selectedIds.size})`}
          </button>
        )}
      </div>

      {/* Word list */}
      {filteredWords.length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">
          {words.length === 0 ? "업로드된 단어가 없습니다." : "검색 결과가 없습니다."}
        </p>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 sm:block dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    단어
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    뜻
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                    암기
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pagedWords.map((w) => (
                  <tr
                    key={w.id}
                    className={`${
                      selectedIds.has(w.id)
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "bg-white dark:bg-gray-900"
                    }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(w.id)}
                        onChange={() => toggleSelect(w.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {editingId === w.id ? (
                        <input
                          value={editWord}
                          onChange={(e) => setEditWord(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">
                          {w.word}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === w.id ? (
                        <input
                          value={editMeaning}
                          onChange={(e) => setEditMeaning(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">{w.meaning}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === w.id ? (
                        <button
                          type="button"
                          onClick={() => setEditMemorized(!editMemorized)}
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                            editMemorized
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {editMemorized ? "O" : "X"}
                        </button>
                      ) : (
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            w.memorized
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {w.memorized ? "O" : "X"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === w.id ? (
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => saveEdit(w.id)}
                            className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => startEdit(w)}
                            className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Card layout */}
          <div className="space-y-2 sm:hidden">
            {/* Select all row */}
            <label className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800">
              <input
                type="checkbox"
                checked={allPageSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                이 페이지 전체 선택
              </span>
            </label>

            {pagedWords.map((w) => (
              <div
                key={w.id}
                className={`rounded-lg border p-3 ${
                  selectedIds.has(w.id)
                    ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(w.id)}
                    onChange={() => toggleSelect(w.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <div className="min-w-0 flex-1">
                    {editingId === w.id ? (
                      <div className="space-y-2">
                        <input
                          value={editWord}
                          onChange={(e) => setEditWord(e.target.value)}
                          placeholder="단어"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <input
                          value={editMeaning}
                          onChange={(e) => setEditMeaning(e.target.value)}
                          placeholder="뜻"
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <span>암기:</span>
                            <button
                              type="button"
                              onClick={() => setEditMemorized(!editMemorized)}
                              className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                                editMemorized
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              {editMemorized ? "O" : "X"}
                            </button>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(w.id)}
                            className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {w.word}
                          </span>
                          <span
                            className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              w.memorized
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                          >
                            {w.memorized ? "O" : "X"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                          {w.meaning}
                        </p>
                      </>
                    )}
                  </div>
                  {editingId !== w.id && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => startEdit(w)}
                        className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              {/* Page info */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(safePage - 1) * PAGE_SIZE + 1}~
                {Math.min(safePage * PAGE_SIZE, filteredWords.length)}번째 /{" "}
                {filteredWords.length}개
              </p>

              {/* Page controls */}
              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700"
                  aria-label="이전 페이지"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 text-sm text-gray-400 dark:text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[32px] rounded-md px-2 py-1.5 text-sm ${
                        p === safePage
                          ? "bg-blue-600 font-medium text-white"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700"
                  aria-label="다음 페이지"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
