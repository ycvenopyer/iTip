"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadStudyImage, readStudyImage, studyError, studyRequest, type StudyGlyph } from "@/lib/study";

const papers = { rice: "#f7edda", white: "#fffdfa", bamboo: "#e5ead9" } as const;
const brushFont = '"Kaiti SC", KaiTi, STKaiti, "Noto Serif CJK SC", serif';
const cell = 78;
const inset = 32;

type Artwork = { src: string; glyph?: StudyGlyph };
type Slot = { char: string; row: number; column: number; artwork?: Artwork };

function canvasLayout(text: string, perLine: number, vertical: boolean) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").flatMap((paragraph) => {
    const chars = [...paragraph];
    return Array.from({ length: Math.max(1, Math.ceil(chars.length / perLine)) }, (_, index) =>
      chars.slice(index * perLine, (index + 1) * perLine));
  });
  const length = Math.max(1, ...lines.map((line) => line.length));
  const slots = lines.flatMap((line, lineIndex) => line.map((char, index) => ({
    char, row: vertical ? index : lineIndex, column: vertical ? lines.length - 1 - lineIndex : index,
  })));
  return { rows: vertical ? length : lines.length, columns: vertical ? lines.length : length, slots };
}

async function drawArtwork(canvas: HTMLCanvasElement, slots: Slot[], rows: number, columns: number,
                           paper: string, signature: string, guides: boolean, active: () => boolean) {
  const images = new Map<string, HTMLImageElement>();
  const sources = [...new Set(slots.flatMap((slot) => slot.artwork ? [slot.artwork.src] : []))];
  await Promise.all(sources.map(async (source) => { images.set(source, await loadStudyImage(source)); }));
  if (!active()) return;
  canvas.width = columns * cell + inset * 2;
  canvas.height = rows * cell + inset * 2 + (signature ? 42 : 0);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器无法预览画布");
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#b48964";
  ctx.strokeRect(inset - 5, inset - 5, columns * cell + 10, rows * cell + 10);
  ctx.font = `54px ${brushFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const { column, row, char, artwork } of slots) {
    const x = inset + column * cell;
    const y = inset + row * cell;
    if (guides) {
      ctx.strokeStyle = "#ba876369";
      ctx.strokeRect(x, y, cell, cell);
    }
    const image = artwork && images.get(artwork.src);
    if (image) {
      const glyph = artwork.glyph;
      const width = glyph?.crop_width ?? image.naturalWidth;
      const height = glyph?.crop_height ?? image.naturalHeight;
      const scale = (cell - 8) / Math.max(width, height);
      ctx.drawImage(image, glyph?.crop_x ?? 0, glyph?.crop_y ?? 0, width, height,
        x + (cell - width * scale) / 2, y + (cell - height * scale) / 2, width * scale, height * scale);
    } else {
      ctx.fillStyle = "#26231e";
      ctx.fillText(char, x + cell / 2, y + cell / 2 + 4, cell - 8);
    }
  }
  if (signature) {
    ctx.fillStyle = "#8a3734";
    ctx.font = `24px ${brushFont}`;
    ctx.textAlign = "right";
    ctx.fillText(signature, canvas.width - inset, canvas.height - inset, canvas.width - inset * 2);
  }
}

function saveCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

export function StudyCanvas({ collage, initial }: { collage: boolean; initial: string }) {
  const [text, setText] = useState(initial || (collage ? "舟" : ""));
  const [perLine, setPerLine] = useState(8);
  const [vertical, setVertical] = useState(!collage);
  const [signature, setSignature] = useState("");
  const [paper, setPaper] = useState<keyof typeof papers>("rice");
  const [guides, setGuides] = useState(collage);
  const [photos, setPhotos] = useState<Record<number, string>>({});
  const [choices, setChoices] = useState<Record<number, string>>({});
  const [lookup, setLookup] = useState<{ key: string; items: StudyGlyph[]; error?: string }>();
  const [imageError, setImageError] = useState("");
  const [drawing, setDrawing] = useState<{ key: object; error?: string }>();
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [slotNumber, setSlotNumber] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const max = collage ? 48 : 180;
  const chars = [...text];
  const valid = !!text.trim() && chars.length <= max;
  const display = collage ? text.replace(/[^\p{Script=Han}]/gu, "") : text;
  const available = collage && chars.length <= max ? [...new Set(display)].join("") : "";
  const items = lookup?.key === available ? lookup.items : undefined;
  const displaySlots = [...display];
  const selectedChar = displaySlots[slotNumber];
  const candidates = items?.filter((item) => item.character === selectedChar || item.aliases.includes(selectedChar)) ?? [];

  useEffect(() => {
    if (!available) return;
    const request = new AbortController();
    void studyRequest<{ items: StudyGlyph[] }>(`glyphs?${new URLSearchParams({ q: available })}`, { signal: request.signal }).then(({ items }) => {
      if (!request.signal.aborted) setLookup({ key: available, items });
    }).catch((error: unknown) => {
      if (!request.signal.aborted) setLookup({ key: available, items: [], error: studyError(error) });
    });
    return () => request.abort();
  }, [available]);

  const paint = useMemo(() => ({ display, perLine, vertical, paper, signature, guides, photos, choices, items }),
    [display, perLine, vertical, paper, signature, guides, photos, choices, items]);

  useEffect(() => {
    const node = canvas.current;
    if (!valid || !node || !display) return;
    let live = true;
    const layout = canvasLayout(paint.display, paint.perLine, paint.vertical);
    const slots = layout.slots.map((slot, index) => {
      if (paint.photos[index]) return { ...slot, artwork: { src: paint.photos[index] } };
      const matches = paint.items?.filter((item) => item.character === slot.char || item.aliases.includes(slot.char));
      const choice = paint.choices[index] ?? "auto";
      const glyph = choice === "auto" ? matches?.[0] : matches?.find((item) => item.id === choice);
      return glyph ? { ...slot, artwork: { src: glyph.image_path, glyph } } : slot;
    });
    void drawArtwork(node, slots, layout.rows, layout.columns, papers[paint.paper], paint.signature, paint.guides, () => live)
      .then(() => { if (live) setDrawing({ key: paint }); })
      .catch((error: unknown) => { if (live) setDrawing({ key: paint, error: studyError(error) }); });
    return () => { live = false; };
  }, [valid, display, paint]);

  async function choosePhoto(file?: File) {
    if (!file) return;
    setReadingPhoto(true);
    setImageError("");
    try {
      const src = await readStudyImage(file);
      await loadStudyImage(src);
      setPhotos((current) => ({ ...current, [slotNumber]: src }));
    } catch (error) {
      setImageError(studyError(error));
    } finally {
      setReadingPhoto(false);
    }
  }

  const used = new Map<string, StudyGlyph>();
  if (collage && items) displaySlots.forEach((char, index) => {
    if (photos[index]) return;
    const options = items.filter((item) => item.character === char || item.aliases.includes(char));
    const choice = choices[index] ?? "auto";
    const glyph = choice === "auto" ? options[0] : options.find((item) => item.id === choice);
    if (glyph) used.set(glyph.source_url, glyph);
  });
  const drawingError = drawing?.key === paint ? drawing.error : "";
  const canExport = valid && !!display && drawing?.key === paint && !drawingError && (!available || !!items);

  return <div className="study-tool">
    <label className="settings-field">{collage ? "要拼成的汉字" : "正文"}
      <textarea rows={collage ? 2 : 5} value={text} disabled={readingPhoto} maxLength={Math.max(max * 2, text.length)}
        onChange={(event) => { setText(event.target.value); setSlotNumber(0); setPhotos({}); setChoices({}); }} />
    </label>
    {chars.length > max && <p role="alert" className="study-error">最多可排 {max} 个字符，请缩短文本。</p>}
    {collage && display !== text && <p className="study-meta">拼图仅使用输入中的汉字，忽略标点和空白。</p>}
    <div className="study-control-grid">
      <label className="settings-field">排列方向
        <select value={String(vertical)} onChange={(event) => setVertical(event.target.value === "true")}>
          <option value="false">横排</option><option value="true">竖排，从右向左</option>
        </select>
      </label>
      <label className="settings-field">{vertical ? "每列字数" : "每行字数"}
        <select value={perLine} onChange={(event) => setPerLine(Number(event.target.value))}>
          {[2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16].map((number) => <option key={number} value={number}>{number}</option>)}
        </select>
      </label>
      <label className="settings-field">纸张
        <select value={paper} onChange={(event) => setPaper(event.target.value as keyof typeof papers)}>
          <option value="rice">素宣</option><option value="white">素白</option><option value="bamboo">豆青</option>
        </select>
      </label>
      <label className="settings-field">落款
        <input maxLength={30} value={signature} onChange={(event) => setSignature(event.target.value)} />
      </label>
    </div>
    <label className="study-check"><input type="checkbox" checked={guides} onChange={(event) => setGuides(event.target.checked)} />显示格线</label>
    {collage && valid && selectedChar && <fieldset className="study-form study-slot">
      <legend>逐字取样</legend>
      <div className="study-control-grid">
        <label className="settings-field">字位
          <select value={slotNumber} disabled={readingPhoto} onChange={(event) => { setSlotNumber(Number(event.target.value)); setImageError(""); }}>
            {displaySlots.map((char, index) => <option value={index} key={index}>{index + 1} · {char}</option>)}
          </select>
        </label>
        <label className="settings-field">字样
          <select value={choices[slotNumber] ?? "auto"} disabled={!!photos[slotNumber]}
            onChange={(event) => setChoices((current) => ({ ...current, [slotNumber]: event.target.value }))}>
            <option value="auto">自动选择</option><option value="font">字体示意</option>
            {candidates.map((glyph) => <option key={glyph.id} value={glyph.id}>{glyph.person} · {glyph.work}</option>)}
          </select>
        </label>
      </div>
      <label className="settings-field">用单字照片替换
        <input key={slotNumber} type="file" accept="image/jpeg,image/png,image/webp" disabled={readingPhoto}
          onChange={(event) => void choosePhoto(event.target.files?.[0])} />
      </label>
      {photos[slotNumber] && <button type="button" className="study-action w-fit" onClick={() => {
        setPhotos((current) => { const next = { ...current }; delete next[slotNumber]; return next; });
      }}>恢复目录字形</button>}
      {imageError && <p role="alert" className="study-error">{imageError}</p>}
      {available && !items && <p role="status" className="study-meta">正在查找馆藏字形…</p>}
      {lookup?.key === available && lookup.error && <p role="alert" className="study-error">{lookup.error}。可使用字体示意或自己的照片。</p>}
      <p className="study-meta">无馆藏样本的字位使用字体示意。上传已裁好的单字照片可替换该字位。</p>
    </fieldset>}
    {valid && display && <div className="study-sheet">
      <canvas ref={canvas} role="img" aria-label={collage ? "集字拼图预览" : "章法排版预览"} />
    </div>}
    {drawingError && <p role="alert" className="study-error">{drawingError}</p>}
    {[...used.values()].map((glyph) => <a key={glyph.id} className="study-source" href={glyph.source_url} target="_blank" rel="noreferrer">{glyph.image_credit}</a>)}
    <button type="button" className="workspace-primary settings-action w-fit" disabled={!canExport} onClick={() => {
      if (canvas.current) saveCanvas(canvas.current, collage ? "集字拼图.png" : "章法排版.png");
    }}>下载 PNG</button>
  </div>;
}
