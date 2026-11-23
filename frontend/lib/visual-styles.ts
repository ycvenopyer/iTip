const styleIds = ["classic", "handscroll", "stele", "writing-desk"] as const;
export type VisualStyle = (typeof styleIds)[number];
export { styleIds };

export type StyleArtwork = {
  src: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  source?: { label: string; href: string };
};

type StyleProfile = {
  label: string;
  description: string;
  mode: "light" | "dark";
  accent: "cinnabar" | "bronze" | "jade";
  sidebar: "left" | "right";
  artwork?: StyleArtwork;
};

export const styleProfiles: Record<VisualStyle, StyleProfile> = {
  classic: {
    label: "默认",
    description: "原有的纸墨与朱砂",
    mode: "light",
    accent: "cinnabar",
    sidebar: "left",
  },
  handscroll: {
    label: "展卷",
    description: "行草手卷与题跋",
    mode: "light",
    accent: "cinnabar",
    sidebar: "left",
    artwork: {
      src: "/style-art/mi-fu.jpg",
      width: 1200,
      height: 539,
      alt: "米芾《吴江舟中诗》手卷局部，纸上可见浓淡变化的行草墨迹",
      title: "北宋米芾《吴江舟中诗》局部",
      source: { label: "大都会艺术博物馆", href: "https://www.metmuseum.org/art/collection/search/39919" },
    },
  },
  stele: {
    label: "碑拓",
    description: "墨室夜读与金石拓片",
    mode: "dark",
    accent: "bronze",
    sidebar: "left",
    artwork: {
      src: "/style-art/yan-stele.jpg",
      width: 760,
      height: 1200,
      alt: "《颜氏家庙碑》拓片局部，深底上密集排列着浅色楷书",
      title: "颜真卿《颜氏家庙碑》二十世纪拓片局部",
      source: { label: "大都会艺术博物馆", href: "https://www.metmuseum.org/art/collection/search/64029" },
    },
  },
  "writing-desk": {
    label: "日课",
    description: "青瓷笔洗与田字格",
    mode: "light",
    accent: "jade",
    sidebar: "left",
    artwork: {
      src: "/style-art/jade-desk.jpg",
      width: 1400,
      height: 1050,
      alt: "青瓷笔洗、毛笔和田字格练字纸摆在习字案上",
      title: "青瓷习字案，原创静物图",
    },
  },
};
