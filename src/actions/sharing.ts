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

export async function createShareLink(folderId: string) {
  const userId = await getUserId();

  // Verify folder belongs to user
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
  });
  if (!folder) {
    return { error: "폴더를 찾을 수 없습니다." };
  }

  // Upsert shared folder
  const shared = await prisma.sharedFolder.upsert({
    where: { folderId },
    create: { folderId, userId },
    update: {},
  });

  return { token: shared.token };
}

export async function getSharedFolder(token: string) {
  const shared = await prisma.sharedFolder.findUnique({
    where: { token },
    include: {
      folder: {
        include: {
          words: {
            select: { id: true, word: true, meaning: true },
            orderBy: { createdAt: "desc" },
          },
          user: { select: { email: true } },
        },
      },
    },
  });

  if (!shared) return null;

  return {
    folderName: shared.folder.name,
    ownerEmail: shared.folder.user.email,
    words: shared.folder.words,
    wordCount: shared.folder.words.length,
  };
}

export async function importSharedFolder(token: string) {
  const userId = await getUserId();

  const shared = await prisma.sharedFolder.findUnique({
    where: { token },
    include: {
      folder: {
        include: {
          words: { select: { word: true, meaning: true } },
        },
      },
    },
  });

  if (!shared) {
    return { error: "공유 링크를 찾을 수 없습니다." };
  }

  // Create a new folder with unique name
  let folderName = shared.folder.name;
  const existingFolder = await prisma.folder.findFirst({
    where: { userId, name: folderName },
  });
  if (existingFolder) {
    folderName = `${folderName} (공유)`;
    // If still exists, add timestamp
    const stillExists = await prisma.folder.findFirst({
      where: { userId, name: folderName },
    });
    if (stillExists) {
      folderName = `${shared.folder.name} (${Date.now()})`;
    }
  }

  const newFolder = await prisma.folder.create({
    data: { name: folderName, userId },
  });

  // Copy words
  if (shared.folder.words.length > 0) {
    await prisma.word.createMany({
      data: shared.folder.words.map((w) => ({
        word: w.word,
        meaning: w.meaning,
        memorized: false,
        userId,
        folderId: newFolder.id,
      })),
    });
  }

  return { folderName, wordCount: shared.folder.words.length };
}
