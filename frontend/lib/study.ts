export type CatalogItem = {
  id: string;
  title: string;
  summary?: string;
  era?: string;
  source_url: string;
  saved?: boolean;
  kind?: "people" | "works";
  styles?: string[];
  person?: string;
  script?: string;
  edition?: string;
  practice?: string;
  image_path?: string;
  image_credit?: string;
  reading?: string;
  radical?: string;
  strokes?: number;
  example?: string;
  author?: string;
  genre?: string;
  content?: string;
};

export type StudyGlyph = {
  id: string;
  character: string;
  aliases: string[];
  work: string;
  script: string;
  person: string;
  image_path: string;
  image_credit: string;
  source_url: string;
  crop_x: number;
  crop_y: number;
  crop_width: number;
  crop_height: number;
};

export type StudyNavigation = {
  tab: string;
  text?: string;
  person?: string;
};

export async function studyRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/study/${path}`, {
    cache: "no-store",
    ...options,
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.error || "暂时无法打开工作台，请重试");
  return result as T;
}

export function studyError(error: unknown) {
  return error instanceof Error ? error.message : "工作台操作失败，请重试";
}

export function readStudyImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    return Promise.reject(new Error("请选择不超过 2 MiB 的 JPEG、PNG 或 WebP 图片"));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("无法读取图片"));
    reader.readAsDataURL(file);
  });
}

export function loadStudyImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法打开图像"));
    image.src = src;
  });
}
