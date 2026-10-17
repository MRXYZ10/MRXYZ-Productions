import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Manrope } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FloatingAiAssistant } from "@/components/ui/glowing-ai-chat-assistant";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Manrope({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["italic", "normal"], variable: "--font-serif", display: "swap" });

export const viewport: Viewport = {
  themeColor: "#070609",
  colorScheme: "dark",
  viewportFit: "cover",
};

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
      className={`h-full antialiased ${display.variable} ${body.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body className="cinema-app min-h-full flex flex-col bg-background text-foreground">
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



