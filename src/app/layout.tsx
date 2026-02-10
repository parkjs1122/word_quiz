import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/common/Providers";
import Navbar from "@/components/common/Navbar";

export const metadata: Metadata = {
  title: "Word Quiz",
  description: "단어 퀴즈 학습 애플리케이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
