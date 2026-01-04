import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Fixed import
import "./globals.css";
import Providers from "@/components/providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Incubator Dashboard",
  description: "IoT Fleet Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
