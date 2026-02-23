"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";

export async function requestPasswordReset(email: string) {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return { error: "이메일을 입력해주세요." };
  }

  const user = await prisma.user.findUnique({
    where: { email: trimmedEmail },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true };
  }

  // Delete existing tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email: trimmedEmail },
  });

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      email: trimmedEmail,
      token,
      expiresAt,
    },
  });

  // In production, send email here (e.g., via Resend, SendGrid)
  // For now, log the reset link
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  console.log(`[Password Reset] ${trimmedEmail}: ${resetUrl}`);

  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) {
    return { error: "잘못된 요청입니다." };
  }

  if (newPassword.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { error: "유효하지 않은 토큰입니다." };
  }

  if (new Date() > resetToken.expiresAt) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    return { error: "토큰이 만료되었습니다. 다시 요청해주세요." };
  }

  const passwordHash = await hash(newPassword, 12);

  await prisma.user.update({
    where: { email: resetToken.email },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

  return { success: true };
}
