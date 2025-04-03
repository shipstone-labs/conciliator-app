import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { appConfig } from "./config.mjs";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: appConfig.themeColor,
};

export const metadata: Metadata = {
  title: appConfig.appName,
  icons: {
    icon: appConfig.icons,
  },
  applicationName: appConfig.appName,
  description: appConfig.description,
  other: appConfig.msapplication,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <html lang="en" className="dark">
        <body className={inter.className}>
          <main className="min-h-screen bg-gradient-to-b from-[#2B5B75] to-background">{children}</main>
        </body>
      </html>
    </TooltipProvider>
  );
}
