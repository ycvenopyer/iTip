import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="zh-Hans">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
