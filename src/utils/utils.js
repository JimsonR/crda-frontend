export const CHAT_SUGGESTIONS = [
  "Summarize latest docs",
  "Show related files",
  "Draft an email",
];

const fmtTime = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const fmtDateYMD = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const fmtMonthDay = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "2-digit",
});

export const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - Number(n || 0));
  return d;
};

export const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function isYesterday(d, now = new Date()) {
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  return isSameDay(d, y);
}

export const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
export const formatTime = (d) => fmtTime.format(d);
export const formatDate = (d) => fmtDateYMD.format(d);

export function messageLabel(d, now = new Date()) {
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return "Just now";
  if (isSameDay(d, now)) return formatTime(d);
  if (isYesterday(d, now)) return "Yesterday";
  return formatDate(d);
}

export function headerLabel(d, now = new Date()) {
  if (isSameDay(d, now)) return "Today";
  if (isYesterday(d, now)) return "Yesterday";
  return formatDate(d);
}

export const parseDate = (s) => new Date(s);

export function scrollbar(theme, color) {
  const alpha = (clr, a) =>
    `rgba(${parseInt(clr.slice(1, 3), 16)}, ${parseInt(
      clr.slice(3, 5),
      16
    )}, ${parseInt(clr.slice(5, 7), 16)}, ${a})`;
  return {
    scrollbarWidth: "thin",
    scrollbarColor: `${alpha(color, 0.7)} ${
      theme.palette.mode === "dark" ? "#0F1520" : "#E5E7EB"
    }`,
    "&::-webkit-scrollbar": { width: 10, height: 10 },
    "&::-webkit-scrollbar-track": {
      background: theme.palette.mode === "dark" ? "#0F1520" : "#F1F5F9",
      borderRadius: 8,
    },
    "&::-webkit-scrollbar-thumb": {
      background: alpha(color, 0.6),
      borderRadius: 8,
      border: `2px solid ${
        theme.palette.mode === "dark" ? "#0B0F14" : "#FFFFFF"
      }`,
    },
    "&::-webkit-scrollbar-thumb:hover": { background: alpha(color, 0.9) },
  };
}

export function formatListDate(input) {
  const d = new Date(input);
  if (!(d instanceof Date) || isNaN(d)) return "";
  const now = new Date();
  if (isSameDay(d, now)) return "Today";
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (isSameDay(d, yest)) return "Yesterday";
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear ? fmtMonthDay.format(d) : fmtDateYMD.format(d);
}

export const nowIso = () => new Date().toISOString();

export function makeUUID() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const getBytes = () => {
    if (globalThis.crypto?.getRandomValues) {
      const b = new Uint8Array(16);
      globalThis.crypto.getRandomValues(b);
      return b;
    }
    try {
      return require("crypto").randomBytes(16);
    } catch {
      throw new Error("No secure random source available");
    }
  };
  const bytes = getBytes();
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function summarizeMarkdown(md) {
  if (!md) return "";

  // Keep code content but remove fences
  let s = md.replace(/```([\s\S]*?)```/g, (_, code) => code.trim());

  // Convert list markers to bullets so they’re readable in one line
  s = s
    .replace(/^#{1,6}\s+/gm, "") // drop headings
    .replace(/^\s*[-*]\s+/gm, "• ") // bullets
    .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + " "); // "1. " stays as "1. "

  // Strip most remaining markdown syntax (bold/italic/links/images)
  s = s
    .replace(/!\[[^\]]*]\([^)]+\)/g, "") // images
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1") // links -> text
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1") // *em*/**strong**
    .replace(/`([^`]+)`/g, "$1"); // inline code

  // Collapse newlines/extra spaces; turn paragraph breaks into separators
  s = s
    .replace(/\n{2,}/g, " · ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}
