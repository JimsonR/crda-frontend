import * as api from "../api/client";
import { makeUUID, nowIso } from "../utils/utils";

class DataService {
  constructor() {
    this.state = {
      insights: [],
      chats: [],
      messagesById: {},
      meta: {
        isBooting: false,
        lastError: null,
      },
    };
    this.listeners = new Map();
  }

  subscribe(key, fn) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    const set = this.listeners.get(key);
    set.add(fn);

    fn(this.state[key]);
    return () => {
      set.delete(fn);
      if (set.size === 0) this.listeners.delete(key);
    };
  }
  _emit(key) {
    const set = this.listeners.get(key);
    if (!set) return;
    for (const fn of set) fn(this.state[key]);
  }

  _setBooting(v) {
    this.state.meta.isBooting = Boolean(v);
    this._emit("meta");
  }
  _setError(err) {
    const msg =
      err?.message ||
      (typeof err === "string"
        ? err
        : "Something went wrong. Please try again.");
    this.state.meta.lastError = msg;
    this._emit("meta");
  }
  clearError() {
    this.state.meta.lastError = null;
    this._emit("meta");
  }

  get chats() {
    return this.state.chats;
  }
  get insights() {
    return this.state.insights;
  }
  get meta() {
    return this.state.meta;
  }
  getMessages(threadId) {
    return this.state.messagesById[threadId] || [];
  }
  setMessage(threadId, message) {
    const iso = nowIso();
    this.state.messagesById[threadId] = [
      ...(this.state.messagesById[threadId] || []),
      {
        id: `${threadId}-${iso}-q`,
        type: "user",
        content: (message || "").trim(),
        createdAt: iso,
      },
    ];
    this._emit("messagesById");
  }

  async fetchBoot() {
    this._setBooting(true);
    try {
      const [insights, chats] = await Promise.all([
        api.getInsights(),
        api.listChats(),
      ]);
      this.state.insights = Array.isArray(insights) ? insights : [];
      this.state.chats = Array.isArray(chats) ? chats : [];
      this._emit("insights");
      this._emit("chats");
      return this.state;
    } catch (err) {
      this._setError(err);
      throw err;
    } finally {
      this._setBooting(false);
    }
  }

  async createChat() {
    const chat = {
      id: makeUUID(),
      title: "New Chat",
      updatedAt: nowIso(),
      lastMessage: "",
    };
    this.state.chats = [chat, ...this.state.chats];
    this._emit("chats");
    return chat;
  }

  async renameChat(chatId, newTitle) {
    try {
      const updated = await api.renameChat(chatId, newTitle);
      this.state.chats = this.state.chats.map((c) =>
        c.id === chatId ? updated : c
      );
      this._emit("chats");
      return updated;
    } catch (err) {
      this._setError(err);
      throw err;
    }
  }

  async deleteChat(chatId) {
    try {
      await api.deleteChat(chatId);
      const { [chatId]: _rm, ...rest } = this.state.messagesById;
      this.state.messagesById = rest;
      this.state.chats = this.state.chats.filter((c) => c.id !== chatId);
      this._emit("messagesById");
      this._emit("chats");
    } catch (err) {
      this._setError(err);
      throw err;
    }
  }

  async loadMessages(threadId, chatType) {
    try {
      const msgs = await api.listMessages(threadId, chatType);
      this.state.messagesById = {
        ...this.state.messagesById,
        [threadId]: msgs,
      };
      this._emit("messagesById");
      return msgs;
    } catch (err) {
      this._setError(err);
      throw err;
    }
  }

  async sendMessage(threadId, text, chatType) {
    try {
      const msg = await api.sendMessage(threadId, text, chatType);
      this.state.messagesById = {
        ...this.state.messagesById,
        [threadId]: [...(this.state.messagesById[threadId] || []), msg],
      };

      if (chatType === "question") {
        this.state.chats = this.state.chats.map((c) =>
          c.id === threadId
            ? {
                ...c,
                title: msg.title || "New Chat",
                lastMessage: msg.content,
                updatedAt: nowIso(),
              }
            : c
        );
        this._emit("chats");
      }

      this._emit("messagesById");
    } catch (err) {
      this._setError(err);
      throw err;
    }
  }

  async uploadDocument(chatId, file, onProgress) {
    try {
      const doc = await api.uploadDocument(chatId, file, onProgress);
      return doc;
    } catch (err) {
      this._setError(err);
      throw err;
    }
  }
}

const dataService = new DataService();
export default dataService;
