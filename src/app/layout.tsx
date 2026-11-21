import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import { NotificationWatcher } from "@/components/NotificationWatcher";

export const metadata: Metadata = {
  title: "HireTrack | Modern ATS",
  description: "Applicant pipeline with scorecards and interview scheduling.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const fontSize = localStorage.getItem('hiretrack-font-size') || 'medium';
                const density = localStorage.getItem('hiretrack-density') || 'comfortable';
                document.documentElement.setAttribute('data-font-size', fontSize);
                document.documentElement.setAttribute('data-density', density);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="font-sans min-h-screen bg-background text-foreground transition-colors duration-250">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            {children}
            <NotificationWatcher />
          </SessionProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}