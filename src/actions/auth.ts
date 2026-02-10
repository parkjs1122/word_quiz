"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

interface SignUpResult {
  error?: string;
}

export async function signUp(formData: FormData): Promise<SignUpResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해주세요." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "올바른 이메일 형식을 입력해주세요." };
  }

  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "이미 사용 중인 이메일입니다." };
    }

    const passwordHash = await hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    return {};
  } catch (e) {
    console.error("회원가입 오류:", e);
    return { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
