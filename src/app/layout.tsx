import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LAYA — Architectural Workspace",
  description:
    "A high-performance web application for architectural professionals. Navigate, style, and present complex CAD floor plans with precision.",
  keywords: ["architecture", "CAD", "floor plan", "presentation", "design"],
  authors: [{ name: "LAYA" }],
  openGraph: {
    title: "LAYA — Architectural Workspace",
    description: "Professional architectural presentation and rendering platform.",
    type: "website",
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
