import { useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  CssBaseline,
  Snackbar,
  Alert,
  LinearProgress,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { ThemeProvider, createTheme, alpha } from "@mui/material/styles";
import ConversationList from "./components/conversation-list";
import ChatWindow from "./components/chat-window";
import InteractiveEmptyState from "./components/interactive-empty-state";
import logo from "./logo.png";
import { DataProvider, useData } from "./contexts/data-context";

function AppShellInner({ threadId }) {
  const [darkMode, setDarkMode] = useState(false);
  const conversationListRef = useRef(null);
  const chatWinRef = useRef(null);
  const navigate = useNavigate();
  const {
    chats,
    insights,
    createChat,
    getLatestInsight,
    isBooting,
    lastError,
    clearError,
  } = useData();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          success: { main: "#10B981" },
          info: { main: "#2563EB" },
          background: {
            default: darkMode ? "#0B0F14" : "#F7F8FA",
            paper: darkMode ? "#12171F" : "#FFFFFF",
          },
          divider: darkMode ? alpha("#93A1B3", 0.16) : "#E5E7EB",
          text: {
            primary: darkMode ? "#E8EDF2" : "#111827",
            secondary: darkMode ? "#A9B4C2" : "#6B7280",
          },
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          button: { textTransform: "none", fontWeight: 600 },
          subtitle2: { fontWeight: 600 },
        },
        components: {
          MuiButtonBase: { defaultProps: { disableRipple: true } },
          MuiListItemButton: { defaultProps: { disableTouchRipple: true } },
          MuiTab: { defaultProps: { disableRipple: true } },
          MuiButton: { defaultProps: { disableRipple: true } },
          MuiIconButton: { defaultProps: { disableRipple: true } },
          MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
        },
      }),
    [darkMode]
  );

  const selectedFromUrl = useMemo(() => {
    if (!threadId) return null;
    const c = chats.find((x) => x.id === threadId);
    if (c) return { ...c, chatType: "regular" };
    const i = insights.find((x) => x.id === threadId);
    if (i)
      return { id: i.id, title: i.title, chatType: "insight", insightData: i };
    return null;
  }, [threadId, chats, insights]);

  const lastNonNullRef = useRef(null);
  useEffect(() => {
    if (selectedFromUrl) lastNonNullRef.current = selectedFromUrl;
  }, [selectedFromUrl]);
  const activeChat = selectedFromUrl ?? lastNonNullRef.current;

  const navigateTo = (id) =>
    id ? navigate(`/${encodeURIComponent(id)}`) : navigate(`/home`);

  const handleOpenChat = (chatData) => navigateTo(chatData.id);

  const leftDefaultTab =
    activeChat?.chatType === "regular" ? "chats" : "insights";

  const [errorOpen, setErrorOpen] = useState(false);
  useEffect(() => {
    setErrorOpen(Boolean(lastError));
  }, [lastError]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: "100svh",
          height: "100dvh",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, md: 3 },
            py: { xs: 1.5, md: 2 },
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: "background.paper",
            position: "relative",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <img
              src={logo}
              alt="App Logo"
              style={{ width: 40, height: 40, cursor: "pointer" }}
              onClick={() => {
                lastNonNullRef.current = null;
                conversationListRef.current?.clearSelection?.();
                conversationListRef.current?.selectTab?.("insights");
                navigateTo(null);
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                APCRDA Insights Engine
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI-powered insights
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDarkMode((v) => !v)}>
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {isBooting && (
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -1,
              }}
            >
              <LinearProgress />
            </Box>
          )}
        </Box>

        {/* Main split */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 1.5, md: 2 },
            p: { xs: 1, md: 2 },
            height: "calc(100vh - 64px)",
            overflow: "hidden",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {/* Conversation List panel */}
          <Paper
            variant="outlined"
            sx={{
              width: { xs: "100%", md: 320, lg: 360 },
              minWidth: { md: 280 },
              flex: { xs: "1 1 auto", md: "0 0 auto" },
              display: {
                xs: activeChat ? "none" : "flex", // hide on mobile when a chat is open
                md: "flex",
              },
              flexDirection: "column",
              overflow: "hidden",
              height: { xs: "100%", md: "auto" }, // full height when it's the only panel
              minHeight: 0,
            }}
          >
            <ConversationList
              ref={conversationListRef}
              onOpenChat={handleOpenChat}
              defaultTab={leftDefaultTab}
            />
          </Paper>

          {/* Chat Window panel */}
          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              display: {
                xs: activeChat ? "flex" : "none",
                md: "flex",
              },
              flexDirection: "column",
              overflow: "hidden",
              minWidth: 0,
              height: { xs: "100%", md: "auto" },
              minHeight: 0,
            }}
          >
            {activeChat ? (
              <ChatWindow
                ref={chatWinRef}
                chat={activeChat}
                onCreateChat={async () => {
                  conversationListRef.current?.selectTab("chats");
                  conversationListRef.current?.clearSelection?.();
                  const chat = await createChat("New Chat");
                  navigateTo(chat.id);
                }}
                onBack={() => {
                  lastNonNullRef.current = null;
                  conversationListRef.current?.selectTab?.("insights");
                  conversationListRef.current?.clearSelection?.();
                  navigateTo(null);
                }}
              />
            ) : (
              <InteractiveEmptyState
                onStartChat={async () => {
                  conversationListRef.current?.selectTab("chats");
                  conversationListRef.current?.clearSelection?.();
                  const chat = await createChat("New Chat");
                  navigateTo(chat.id);
                }}
                onBrowseInsights={() => {
                  conversationListRef.current?.selectTab("insights");
                  const latest = getLatestInsight();
                  if (latest) {
                    conversationListRef.current?.setSelected?.(
                      "insights",
                      latest.id
                    );
                    navigateTo(latest.id);
                  } else {
                    navigateTo(null);
                  }
                }}
                onUploadDocs={() => console.log("Upload docs clicked")}
              />
            )}
          </Paper>
        </Box>

        <Snackbar
          open={errorOpen}
          autoHideDuration={6000}
          onClose={() => {
            setErrorOpen(false);
            clearError();
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="error"
            onClose={() => {
              setErrorOpen(false);
              clearError();
            }}
            sx={{ width: "100%" }}
          >
            {lastError}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

function Routed() {
  const params = useParams();
  const { id } = params ?? {};
  return <AppShellInner threadId={id} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Routed />} />
          <Route path=":id" element={<Routed />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}
