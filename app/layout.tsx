import type { Metadata } from"next";
import { Quicksand } from"next/font/google";
import"./globals.css";
import { SessionProvider } from"@/components/auth/SessionProvider";
import { ThemeProvider } from"@/components/ui/ThemeProvider";
import { APP_NAME, APP_DESCRIPTION } from"@/lib/config";
import Header from"@/components/ui/Header";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

const quicksand = Quicksand({
  variable:"--font-quicksand",
  subsets: ["latin"],
  weight: ["300","400","500","600","700"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

function isExpectedDynamicUsageError(error: unknown) {
  return error instanceof Error && (
    error.message.includes('Dynamic server usage') ||
    (typeof (error as { digest?: string }).digest === 'string' && (error as { digest?: string }).digest === 'DYNAMIC_SERVER_USAGE')
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;

  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    if (!isExpectedDynamicUsageError(error)) {
      console.error('Failed to hydrate server session:', error);
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} antialiased`}
      >
        <ThemeProvider>
          <SessionProvider session={session}>
            <Header />
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
