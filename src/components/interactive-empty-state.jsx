import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  useTheme,
} from "@mui/material";
import {
  Chat,
  Psychology,
  UploadFile,
  Keyboard,
  Bolt,
} from "@mui/icons-material";

export default function InteractiveEmptyState({
  onStartChat,
  onBrowseInsights,
  onUploadDocs,
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        bgcolor: theme.palette.background.default,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "min(840px, 96%)",
          borderRadius: 3,
          p: 4,
        }}
      >
        <Stack spacing={3}>
          {/* Header */}
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: theme.palette.mode === "dark" ? "#0F1520" : "#F3F4F6",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Bolt sx={{ color: theme.palette.success.main }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Ask your workspace anything
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start a chat to analyze meetings and documents, or open an insight
              to dive in fast.
            </Typography>
          </Stack>

          {/* Quick actions */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="center"
          >
            <Button
              onClick={onStartChat}
              variant="contained"
              startIcon={<Chat />}
              sx={{
                backgroundColor: "#10B981",
                "&:hover": { backgroundColor: "#059669" },
                borderRadius: 2,
                px: 2.5,
              }}
            >
              New chat
            </Button>
            <Button
              variant="contained"
              startIcon={<Psychology />}
              onClick={onBrowseInsights}
              sx={{
                backgroundColor: "#2563EB",
                "&:hover": { backgroundColor: "#1D4ED8" },
                borderRadius: 2,
                px: 2.5,
              }}
            >
              Browse insights
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadFile />}
              sx={{
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                bgcolor: "transparent",
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark" ? "#101823" : "#F9FAFB",
                  borderColor: theme.palette.divider,
                },
                borderRadius: 2,
                px: 2.5,
              }}
              onClick={() => onUploadDocs?.()}
            >
              Upload docs
            </Button>
          </Stack>

          {/* Dropzone */}
          <Box
            sx={{
              mt: 1,
              p: 3,
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 2.5,
              textAlign: "center",
              bgcolor: theme.palette.mode === "dark" ? "#0F1520" : "#FCFCFD",
            }}
          >
            <Typography sx={{ mb: 0.5 }}>
              Drag & drop files here to ask about them
            </Typography>
            <Typography variant="caption" color="text.secondary">
              PDF, DOCX, XLSX, PPTX, TXT, MD
            </Typography>
          </Box>

          <Divider />

          {/* Helpful tips / shortcuts */}
          <Stack spacing={1}>
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ mt: 1 }}
              color="text.secondary"
            >
              <Keyboard fontSize="small" />
              <Typography variant="body2">
                Tip: Press <strong>Enter</strong> to send,{" "}
                <strong>Shift + Enter</strong> for a new line.
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
