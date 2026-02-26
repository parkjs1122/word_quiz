"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { OfflineProvider } from "@/lib/offline/context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <OfflineProvider>{children}</OfflineProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
