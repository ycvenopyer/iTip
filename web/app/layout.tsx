import type { Metadata } from "next";
import { Noto_Serif_SC, ZCOOL_XiaoWei } from "next/font/google";
import "./globals.css";

const bodySerif = Noto_Serif_SC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const display = ZCOOL_XiaoWei({
  variable: "--font-brush",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "iTip — 书法助手",
  description: "面向硬笔、软笔与兼修的书法对话助手。本地可部署。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hans" className={`${bodySerif.variable} ${display.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
