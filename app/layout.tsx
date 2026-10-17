import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FloatingAiAssistant } from "@/components/ui/glowing-ai-chat-assistant";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MRXYZ Productions — Discover Your Next Obsession",
  description:
    "A cinematic universe for discovering your next favorite film. Explore, find hidden gems, and let your mood lead the way.",
  keywords: ["movies", "recommendations", "AI", "cinema", "film", "streaming"],
  icons: {
    icon: "/favicon.ico",
    apple: "/mrxyz-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TooltipProvider delay={300}>
              {children}
              <FloatingAiAssistant />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}



