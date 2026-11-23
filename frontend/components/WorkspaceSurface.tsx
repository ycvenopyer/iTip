"use client";

import type { CSSProperties, ReactNode } from "react";
import { useAppearance } from "@/lib/appearance";

export function WorkspaceSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  const appearance = useAppearance();
  return (
    <div
      className={`workspace ${className}`}
      data-mode={appearance.mode}
      data-accent={appearance.accent}
      data-font={appearance.font}
      data-radius={appearance.radius}
      data-sidebar={appearance.sidebar}
      data-width={appearance.width}
      style={{ "--reading-size": `${appearance.textSize}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}
