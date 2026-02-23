"use client";

import { useState } from "react";
import { importSharedFolder } from "@/actions/sharing";
import { useRouter } from "next/navigation";

export default function ImportButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleImport() {
    setLoading(true);
    const result = await importSharedFolder(token);
    setLoading(false);

    if ("error" in result) {
      alert(result.error);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/mypage"), 1500);
  }

  if (done) {
    return (
      <p className="text-sm font-medium text-green-600 dark:text-green-400">
        단어장이 추가되었습니다! 마이페이지로 이동합니다...
      </p>
    );
  }

  return (
    <button
      onClick={handleImport}
      disabled={loading}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "추가 중..." : "내 단어장에 추가"}
    </button>
  );
}
