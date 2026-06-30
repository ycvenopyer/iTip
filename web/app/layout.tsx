import type { Metadata } from "next";
import "./globals.css";

const title = "iTip - 书法助手";
const description =
  "面向硬笔、软笔与兼修者的书法对话助手。以笔砚为伴，探书法之趣。支持本地私有部署。";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://itip.example.com"),
  title: {
    template: "%s | iTip",
    default: title,
  },
  description,
  keywords: ["书法", "硬笔", "软笔", "毛笔", "兼修", "练字", "书论", "AI助手", "iTip"],
  authors: [{ name: "iTip" }],
  creator: "iTip",
  publisher: "iTip",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "iTip",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/icon-192.svg",
  },
  manifest: "/manifest.json",
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
