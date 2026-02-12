"use client";

import { useState, useRef } from "react";
import { uploadWords } from "@/actions/words";

interface WordUploadProps {
  folderId?: string;
  onUploadComplete: () => void;
}

export default function WordUpload({ folderId, onUploadComplete }: WordUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadWords(formData, folderId);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      let text = `${result.count}개의 단어가 업로드되었습니다.`;
      if (result.skippedLines && result.skippedLines > 0) {
        text += ` (${result.skippedLines}개 줄 건너뜀)`;
      }
      setMessage({ type: "success", text });
      onUploadComplete();
    }

    setLoading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="hidden"
        />
        <svg
          className="mx-auto h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {loading ? "업로드 중..." : "txt 파일을 드래그하거나 클릭하여 업로드"}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          형식: 단어(탭)뜻 - 한 줄에 하나씩
        </p>
      </div>

      {message && (
        <p
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
