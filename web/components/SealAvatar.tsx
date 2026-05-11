"use client";

import { useState } from "react";

type SealAvatarProps = {
  text: string;
  size?: "sm" | "md" | "lg";
  variant?: "cinnabar" | "bamboo" | "ink";
  className?: string;
};

const sizeMap = {
  sm: { container: "h-8 w-8", text: "text-xs", border: "border" },
  md: { container: "h-10 w-10", text: "text-sm", border: "border-2" },
  lg: { container: "h-12 w-12", text: "text-base", border: "border-2" },
};

const variantMap = {
  cinnabar: {
    outer: "border-[#9a2c2c]",
    inner: "border-[#b83e3e]/50",
    bg: "bg-[#fdf6f6]",
    text: "text-[#9a2c2c]",
  },
  bamboo: {
    outer: "border-[#4f6a42]",
    inner: "border-[#6b8e5a]/50",
    bg: "bg-[#f6faf4]",
    text: "text-[#3d5236]",
  },
  ink: {
    outer: "border-[#524b41]",
    inner: "border-[#6a6255]/50",
    bg: "bg-[#f4f0e8]",
    text: "text-[#2a2621]",
  },
};

export function SealAvatar({
  text,
  size = "md",
  variant = "cinnabar",
  className = "",
}: SealAvatarProps) {
  const [stamped, setStamped] = useState(false);
  const sizeConfig = sizeMap[size];
  const variantConfig = variantMap[variant];

  // 取第一个字符或最多两个字符
  const displayText = text.slice(0, 2);

  return (
    <div
      className={`
        ${sizeConfig.container}
        ${variantConfig.bg}
        ${variantConfig.outer}
        ${sizeConfig.border}
        relative flex items-center justify-center rounded-sm
        font-display font-bold tracking-wider
        select-none cursor-pointer
        transition-transform active:scale-95
        ${stamped ? "seal-stamp-animate" : ""}
        ${className}
      `}
      onClick={() => {
        setStamped(false);
        setTimeout(() => setStamped(true), 10);
      }}
      title={`${text}`}
    >
      {/* 内边框 - 印章风格 */}
      <div
        className={`
          absolute inset-0.5 rounded-sm
          ${variantConfig.inner}
          border
        `}
      />
      {/* 文字 */}
      <span
        className={`
          ${sizeConfig.text}
          ${variantConfig.text}
          relative z-10 leading-none
          font-display
        `}
      >
        {displayText}
      </span>
      {/* 墨点装饰 */}
      <div className="absolute -right-0.5 -top-0.5 h-1 w-1 rounded-full bg-current opacity-30" />
      <div className="absolute -bottom-0.5 -left-0.5 h-0.5 w-0.5 rounded-full bg-current opacity-20" />
    </div>
  );
}

// 简化版头像 - 用于消息列表
export function MessageAvatar({
  role,
  className = "",
}: {
  role: "user" | "assistant" | "system";
  className?: string;
}) {
  if (role === "user") {
    return (
      <SealAvatar
        text="我"
        size="md"
        variant="bamboo"
        className={className}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <SealAvatar text="iTip" size="md" variant="cinnabar" />
      {/* AI 小标识 */}
      <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-paper-50 text-[8px] text-ink-500 border border-ink-200">
        AI
      </div>
    </div>
  );
}

// 书法风格标题印章
export function TitleSeal({
  title,
  subtitle,
  className = "",
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative">
        <SealAvatar text={title} size="lg" variant="cinnabar" />
        {subtitle && (
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 writing-vertical text-xs text-ink-400 tracking-widest">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
