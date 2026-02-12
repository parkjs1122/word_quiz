"use client";

import { useState } from "react";
import { createFolder, renameFolder, deleteFolder } from "@/actions/folders";

interface Folder {
  id: string;
  name: string;
  _count: { words: number };
}

interface FolderListProps {
  folders: Folder[];
  totalWordCount: number;
  uncategorizedCount: number;
  // selectedFolderId: undefined = all, null = uncategorized, string = specific folder
  selectedFolderId: string | null | undefined;
  onSelectFolder: (folderId: string | null | undefined) => void;
  onFoldersChange: () => void;
}

export default function FolderList({
  folders,
  totalWordCount,
  uncategorizedCount,
  selectedFolderId,
  onSelectFolder,
  onFoldersChange,
}: FolderListProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) return;
    setError(null);
    const result = await createFolder(newName);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNewName("");
    setCreating(false);
    onFoldersChange();
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    setError(null);
    const result = await renameFolder(id, editName);
    if (result && result.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    onFoldersChange();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 폴더를 삭제하시겠습니까?\n(단어는 미분류로 이동됩니다)`))
      return;
    await deleteFolder(id);
    if (selectedFolderId === id) {
      onSelectFolder(undefined);
    }
    onFoldersChange();
  }

  const itemBase =
    "flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors";
  const itemActive = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  const itemInactive =
    "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700";

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          폴더
        </h3>
        <button
          onClick={() => {
            setCreating(!creating);
            setError(null);
          }}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          title="새 폴더"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Create folder input */}
      {creating && (
        <div className="mb-2 flex gap-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="폴더 이름"
            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
          >
            추가
          </button>
          <button
            onClick={() => {
              setCreating(false);
              setNewName("");
              setError(null);
            }}
            className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            취소
          </button>
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* All words */}
      <div
        onClick={() => onSelectFolder(undefined)}
        className={`${itemBase} ${selectedFolderId === undefined ? itemActive : itemInactive}`}
      >
        <span>전체</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {totalWordCount}
        </span>
      </div>

      {/* Uncategorized */}
      <div
        onClick={() => onSelectFolder(null)}
        className={`${itemBase} ${selectedFolderId === null ? itemActive : itemInactive}`}
      >
        <span>미분류</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {uncategorizedCount}
        </span>
      </div>

      {/* Folder items */}
      {folders.map((f) => (
        <div
          key={f.id}
          className={`${itemBase} ${selectedFolderId === f.id ? itemActive : itemInactive}`}
        >
          {editingId === f.id ? (
            <div className="flex min-w-0 flex-1 gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename(f.id)}
                className="min-w-0 flex-1 rounded border border-gray-300 px-1 py-0.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
              <button
                onClick={() => handleRename(f.id)}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setError(null);
                }}
                className="text-xs text-gray-500 hover:underline"
              >
                취소
              </button>
            </div>
          ) : (
            <>
              <span
                className="min-w-0 flex-1 truncate"
                onClick={() => onSelectFolder(f.id)}
              >
                {f.name}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <span className="mr-1 text-xs text-gray-400 dark:text-gray-500">
                  {f._count.words}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(f.id);
                    setEditName(f.name);
                    setError(null);
                  }}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                  title="이름 변경"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(f.id, f.name);
                  }}
                  className="rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  title="삭제"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
