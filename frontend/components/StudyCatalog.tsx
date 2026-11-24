"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { WorkspaceIcon } from "@/components/WorkspaceIcon";
import { loadStudyImage, studyError, studyRequest, type CatalogItem, type StudyGlyph, type StudyNavigation } from "@/lib/study";

type Props = {
  view: StudyNavigation;
  navigate: (view: StudyNavigation) => void;
};

type CatalogResponse = { items: CatalogItem[]; glyphs?: StudyGlyph[] };

const dictionaryHints: Record<string, string> = {
  calligraphy: "永、舟、東",
  character: "永、汉、书",
  word: "临摹、章法",
  seal: "朱文、白文",
  idiom: "入木三分、画龙点睛",
};

export function StudyGlyphPreview({ glyph }: { glyph: StudyGlyph }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void loadStudyImage(glyph.image_path).then((image) => {
      const context = live ? canvas.current?.getContext("2d") : null;
      context?.drawImage(image, glyph.crop_x, glyph.crop_y, glyph.crop_width, glyph.crop_height,
        0, 0, glyph.crop_width, glyph.crop_height);
    }).catch(() => {});
    return () => { live = false; };
  }, [glyph]);
  return <canvas ref={canvas} width={glyph.crop_width} height={glyph.crop_height}
    role="img" aria-label={`${glyph.person}《${glyph.work}》中的${glyph.character}字`} />;
}

function Source({ url, label = "查看来源" }: { url: string; label?: string }) {
  return <a className="study-source" href={url} target="_blank" rel="noreferrer">
    {label}<WorkspaceIcon name="diagonal" className="size-3" />
  </a>;
}

