import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InstaFame - Social Profile Viewer",
  description: "View exact UI replicas of Instagram and Facebook profiles in Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
