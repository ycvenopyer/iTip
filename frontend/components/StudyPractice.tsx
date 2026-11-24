"use client";

import { useEffect, useRef, useState } from "react";
import { readStudyImage, studyError, studyRequest, type StudyNavigation } from "@/lib/study";

type CountResult = { codepoints: number; nonWhitespace: number; han: number; lines: number };
type TextResult = { text: string; truncated?: boolean };

export function StudyTextTool({ view, navigate }: {
  view: StudyNavigation;
  navigate: (view: StudyNavigation) => void;
}) {
  const ocr = view.tab === "ocr";
  const count = view.tab === "count";
  const [input, setInput] = useState(view.text ?? "");
  const [output, setOutput] = useState("");
  const [image, setImage] = useState("");
  const [direction, setDirection] = useState("t2s");
  const [stats, setStats] = useState<CountResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  function resetResult() {
    setOutput("");
    setStats(undefined);
    setError("");
    setNotice("");
  }

  async function chooseImage(file?: File) {
    setImage("");
    resetResult();
    if (!file) return;
    setBusy(true);
    try {
      setImage(await readStudyImage(file));
    } catch (error) {
      setError(studyError(error));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (request.current) return;
    resetResult();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      const options = { method: "POST", signal: controller.signal, body: JSON.stringify(
        ocr ? { image } : { text: input, direction },
      ) };
      if (count) {
        setStats(await studyRequest<CountResult>("text/count", options));
      } else {
        const result = await studyRequest<TextResult>(ocr ? "ocr" : "text/convert", options);
        setOutput(result.text);
        if (result.truncated) setNotice("识别结果达到输出上限。可将原图分段后分别识别。");
      }
    } catch (error) {
      if (!controller.signal.aborted) setError(studyError(error));
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setNotice("已复制");
    } catch {
      setError("复制失败，可选中文本手动复制。");
    }
  }

  return <div className="study-tool">
    <form className="study-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      {ocr ? <>
        <label className="settings-field">上传书迹照片
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}
            onChange={(event) => void chooseImage(event.target.files?.[0])} />
        </label>
        <p className="study-meta">照片会发送给默认视觉模型。识别结果可编辑。</p>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="study-ocr-preview" src={image} alt="待识别的书迹照片" />
        )}
      </> : <>
        {!count && <label className="settings-field study-inline-field">转换方向
          <select value={direction} disabled={busy} onChange={(event) => { setDirection(event.target.value); resetResult(); }}>
            <option value="t2s">繁体转简体</option><option value="s2t">简体转繁体</option>
          </select>
        </label>}
        <label className="settings-field">文本
          <textarea rows={7} value={input} disabled={busy} maxLength={20000} placeholder={count ? "输入需要统计的文本" : "例如：書法與臨摹"}
            onChange={(event) => { setInput(event.target.value); resetResult(); }} />
        </label>
      </>}
      <button type="submit" className="workspace-primary settings-action w-fit" disabled={busy || (ocr ? !image : !count && !input)}>
        {busy ? "正在处理…" : ocr ? "识别文字" : count ? "统计" : "转换"}
      </button>
    </form>
    {error && <p role="alert" className="study-error">{error}</p>}
    {notice && <p role="status" className="study-meta">{notice}</p>}
    {stats && <dl className="study-counts">
      {[["字符", stats.codepoints], ["非空白字符", stats.nonWhitespace], ["汉字", stats.han], ["行", stats.lines]].map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>}
    {output && <div className="study-form">
      <label className="settings-field">{ocr ? "识别结果" : "转换结果"}
        <textarea value={output} rows={5} onChange={(event) => setOutput(event.target.value)} />
      </label>
      <div className="study-actions">
        <button type="button" className="study-action" onClick={() => void copy()}>复制文本</button>
        <button type="button" className="study-action" onClick={() => navigate({ tab: "layout", text: output })}>用于排版</button>
      </div>
    </div>}
  </div>;
}

type PracticeDay = { date: string; task: string; completed: boolean };
const week = ["一", "二", "三", "四", "五", "六", "日"];