export function StudyCatalog({ view, navigate }: Props) {
  const { tab, person } = view;
  const dictionary = tab in dictionaryHints;
  const practice = tab === "select";
  const favorites = tab === "favorites";
  const poems = tab === "poems";
  const [input, setInput] = useState(view.text ?? "");
  const [term, setTerm] = useState(view.text ?? "");
  const [genre, setGenre] = useState("");
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: CatalogResponse; error?: string }>();
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState("");

  const params = new URLSearchParams({ q: term });
  if (person) params.set("person", person);
  if (genre) params.set("genre", genre);
  const endpoint = dictionary ? `dictionary/${tab}` : practice ? "works" : tab;
  const path = `${endpoint}?${params}`;
  const key = `${path}:${revision}`;
  const state = result?.key === key ? result : undefined;

  useEffect(() => {
    const request = new AbortController();
    void studyRequest<CatalogResponse>(path, { signal: request.signal }).then((data) => {
      if (!request.signal.aborted) setResult({ key, data });
    }).catch((error: unknown) => {
      if (!request.signal.aborted) setResult({ key, error: studyError(error) });
    });
    return () => request.abort();
  }, [path, key]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTerm(input.trim());
    setRevision((current) => current + 1);
  }

  async function toggleFavorite(item: CatalogItem) {
    const kind = item.kind ?? (tab === "people" ? "people" : "works");
    setSaving(item.id);
    setActionError("");
    try {
      await studyRequest(`favorites/${kind}/${encodeURIComponent(item.id)}`, {
        method: favorites || item.saved ? "DELETE" : "PUT",
      });
      setResult((current) => {
        if (!current?.data) return current;
        const items = favorites
          ? current.data.items.filter((entry) => entry.id !== item.id || entry.kind !== kind)
          : current.data.items.map((entry) => entry.id === item.id ? { ...entry, saved: !item.saved } : entry);
        return { ...current, data: { ...current.data, items } };
      });
    } catch (error) {
      setActionError(studyError(error));
    } finally {
      setSaving("");
    }
  }

  const hint = dictionary ? dictionaryHints[tab] : poems ? "诗题、作者或诗句" : tab === "people" ? "书家、字号、朝代" : "作品、书家或书体";
  return (
    <div className="study-tool" aria-busy={!state}>
      {!favorites && <form className="study-search" onSubmit={search}>
        <label className="settings-field">
          <span className="sr-only">检索</span>
          <input aria-label="检索" placeholder={hint} value={input} maxLength={80}
            onChange={(event) => setInput(event.target.value)} />
        </label>
        <button type="submit" className="workspace-primary settings-action" aria-label="搜索">
          <WorkspaceIcon name="search" className="size-4" />搜索
        </button>
      </form>}
      {poems && <label className="settings-field study-inline-field">体裁
        <select value={genre} onChange={(event) => setGenre(event.target.value)}>
          <option value="">全部</option><option>唐诗</option><option>宋词</option>
        </select>
      </label>}
      {person && <button type="button" className="study-action w-fit" onClick={() => navigate({ tab })}>查看所有作品</button>}
      {!state && <p role="status" className="study-empty">正在载入…</p>}
      {(state?.error || actionError) && <p role="alert" className="study-error">{state?.error || actionError}</p>}
      {state?.error && <button type="button" className="study-action w-fit" onClick={() => setRevision((current) => current + 1)}>重试</button>}
      {state?.data && !state.data.items.length && !state.data.glyphs?.length &&
        <p className="study-empty">{favorites ? "收藏的书家和作品会出现在这里。" : "未找到匹配条目。可尝试其他写法或更短的关键词。"}</p>}
      {state?.data?.glyphs?.map((glyph) => (
        <article className="study-record study-glyph-record" key={glyph.id}>
          <StudyGlyphPreview glyph={glyph} />
          <div>
            <h4>{glyph.character} · {glyph.script}</h4>
            <p>{glyph.person}《{glyph.work}》局部</p>
            <Source url={glyph.source_url} />
            <button type="button" className="study-action" onClick={() => navigate({ tab: "collage", text: glyph.character })}>用于集字</button>
          </div>
        </article>
      ))}
      {state?.data?.items.map((item) => (
        <article className="study-record" key={`${item.kind ?? tab}-${item.id}`}>
          {item.image_path && <figure className="study-work-image">
            {/* Catalog images are vetted, same-origin files. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_path} alt={item.image_credit || item.title} loading="lazy" />
            <figcaption>{item.image_credit}</figcaption>
          </figure>}
          <div className="study-record-heading">
            <h4>{item.title}</h4>
            {(!dictionary && !poems) && <button type="button" className="study-action study-save" disabled={!!saving}
              aria-pressed={!!item.saved || favorites} onClick={() => void toggleFavorite(item)}>
              {favorites ? "移除收藏" : item.saved ? "已收藏" : "收藏"}
            </button>}
          </div>
          {(item.person || item.era || item.author || item.reading || item.radical || item.kind) && (
            <p className="study-meta">{[item.person, item.era, item.script, item.edition, item.styles?.join("、"),
              item.author, item.genre, item.reading, item.radical && `部首 ${item.radical}`,
              item.strokes && `${item.strokes} 画`].filter(Boolean).join(" · ")}</p>
          )}
          {item.summary && <p>{item.summary}</p>}
          {item.example && <p className="study-meta">{item.example}</p>}
          {item.practice && <p className="study-practice-note"><strong>临摹提示</strong>{item.practice}</p>}
          {item.content && <p className="study-poem">{item.content}</p>}
          <div className="study-actions">
            <Source url={item.source_url} label={item.content ? "查看底本" : undefined} />
            {tab === "people" && <button type="button" className="study-action" onClick={() => navigate({ tab: "works", person: item.id })}>相关作品</button>}
            {practice && <button type="button" className="study-action" onClick={() => navigate({ tab: "calendar", text: `临摹《${item.title}》` })}>加入练习计划</button>}
            {item.content && <button type="button" className="study-action" onClick={() => navigate({ tab: "layout", text: item.content })}>用于排版</button>}
          </div>
        </article>
      ))}
    </div>
  );
}
