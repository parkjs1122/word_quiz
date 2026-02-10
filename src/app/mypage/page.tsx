import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyPageClient from "./client";

export default async function MyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const words = await prisma.word.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, word: true, meaning: true, memorized: true },
  });

  return <MyPageClient initialWords={words} />;
}
