import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  Fragment,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Chip,
  Divider,
  Fade,
  useTheme,
  Tooltip,
  Button,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  Send,
  SmartToy,
  Person,
  FiberManualRecord,
  UploadFile,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import ThinkingIndicator from "./thinking-indicator";
import {
  CHAT_SUGGESTIONS,
  headerLabel,
  messageLabel,
  scrollbar,
  formatDate,
  formatTime,
} from "../utils/utils";
import { useData } from "../contexts/data-context";
import ChipList from "./chip-list";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* chips for docs */
function DocChip({ doc, inverted = false }) {
  const theme = useTheme();
  return (
    <Chip
      label={doc.name}
      variant={inverted ? "filled" : "outlined"}
      size="small"
      sx={
        inverted
          ? {
              bgcolor: "rgba(255,255,255,0.12)",
              color: "#fff",
              "& .MuiChip-label": { px: 1 },
            }
          : {
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
              bgcolor: "transparent",
              "& .MuiChip-label": { px: 1 },
            }
      }
    />
  );
}

function DateDivider({ label }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 1.5 }}>
      <Divider sx={{ flex: 1 }} />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ whiteSpace: "nowrap" }}
      >
        {label}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
}

function MessageBubble({ m, isInsight }) {
  const theme = useTheme();
  const isUser = m.type === "user";
  const PRIMARY = isInsight
    ? theme.palette.info.main
    : theme.palette.success.main;
  const AI_SURFACE = theme.palette.mode === "dark" ? "#0F1520" : "#FFFFFF";
  const AI_BORDER = isInsight
    ? theme.palette.mode === "dark"
      ? "#243A6B"
      : "#BFDBFE"
    : theme.palette.mode === "dark"
    ? "#1D4A3C"
    : "#BBF7D0";

  return (
    <Fade in>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          gap: 1.5,
          justifyContent: isUser ? "flex-end" : "flex-start",
        }}
      >
        {!isUser && (
          <Avatar
            sx={{ bgcolor: PRIMARY, color: "#fff", width: 32, height: 32 }}
          >
            <SmartToy sx={{ fontSize: 18 }} />
          </Avatar>
        )}
        <Box
          sx={{
            maxWidth: { xs: "92%", sm: "80%", md: "72%", xl: "60%" },
            px: { xs: 2, md: 2.5 },
            py: { xs: 1.25, md: 2 },
            borderRadius: 3,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 0 0 1px rgba(148,163,184,0.08)"
                : "0 2px 8px rgba(17,24,39,0.06)",
            whiteSpace: "normal",
            wordBreak: "break-word",
            bgcolor: isUser ? PRIMARY : AI_SURFACE,
            color: isUser ? "#fff" : theme.palette.text.primary,
            border: isUser ? "none" : `1px solid ${AI_BORDER}`,
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: (props) => (
                <Typography
                  variant="body1"
                  sx={{ my: 0.25, lineHeight: 1.5 }}
                  {...props}
                />
              ),
              strong: (props) => (
                <Box component="strong" sx={{ fontWeight: 700 }} {...props} />
              ),
              ol: (props) => (
                <Box
                  component="ol"
                  sx={{ pl: 2.25, my: 0.5, listStyleType: "decimal" }}
                  {...props}
                />
              ),
              ul: (props) => (
                <Box
                  component="ul"
                  sx={{ pl: 2.25, my: 0.5, listStyleType: "disc" }}
                  {...props}
                />
              ),
              li: (props) => (
                <Box
                  component="li"
                  sx={{ my: 0.25, lineHeight: 1.5 }}
                  {...props}
                />
              ),
            }}
          >
            {m.content}
          </ReactMarkdown>

          {!!m.docs?.length && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.25 }}>
              {m.docs.map((d) => (
                <DocChip key={d.id} doc={d} inverted={isUser} />
              ))}
            </Box>
          )}
        </Box>
        {isUser && (
          <Avatar
            sx={{ bgcolor: "#111827", color: "#fff", width: 32, height: 32 }}
          >
            <Person sx={{ fontSize: 18 }} />
          </Avatar>
        )}
      </Box>
    </Fade>
  );
}

