import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyPageClient from "./client";

export const dynamic = "force-dynamic";

export default async function MyPage({
  searchParams,
}: {
  searchParams: { folder?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const folderParam = searchParams.folder;

  // Build where clause: undefined = all, "uncategorized" = no folder, otherwise = folder id
  let wordsWhere: { userId: string; folderId?: string | null } = { userId };
  if (folderParam === "uncategorized") {
    wordsWhere = { userId, folderId: null };
  } else if (folderParam) {
    wordsWhere = { userId, folderId: folderParam };
  }

  // selectedFolderId for client: undefined = all, null = uncategorized, string = folder id
  let selectedFolderId: string | null | undefined = undefined;
  if (folderParam === "uncategorized") selectedFolderId = null;
  else if (folderParam) selectedFolderId = folderParam;

  const [words, folders, totalWordCount, uncategorizedCount] = await Promise.all([
    prisma.word.findMany({
      where: wordsWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        word: true,
        meaning: true,
        memorized: true,
        folderId: true,
        folder: { select: { id: true, name: true } },
      },
    }),
    prisma.folder.findMany({
      where: { userId },
      include: { _count: { select: { words: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.word.count({ where: { userId } }),
    prisma.word.count({ where: { userId, folderId: null } }),
  ]);

  return (
    <MyPageClient
      initialWords={words}
      initialFolders={folders}
      totalWordCount={totalWordCount}
      uncategorizedCount={uncategorizedCount}
      selectedFolderId={selectedFolderId}
    />
  );
}
