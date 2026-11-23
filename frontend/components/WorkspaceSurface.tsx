"use client";

import type { CSSProperties, ReactNode } from "react";
import { useAppearance } from "@/lib/appearance";
import { styleProfiles } from "@/lib/visual-styles";

export function WorkspaceSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  const appearance = useAppearance();
  const profile = styleProfiles[appearance.style];
  return (
    <div
      className={`workspace ${className}`}
      data-style={appearance.style}
      data-mode={appearance.mode === "style" ? profile.mode : appearance.mode}
      data-accent={appearance.accent === "style" ? profile.accent : appearance.accent}
      data-font={appearance.font}
      data-radius={appearance.radius}
      data-sidebar={appearance.sidebar === "style" ? profile.sidebar : appearance.sidebar}
      data-width={appearance.width}
      style={{ "--reading-size": `${appearance.textSize}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}
