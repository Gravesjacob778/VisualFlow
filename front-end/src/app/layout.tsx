import type { Metadata } from "next";

import "@/app/globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "VisualFlow - Workflow Editor",
  description: "Visual workflow automation editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
