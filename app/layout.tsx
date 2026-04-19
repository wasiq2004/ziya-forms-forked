import type { Metadata } from"next";
import { Quicksand } from"next/font/google";
import"./globals.css";
import { SessionProvider } from"@/components/auth/SessionProvider";
import { ThemeProvider } from"@/components/ui/ThemeProvider";
import { APP_NAME, APP_DESCRIPTION } from"@/lib/config";
import Header from"@/components/ui/Header";

const quicksand = Quicksand({
  variable:"--font-quicksand",
  subsets: ["latin"],
  weight: ["300","400","500","600","700"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} antialiased`}
      >
        <ThemeProvider>
          <SessionProvider>
            <Header />
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
