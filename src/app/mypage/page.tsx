import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyPageClient from "./client";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [words, folders, uncategorizedCount] = await Promise.all([
    prisma.word.findMany({
      where: { userId },
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
    prisma.word.count({ where: { userId, folderId: null } }),
  ]);

  return (
    <MyPageClient
      initialWords={words}
      initialFolders={folders}
      uncategorizedCount={uncategorizedCount}
    />
  );
}