const ChatWindow = forwardRef(function ChatWindow(
  { chat, onCreateChat, onBack, embedded = false, starterMessage },
  ref
) {
  const theme = useTheme();
  const {
    sendMessage,
    selectMessages,
    loadMessages,
    messagesVersion,
    setMessage,
    uploadDocument,
  } = useData();

  const [inputValue, setInputValue] = useState(starterMessage || "");
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [sendError, setSendError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // [{id,name,progress,done,error}]

  const [now, setNow] = useState(() => new Date());
  const messagesEndRef = useRef(null);
  const removalTimersRef = useRef(new Map());

  const scheduleRemoval = useCallback(
    (id, delay = 3000) => {
      if (removalTimersRef.current.has(id)) return; // avoid double-scheduling
      const t = setTimeout(() => {
        setUploads((u) => u.filter((x) => x.id !== id));
        removalTimersRef.current.delete(id);
      }, delay);
      removalTimersRef.current.set(id, t);
    },
    [setUploads]
  );

  // clear pending timers on unmount
  useEffect(() => {
    return () => {
      removalTimersRef.current.forEach((t) => clearTimeout(t));
      removalTimersRef.current.clear();
    };
  }, []);

  const autoAskedByThread = useRef(new Set());
  const fetchedHistoryRef = useRef(new Set());
  const sendRef = useRef(null);

  const isInsight = chat.chatType === "insight";
  const PRIMARY = isInsight
    ? theme.palette.info.main
    : theme.palette.success.main;

  const messages = useMemo(
    () => selectMessages(chat.id),
    [messagesVersion, chat.id, selectMessages]
  );

  useEffect(() => {
    const idTimer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(idTimer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const lastAiMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--)
      if (messages[i]?.type === "ai") return messages[i].id;
    return null;
  }, [messages]);

  /** Load history on thread change — fetch ONCE per chat id (strict-mode safe) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!chat?.id) return;
      if (fetchedHistoryRef.current.has(chat.id)) return;
      fetchedHistoryRef.current.add(chat.id);

      setIsLoadingHistory(true);
      setLoadError(null);
      try {
        const chatType = isInsight ? "insight" : "question";
        await loadMessages(chat.id, chatType);

        if (cancelled) return;

        if (isInsight && !autoAskedByThread.current.has(chat.id)) {
          const loaded = selectMessages(chat.id) || [];
          const isEmpty = loaded.length === 0;
          const q = (
            chat?.insightData?.userQuestion ||
            chat?.title ||
            ""
          ).trim();
          if (isEmpty && q) {
            autoAskedByThread.current.add(chat.id);
            await sendRef.current?.(q);
          }
        }
      } catch (err) {
        fetchedHistoryRef.current.delete(chat.id);
        if (!cancelled) setLoadError("Could not load chat history.");
      } finally {
        setIsLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chat?.id, isInsight, loadMessages, selectMessages]);

  /** Manual send (click/Enter) */
  const send = useCallback(
    async (text) => {
      const content = (typeof text === "string" ? text : inputValue).trim();
      if (!content) return;
      setSendError(null);
      setIsThinking(true);
      try {
        const chatType = isInsight ? "insight" : "question";
        setMessage(chat.id, content);
        if (typeof text !== "string") setInputValue("");
        await sendMessage(chat.id, content, chatType);
      } catch (err) {
        setSendError("Failed to send. Please try again.");
      } finally {
        setIsThinking(false);
      }
    },
    [inputValue, isInsight, chat?.id, sendMessage, setMessage]
  );

  sendRef.current = send;
  useImperativeHandle(ref, () => ({ triggerSend: (text) => send(text) }));

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  const isNewChat = messages.length === 0 && !isInsight;
  const isEmptyChat = chat.chatType === "regular" && messages.length === 0;

  const sections = useMemo(() => {
    if (!messages.length) return [];
    const out = [];
    let currentKey = null;
    messages.forEach((m) => {
      let d = m.createdAt ? new Date(m.createdAt) : new Date();
      if (isNaN(d.getTime())) d = new Date();
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== currentKey) {
        out.push({ header: headerLabel(d, now), items: [] });
        currentKey = key;
      }
      out[out.length - 1].items.push({ ...m, _d: d });
    });
    return out;
  }, [messages, now]);

  const fileInputRef = useRef(null);

  const beginUpload = async (files) => {
    if (isInsight || !files?.length) return;
    const items = Array.from(files).map((f) => ({
      id: `${chat.id}-${Date.now()}-${f.name}`,
      name: f.name,
      progress: 0,
      done: false,
      error: null,
      file: f,
    }));
    setUploads((u) => [...u, ...items]);
    // fire uploads sequentially to simplify progress demo
    for (const it of items) {
      try {
        await uploadDocument(chat.id, it.file, (pct) => {
          setUploads((u) =>
            u.map((x) => (x.id === it.id ? { ...x, progress: pct } : x))
          );
        });
        setUploads((u) =>
          u.map((x) =>
            x.id === it.id ? { ...x, done: true, progress: 100 } : x
          )
        );

        scheduleRemoval(it.id);
      } catch (e) {
        setUploads((u) =>
          u.map((x) => (x.id === it.id ? { ...x, error: "Upload failed" } : x))
        );
        scheduleRemoval(it.id);
      }
    }
  };

  const onPickFiles = (e) => beginUpload(e.target.files);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    beginUpload(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Paper
        variant="outlined"
        sx={{
          position: { xs: "sticky", md: "relative" },
          top: { xs: 0, md: "auto" },
          zIndex: 1,
          px: { xs: 1.5, md: 2 },
          py: { xs: 1, md: 1.5 },
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderRadius: 0,
          bgcolor: (t) => t.palette.background.paper,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        {!embedded && (
          <IconButton
            onClick={onBack}
            size="small"
            sx={{ mr: { xs: 0.5, md: 0 } }}
          >
            <ArrowBack />
          </IconButton>
        )}
        <FiberManualRecord fontSize="small" sx={{ color: PRIMARY, mr: 0.25 }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {chat.title}
        </Typography>
        {!isEmptyChat && (
          <Button
            onClick={onCreateChat}
            variant="contained"
            sx={{
              bgcolor: theme.palette.success.main,
              color: "#fff",
              px: 2,
              borderRadius: 2,
              "&:hover": { bgcolor: "#059669" },
            }}
          >
            New Chat
          </Button>
        )}
      </Paper>

      {!isLoadingHistory && isNewChat && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: (t) => (t.palette.mode === "dark" ? "#0F1520" : "#F8FAFC"),
            position: "relative",
            "&::after": {
              content: '""',
              display: { xs: "block", sm: "none" },
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 24,
              pointerEvents: "none",
              background: (t) =>
                `linear-gradient(270deg, ${t.palette.background.paper}, rgba(0,0,0,0))`,
            },
          }}
        >
          <ChipList
            items={CHAT_SUGGESTIONS}
            onPick={(text) => send(text)}
            tone={PRIMARY}
            outlined
          />
        </Box>
      )}

      {/* History loader — themed to Chats (green) or Insights (blue) */}
      {isLoadingHistory && (
        <LinearProgress
          sx={{
            backgroundColor: alpha(PRIMARY, 0.12),
            "& .MuiLinearProgress-bar": {
              backgroundColor: PRIMARY,
            },
          }}
        />
      )}

      <Box
        onDragOver={!isInsight ? onDragOver : undefined}
        onDragLeave={!isInsight ? onDragLeave : undefined}
        onDrop={!isInsight ? onDrop : undefined}
        sx={{
          position: "relative",
          flex: 1,
          p: { xs: 1.5, sm: 2 },
          overflowY: "auto",
          bgcolor: theme.palette.mode === "dark" ? "#0B0F14" : "#F6F7F9",
          minHeight: 0,
          ...scrollbar(theme, PRIMARY),
        }}
      >
        {!isInsight && isDragging && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              bgcolor: "rgba(37,99,235,0.08)",
              border: `2px dashed ${PRIMARY}`,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
            }}
          >
            <Typography variant="h6">Drop files to upload</Typography>
          </Box>
        )}
        {loadError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setLoadError(null)}
          >
            {loadError}
          </Alert>
        )}

        {sections.map((section) => (
          <Box key={section.header} sx={{ mb: 1.5 }}>
            <DateDivider label={section.header} />
            {section.items.map((m) => {
              const label = messageLabel(m._d, now);
              const hoverTitle = `${formatDate(m._d)} · ${formatTime(m._d)}`;
              const isUser = m.type === "user";
              return (
                <Fragment key={m.id}>
                  <Box sx={{ mb: 2 }}>
                    <MessageBubble m={m} isInsight={isInsight} />
                    {m.type === "ai" &&
                      m.id === lastAiMessageId &&
                      Array.isArray(m.followUps) &&
                      m.followUps.length > 0 && (
                        <Box
                          sx={{
                            mt: 1,
                            display: "flex",
                            justifyContent: "flex-start",
                            px: 6,
                          }}
                        >
                          <ChipList
                            items={m.followUps}
                            onPick={(text) => send(text)}
                            tone={PRIMARY}
                            outlined
                          />
                        </Box>
                      )}
                    <Box
                      sx={{
                        mt: 0.5,
                        px: 6,
                        display: "grid",
                        // xs: stack; sm+: two columns (time + chips)
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: isUser
                            ? "minmax(0, auto) 1fr"
                            : "minmax(0, auto) 1fr",
                        },
                        columnGap: 1.5,
                        rowGap: 0.75,
                        alignItems: "start",
                      }}
                    >
                      {/* Time */}
                      <Tooltip
                        title={hoverTitle}
                        arrow
                        placement={isUser ? "left" : "right"}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            gridColumn: { xs: "1 / -1", sm: isUser ? 2 : 1 },
                            justifySelf: isUser
                              ? { xs: "end", sm: "end" }
                              : "start",
                            textAlign: isUser ? "right" : "left",

                            // allow wrapping (no truncation)
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            textOverflow: "clip",
                            overflow: "visible",
                            minWidth: 0,
                            maxWidth: "100%",
                          }}
                        >
                          {label}
                        </Typography>
                      </Tooltip>

                      {/* Chips */}
                      {m.type === "ai" &&
                        Array.isArray(m.tags) &&
                        m.tags.length > 0 && (
                          <Box
                            sx={{
                              // xs: put chips on the next row full-width; sm+: second column
                              gridColumn: { xs: "1 / -1", sm: 2 },
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.75,
                              justifyContent: isUser
                                ? "flex-end"
                                : "flex-start",
                              minWidth: 0, // critical to allow wrapping in grid/flex
                            }}
                          >
                            {m.tags.map((ref, idx) => (
                              <Chip
                                key={idx}
                                label={ref.name}
                                size="small"
                                variant="outlined"
                                component={ref.file_url ? "a" : "div"}
                                href={ref.file_url || undefined}
                                target={ref.file_url ? "_blank" : undefined}
                                rel={
                                  ref.file_url
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                                clickable={!!ref.file_url}
                                sx={{
                                  fontSize: "0.7rem",
                                  color: "text.secondary",
                                  borderColor: "divider",
                                  bgcolor: (t) =>
                                    t.palette.mode === "dark"
                                      ? "rgba(255,255,255,0.05)"
                                      : "#F9FAFB",
                                  "& .MuiChip-label": {
                                    px: 0.75,
                                    whiteSpace: "normal", // allow multi-line chip text too
                                    wordBreak: "break-word",
                                    overflowWrap: "anywhere",
                                  },
                                  height: "auto", // let chip grow vertically
                                  alignItems: "flex-start",
                                }}
                              />
                            ))}
                          </Box>
                        )}
                    </Box>
                  </Box>
                </Fragment>
              );
            })}
          </Box>
        ))}

        {isThinking && (
          <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
            <Avatar
              sx={{ bgcolor: PRIMARY, color: "#fff", width: 32, height: 32 }}
            >
              <SmartToy sx={{ fontSize: 18 }} />
            </Avatar>
            <Box
              sx={{
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                px: 2,
                py: 1,
                borderRadius: 3,
              }}
            >
              <ThinkingIndicator variant={isInsight ? "insight" : "chat"} />
            </Box>
          </Box>
        )}

        {/* Anchor for auto-scroll */}
        <div ref={messagesEndRef} />
      </Box>

      <Paper
        variant="outlined"
        sx={{
          px: { xs: 1, md: 1.5 },
          py: { xs: 0.75, md: 1 },
          borderRadius: 0,
        }}
      >
        {sendError && (
          <Alert
            severity="error"
            sx={{ mb: 1 }}
            onClose={() => setSendError(null)}
          >
            {sendError}
          </Alert>
        )}
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={onPickFiles}
          />
          {!isInsight && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={onPickFiles}
              />
              <Tooltip title="Upload files">
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    bgcolor:
                      theme.palette.mode === "dark" ? "#0F1520" : "#FFFFFF",
                    border: `1px solid ${theme.palette.divider}`,
                    "&:hover": { bgcolor: theme.palette.action.hover },
                  }}
                >
                  <UploadFile />
                </IconButton>
              </Tooltip>
            </>
          )}
          <TextField
            fullWidth
            multiline
            maxRows={6}
            placeholder={
              isInsight ? "Ask about this insight…" : "Ask anything here…"
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0F1520" : "#FFFFFF",
                "& fieldset": { borderColor: theme.palette.divider },
                "&:hover fieldset": {
                  borderColor:
                    theme.palette.mode === "dark" ? "#2B3542" : "#D1D5DB",
                },
                "&.Mui-focused fieldset": { borderColor: PRIMARY },
              },
            }}
          />
          <IconButton
            onClick={() => send()}
            disabled={!inputValue.trim() || isThinking}
            sx={{
              bgcolor: PRIMARY,
              color: "white",
              "&:hover": { bgcolor: isInsight ? "#1D4ED8" : "#059669" },
              "&:disabled": { bgcolor: "#2E3846", color: "#9CA3AF" },
            }}
          >
            <Send sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
        {/* Upload progress strip */}
        {!isInsight && uploads.length > 0 && (
          <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
            {uploads.map((u) => (
              <Box key={u.id}>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mb: 0.25 }}
                >
                  {u.name} {u.error ? "– failed" : u.done ? "– done" : ""}
                </Typography>
                <LinearProgress
                  variant={u.error ? "determinate" : "determinate"}
                  value={u.error ? 0 : u.progress}
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: alpha(PRIMARY, 0.12),
                    "& .MuiLinearProgress-bar": { backgroundColor: PRIMARY },
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
});

export default ChatWindow;
