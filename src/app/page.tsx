import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:py-16">
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
        Word Quiz
      </h1>
      <p className="mb-8 text-lg text-gray-600 sm:text-xl dark:text-gray-400">
        단어를 업로드하고 퀴즈로 효과적으로 암기하세요
      </p>

      <div className="mb-12 grid gap-4 sm:gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow sm:p-6 dark:bg-gray-800">
          <div className="mb-3 text-3xl">📤</div>
          <h3 className="mb-2 font-semibold">간편한 업로드</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            txt 파일로 단어장을 한 번에 업로드
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow sm:p-6 dark:bg-gray-800">
          <div className="mb-3 text-3xl">🧠</div>
          <h3 className="mb-2 font-semibold">스마트 퀴즈</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            미암기 단어만 셔플하여 효율적으로 학습
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow sm:p-6 dark:bg-gray-800">
          <div className="mb-3 text-3xl">🔊</div>
          <h3 className="mb-2 font-semibold">발음 학습</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            TTS로 정확한 발음을 들으며 학습
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold text-white hover:bg-blue-700"
        >
          시작하기
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 px-8 py-3 text-lg font-semibold hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          로그인
        </Link>
      </div>
    </div>
  );
}
