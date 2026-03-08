import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "QuickCart — Find the Cheapest Grocery Delivery Instantly",
  description:
    "Compare grocery prices across Zepto, Blinkit and Bigbasket in seconds. AI-powered search, real-time cart comparison, and one-tap checkout.",
  keywords: ["quick commerce", "grocery comparison", "Zepto", "Blinkit", "Bigbasket", "cheapest delivery"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-gray-950 text-white antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
