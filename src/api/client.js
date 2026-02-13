import { nowIso } from "../utils/utils";

// const API_BASE = "http://localhost:8000/api";
// const API_BASE = "http://13.203.157.105:8000";
const API_BASE = "https://luphbes5bzwn2avibfhyq7ng7a0iqjuj.lambda-url.eu-north-1.on.aws/api";

function toError(res, path) {
  const err = new Error(`${path} failed: ${res.status}`);
  err.status = res.status;
  return err;
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function normalizePath(path = "") {
  // collapse accidental double slashes but leave query string intact
  return path.replace(/([^:])\/\/+/, "$1/");
}

async function _fetch(path, options = {}, { timeoutMs = 60000 } = {}) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const normalizedPath = normalizePath(path);
    const res = await fetch(`${API_BASE}${normalizedPath}`, {
      cache: "no-store",
      ...options,
      signal: ctrl.signal,
    });
    if (!res.ok) throw toError(res, path);
    return await safeJson(res);
  } finally {
    clearTimeout(to);
  }
}

const jsonHeaders = { "Content-Type": "application/json" };

export async function httpGet(path) {
  return _fetch(path, { method: "GET" });
}
export async function httpPost(path, body) {
  return _fetch(path, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body ?? {}),
  });
}
export async function httpPatch(path, body) {
  return _fetch(path, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(body ?? {}),
  });
}
export async function httpDelete(path) {
  return _fetch(path, { method: "DELETE" });
}

export async function getInsights() {
  const raw = await httpGet("/insights");
  return (Array.isArray(raw) ? raw : []).map((it) => ({
    id: it.id,
    title: it.title,
    updatedAt: it.updatedAt,
    summary: it.summary,
    userQuestion: it.user_question,
    type: it.type,
    tags: Array.isArray(it.tags) ? it.tags : [],
  }));
}

export async function listChats() {
  const raw = await httpGet("/chats/?include_insight=false");
  return (Array.isArray(raw) ? raw : []).map((it) => ({
    id: it.chat_id,
    title: it.title,
    updatedAt: it.timestamp,
    lastMessage: it.last_answer,
  }));
}

export async function createChat({
  title = "New Chat",
  starterMessage = "",
} = {}) {
  return httpPost(`/chats/`, { title, starterMessage });
}

export async function renameChat(chatId, newTitle) {
  return httpPatch(`/chats/${encodeURIComponent(chatId)}?chat_type=question`, {
    title: newTitle,
  });
}

export async function deleteChat(chatId) {
  return httpDelete(`/chats/${encodeURIComponent(chatId)}?chat_type=question`);
}

export async function listMessages(threadId, chatType) {
  const res = await httpGet(
    `/chats/${encodeURIComponent(threadId)}?chat_type=${encodeURIComponent(
      chatType
    )}`
  );
  const { chat_id, history = [] } = res || {};
  const out = [];
  for (const item of history) {
    out.push(
      {
        id: `${chat_id}-${item.ts}-q`,
        type: "user",
        content: (item.question || "").trim(),
        createdAt: item.ts,
      },
      {
        id: `${chat_id}-${item.ts}-a`,
        type: "ai",
        content: (item.answer || "").trim(),
        createdAt: item.ts,
        tags: item.tags || [],
        followUps: Array.isArray(item.follow_up_questions)
          ? item.follow_up_questions
          : [],
      }
    );
  }
  return out;
}

export async function sendMessage(threadId, question, chatType) {
  const res = await httpPost(`/search`, {
    question,
    chat_type: chatType,
    chat_id: threadId,
  });
  const iso = nowIso();
  return {
    id: `${threadId}-${iso}-a`,
    type: "ai",
    content: (res?.answer || "").trim(),
    createdAt: iso,
    followUps: Array.isArray(res?.follow_up_questions)
      ? res.follow_up_questions
      : [],
    title: res?.title || "",
    tags: res?.tags || [],
  };
}

export async function uploadDocument(chatId, file, onProgress) {
  const path = `/upload/?chat_id=${encodeURIComponent(chatId)}`;
  const url = `${API_BASE}${path}`;
  const form = new FormData();
  form.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      onProgress?.(pct);
    };

    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      if (!ok) return reject(toError({ status: xhr.status }, path));
      try {
        const json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        resolve(json);
      } catch {
        resolve(null);
      }
    };

    xhr.onerror = () => reject(new Error(`${path} network error`));
    xhr.onabort = () => reject(new Error(`${path} aborted`));

    xhr.open("POST", url);
    xhr.send(form);
  });
}
