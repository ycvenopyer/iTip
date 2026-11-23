const paths = {
  panel: "M9 4v16m6-10 3 2-3 2M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z",
  plus: "M12 5v14M5 12h14",
  search: "m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  folder: "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z",
  folderPlus: "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm9 2.5v6m-3-3h6",
  chevron: "m9 5 7 7-7 7",
  sparkle: "M12 2v3m0 14v3m-8-2 2-2M20 4l-2 2M2 12h3m14 0h3M12 6c.7 3 3 5.3 6 6-3 .7-5.3 3-6 6-.7-3-3-5.3-6-6 3-.7 5.3-3 6-6Z",
  chat: "M21 11.5a8.4 8.4 0 0 1-8.5 8.3c-1.3 0-2.5-.2-3.5-.7L4 20l1.2-4A8 8 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0ZM8 10h9m-9 4h6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  close: "m6 6 12 12M18 6 6 18",
  settings: "M4 7h16M4 17h16M8 4v6m8 4v6",
  model: "M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 4h6v6H9zM9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-3-13a3 3 0 1 1 4.4 2.65c-1.4.75-1.4 1.85-1.4 2.35m0 3h.01",
  appearance: "M12 5a7 7 0 1 0 7 7h-7V5Zm3-2v6h6a7 7 0 0 0-6-6Z",
  account: "M5 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  pin: "M16 3H8m5 13v5m-4-5h8v-2l-2-3V3m-6 0v8l-2 3v2h2Z",
  diagonal: "M7 17 17 7M8 7h9v9",
  book: "M12 5C9 3 6 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15",
  pen: "m14 6 4 4M4 20l4-1 12-12-4-4L4 15l-1 6 1-1Z",
  grid: "M4 4h16v16H4zM4 12h16M12 4v16",
  practice: "M4 6h16M4 12h16M4 18h9m4-2 2 2 3-4",
} as const;

export function WorkspaceIcon({ name, className }: { name: keyof typeof paths; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === "more" ? 3 : 1.65} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
