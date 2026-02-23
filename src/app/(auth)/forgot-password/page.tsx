"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/password-reset";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestPasswordReset(email);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          비밀번호 찾기
        </h1>

        {sent ? (
          <div className="text-center">
            <div className="mb-4 text-5xl">📧</div>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              입력하신 이메일로 비밀번호 재설정 링크를 전송했습니다.
              이메일을 확인해주세요.
            </p>
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="email@example.com"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "전송 중..." : "재설정 링크 전송"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <Link
                href="/login"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                로그인으로 돌아가기
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
