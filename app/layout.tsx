import type { Metadata } from "next";
//import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import { ReactQueryProvider } from "@/contexts/ReactQueryContext";
import { Toaster } from "@/components/ui/toaster";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Travel Chat",
  description: "The travel planner you've always wanted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      //className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ReactQueryProvider>
            <SupabaseProvider>{children}</SupabaseProvider>
          </ReactQueryProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
