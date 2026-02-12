"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("인증이 필요합니다.");
  }
  return session.user.id;
}

export async function createFolder(name: string) {
  const userId = await getUserId();
  const trimmed = name.trim();

  if (!trimmed) {
    return { error: "폴더 이름을 입력해주세요." };
  }

  const existing = await prisma.folder.findUnique({
    where: { userId_name: { userId, name: trimmed } },
  });

  if (existing) {
    return { error: "이미 같은 이름의 폴더가 있습니다." };
  }

  const folder = await prisma.folder.create({
    data: { name: trimmed, userId },
  });

  return { folder };
}

export async function renameFolder(id: string, name: string) {
  const userId = await getUserId();
  const trimmed = name.trim();

  if (!trimmed) {
    return { error: "폴더 이름을 입력해주세요." };
  }

  const existing = await prisma.folder.findFirst({
    where: { userId, name: trimmed, id: { not: id } },
  });

  if (existing) {
    return { error: "이미 같은 이름의 폴더가 있습니다." };
  }

  await prisma.folder.update({
    where: { id, userId },
    data: { name: trimmed },
  });
}

export async function deleteFolder(id: string) {
  const userId = await getUserId();

  // Words will have folderId set to null via onDelete: SetNull
  await prisma.folder.delete({
    where: { id, userId },
  });
}

export async function getFolders() {
  const userId = await getUserId();

  return prisma.folder.findMany({
    where: { userId },
    include: { _count: { select: { words: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function moveWordsToFolder(
  wordIds: string[],
  folderId: string | null
) {
  const userId = await getUserId();

  if (folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) {
      return { error: "폴더를 찾을 수 없습니다." };
    }
  }

  await prisma.word.updateMany({
    where: { id: { in: wordIds }, userId },
    data: { folderId },
  });
}
