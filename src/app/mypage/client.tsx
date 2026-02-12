"use client";

import { useRouter } from "next/navigation";
import WordUpload from "@/components/words/WordUpload";
import WordTable from "@/components/words/WordTable";
import FolderList from "@/components/words/FolderList";
import { resetAllMemorized, exportWords } from "@/actions/words";

interface Folder {
  id: string;
  name: string;
  _count: { words: number };
}

interface Word {
  id: string;
  word: string;
  meaning: string;
  memorized: boolean;
  folderId: string | null;
  folder: { id: string; name: string } | null;
}

interface MyPageClientProps {
  initialWords: Word[];
  initialFolders: Folder[];
  totalWordCount: number;
  uncategorizedCount: number;
  // undefined = all, null = uncategorized, string = specific folder
  selectedFolderId: string | null | undefined;
}

export default function MyPageClient({
  initialWords,
  initialFolders,
  totalWordCount,
  uncategorizedCount,
  selectedFolderId,
}: MyPageClientProps) {
  const router = useRouter();

  function handleRefresh() {
    router.refresh();
  }

  async function handleReset() {
    const label =
      selectedFolderId === undefined
        ? "모든 단어"
        : selectedFolderId === null
          ? "미분류 단어"
          : initialFolders.find((f) => f.id === selectedFolderId)?.name + " 폴더의 단어";
    if (!confirm(`${label}의 암기 상태를 초기화하시겠습니까?`)) return;
    await resetAllMemorized(selectedFolderId);
    router.refresh();
  }

  async function handleExport() {
    const content = await exportWords(selectedFolderId);
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
    <div className="mx-auto max-w-5xl px-4 py-8">
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

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Folder sidebar */}
        <div className="w-full shrink-0 md:w-48">
          <FolderList
            folders={initialFolders}
            totalWordCount={totalWordCount}
            uncategorizedCount={uncategorizedCount}
            selectedFolderId={selectedFolderId}
            onFoldersChange={handleRefresh}
          />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">단어 업로드</h2>
            <WordUpload
              folderId={typeof selectedFolderId === "string" ? selectedFolderId : undefined}
              onUploadComplete={handleRefresh}
            />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">
              단어 목록
              {selectedFolderId === null && " — 미분류"}
              {typeof selectedFolderId === "string" &&
                ` — ${initialFolders.find((f) => f.id === selectedFolderId)?.name}`}
            </h2>
            <WordTable
              initialWords={initialWords}
              folders={initialFolders}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
