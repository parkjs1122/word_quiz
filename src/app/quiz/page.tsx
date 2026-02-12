import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFolders } from "@/actions/folders";
import QuizClient from "./client";

export default async function QuizPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const folders = await getFolders();

  return (
    <QuizClient
      folders={folders.map((f) => ({ id: f.id, name: f.name, wordCount: f._count.words }))}
      userId={session.user.id}
    />
  );
}
