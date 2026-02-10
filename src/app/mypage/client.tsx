"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import WordUpload from "@/components/words/WordUpload";
import WordTable from "@/components/words/WordTable";
import { resetAllMemorized, exportWords } from "@/actions/words";

interface Word {
  id: string;
  word: string;
  meaning: string;
  memorized: boolean;
}

export default function MyPageClient({ initialWords }: { initialWords: Word[] }) {
  const router = useRouter();
  const [words, setWords] = useState(initialWords);

  function handleRefresh() {
    router.refresh();
  }

  async function handleReset() {
    if (!confirm("모든 단어의 암기 상태를 초기화하시겠습니까?")) return;
    await resetAllMemorized();
    setWords((prev) => prev.map((w) => ({ ...w, memorized: false })));
    router.refresh();
  }

  async function handleExport() {
    const content = await exportWords();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `words_export_${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 sm:flex-none dark:border-gray-600 dark:hover:bg-gray-800"
          >
            내보내기
          </button>
          <button
            onClick={handleReset}
            className="flex-1 rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 sm:flex-none dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            암기 초기화
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">단어 업로드</h2>
        <WordUpload onUploadComplete={handleRefresh} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">단어 목록</h2>
        <WordTable initialWords={words} onRefresh={handleRefresh} />
      </div>
    </div>
  );
}
