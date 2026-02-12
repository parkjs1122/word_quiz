import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getQuizWords } from "@/actions/quiz";
import QuizClient from "./client";

export default async function QuizPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const words = await getQuizWords();

  return <QuizClient initialWords={words} userId={session.user.id} />;
}
