import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/common/Providers";
import Navbar from "@/components/common/Navbar";
import ToastContainer from "@/components/common/Toast";

export const metadata: Metadata = {
  title: "Word Quiz",
  description: "단어 퀴즈 학습 애플리케이션",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Word Quiz",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
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
          <ToastContainer />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
