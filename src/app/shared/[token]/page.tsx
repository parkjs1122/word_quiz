import { auth } from "@/lib/auth";
import { getSharedFolder, importSharedFolder } from "@/actions/sharing";
import { redirect } from "next/navigation";
import Link from "next/link";
import ImportButton from "./import-button";

export default async function SharedFolderPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await getSharedFolder(params.token);

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-4 text-5xl">🔗</div>
        <h1 className="mb-2 text-2xl font-bold">공유 링크를 찾을 수 없습니다</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          이 링크가 올바른지 확인해주세요.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          홈으로 가기
        </Link>
      </div>
    );
  }

  const session = await auth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{data.folderName}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          공유된 단어장 · {data.wordCount}개 단어
        </p>
      </div>

      {session?.user?.id && (
        <div className="mb-6">
          <ImportButton token={params.token} />
        </div>
      )}

      {!session?.user?.id && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <Link href="/login" className="font-medium underline">
              로그인
            </Link>
            하면 이 단어장을 내 단어장에 추가할 수 있습니다.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                단어
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                뜻
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.words.map((w) => (
              <tr key={w.id} className="bg-white dark:bg-gray-900">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {w.word}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {w.meaning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
