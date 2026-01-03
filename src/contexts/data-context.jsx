import { createContext, useContext, useEffect, useMemo, useState } from "react";
import dataService from "../services/data-service";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [chats, setChats] = useState([]);
  const [insights, setInsights] = useState([]);
  const [messagesVersion, setMessagesVersion] = useState(0);

  const [isBooting, setIsBooting] = useState(true);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    dataService.fetchBoot().catch(() => {
      /* meta handles error */
    });
    const unsubChats = dataService.subscribe("chats", setChats);
    const unsubInsights = dataService.subscribe("insights", setInsights);
    const unsubMsgs = dataService.subscribe("messagesById", () =>
      setMessagesVersion((v) => v + 1)
    );
    const unsubMeta = dataService.subscribe("meta", (m) => {
      setIsBooting(Boolean(m?.isBooting));
      setLastError(m?.lastError || null);
    });

    return () => {
      unsubChats();
      unsubInsights();
      unsubMsgs();
      unsubMeta();
    };
  }, []);

  const api = useMemo(
    () => ({
      uploadDocument: (...a) => dataService.uploadDocument(...a),
      createChat: (...a) => dataService.createChat(...a),
      renameChat: (...a) => dataService.renameChat(...a),
      deleteChat: (...a) => dataService.deleteChat(...a),
      loadMessages: (...a) => dataService.loadMessages(...a),
      sendMessage: (...a) => dataService.sendMessage(...a),
      selectMessages: (threadId) => dataService.getMessages(threadId),
      setMessage: (threadId, message) =>
        dataService.setMessage(threadId, message),
      getLatestInsight: () =>
        [...insights].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        )[0],
      clearError: () => dataService.clearError(),
    }),
    [insights]
  );

  const value = useMemo(
    () => ({ chats, insights, messagesVersion, isBooting, lastError, ...api }),
    [chats, insights, messagesVersion, isBooting, lastError, api]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider/>");
  return ctx;
}