function dateKey(date: Date) {
  return [String(date.getFullYear()).padStart(4, "0"), String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")].join("-");
}

function PracticeEditor({ day, initial, saved, onChange }: {
  day: string;
  initial: string;
  saved?: PracticeDay;
  onChange: (day: string, value?: PracticeDay) => void;
}) {
  const [task, setTask] = useState(initial || saved?.task || "");
  const [completed, setCompleted] = useState(saved?.completed ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(remove = false) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await studyRequest(`calendar/${day}`, {
        method: remove ? "DELETE" : "PUT",
        ...(remove ? {} : { body: JSON.stringify({ task: task.trim(), completed }) }),
      });
      onChange(day, remove ? undefined : { date: day, task: task.trim(), completed });
      if (remove) {
        setTask("");
        setCompleted(false);
      }
      setNotice(remove ? "已移除练习" : "练习计划已保存");
    } catch (error) {
      setError(studyError(error));
    } finally {
      setBusy(false);
    }
  }

  return <form className="study-form study-calendar-editor" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <label className="settings-field">{day} 的练习计划
      <textarea rows={2} value={task} maxLength={200} required disabled={busy} placeholder="例如：临写《书谱》三行"
        onChange={(event) => { setNotice(""); setTask(event.target.value); }} />
    </label>
    <label className="study-check">
      <input type="checkbox" checked={completed} disabled={busy} onChange={(event) => { setNotice(""); setCompleted(event.target.checked); }} />
      已完成练习
    </label>
    <div className="study-actions">
      <button type="submit" className="workspace-primary settings-action" disabled={busy || !task.trim()}>保存计划</button>
      {saved && <button type="button" className="study-action" disabled={busy} onClick={() => void save(true)}>移除</button>}
    </div>
    {error && <p role="alert" className="study-error">{error}</p>}
    {notice && <p role="status" className="study-meta">{notice}</p>}
  </form>;
}

export function StudyCalendar({ initial }: { initial: string }) {
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => dateKey(today));
  const [initialPlan, setInitialPlan] = useState(initial);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ month: string; items?: PracticeDay[]; error?: string }>();
  const key = dateKey(month).slice(0, 7);
  const data = result?.month === key ? result : undefined;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;

  useEffect(() => {
    const request = new AbortController();
    void studyRequest<{ items: PracticeDay[] }>(`calendar?month=${key}`, { signal: request.signal }).then(({ items }) => {
      if (!request.signal.aborted) setResult({ month: key, items });
    }).catch((error: unknown) => {
      if (!request.signal.aborted) setResult({ month: key, error: studyError(error) });
    });
    return () => request.abort();
  }, [key, refresh]);

  function shift(amount: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + amount, 1);
    setMonth(next);
    setSelected(dateKey(next));
  }

  function update(day: string, value?: PracticeDay) {
    setInitialPlan("");
    setResult((current) => {
      if (current?.month !== key || !current.items) return current;
      const items = current.items.filter((item) => item.date !== day);
      if (value) items.push(value);
      return { month: key, items };
    });
  }

  return <div className="study-tool">
    <div className="study-calendar-head">
      <button type="button" className="study-action" onClick={() => shift(-1)} aria-label="上个月">‹</button>
      <strong>{month.getFullYear()} 年 {month.getMonth() + 1} 月</strong>
      <button type="button" className="study-action" onClick={() => shift(1)} aria-label="下个月">›</button>
    </div>
    <div className="study-calendar-grid" aria-label="练习日历">
      {week.map((day) => <span key={day} className="study-weekday">{day}</span>)}
      {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
      {Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        const full = `${key}-${String(day).padStart(2, "0")}`;
        const entry = data?.items?.find((item) => item.date === full);
        const status = entry ? entry.completed ? "已完成" : "有计划" : "";
        return <button key={full} type="button" aria-pressed={selected === full}
          aria-current={dateKey(today) === full ? "date" : undefined} aria-label={`${full} ${status}`}
          onClick={() => setSelected(full)}>
          {day}{status && <i aria-hidden="true" data-done={entry?.completed} />}
        </button>;
      })}
    </div>
    {!data && <p role="status" className="study-meta">正在载入日历…</p>}
    {data?.error && <div className="study-actions">
      <p role="alert" className="study-error">{data.error}</p>
      <button type="button" className="study-action" onClick={() => setRefresh((current) => current + 1)}>重试</button>
    </div>}
    {data?.items && <PracticeEditor key={selected} day={selected} initial={initialPlan} saved={data.items.find((item) => item.date === selected)}
      onChange={update} />}
  </div>;
}
