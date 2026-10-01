import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EvalCraft · LLM 评测学习实验室",
  description: "从评测闭环、Judge 校准到 Agent 轨迹的交互式学习路线。",
  openGraph: {
    title: "EvalCraft · LLM 评测学习实验室",
    description: "从会测模型，到能守住质量。",
    images: [{ url: "/og.png", width: 1733, height: 907, alt: "EvalCraft LLM 评测学习实验室" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EvalCraft · LLM 评测学习实验室",
    description: "从会测模型，到能守住质量。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
