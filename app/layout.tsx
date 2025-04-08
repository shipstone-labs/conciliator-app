import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { appConfig } from "./config.mjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Footer } from "@/components/Footer";
import AuthLayout from "./authLayout";
import NavigationHeader from "@/components/NavigationHeader";
import { AuthButton } from "@/components/AuthButton";

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
          <div className="flex flex-col min-h-screen">
            <AuthLayout>
              <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 h-16 flex items-center px-4">
                <NavigationHeader />
                {/* Auth button positioned absolutely to overlay the header */}
                <div className="absolute top-0 right-4 h-16 flex items-center">
                  <AuthButton 
                    text="Sign In / Register" 
                    className="bg-primary hover:bg-primary/80 text-black font-medium rounded-md shadow-md" 
                  />
                </div>
              </header>
              <main className="flex-grow bg-gradient-to-b from-[#2B5B75] to-background">
                {children}
              </main>
            </AuthLayout>
            <Footer />
          </div>
        </body>
      </html>
    </TooltipProvider>
  );
}
