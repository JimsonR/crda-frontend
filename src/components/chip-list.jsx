import { Box, Chip } from "@mui/material";

export default function ChipList({ items, onPick, tone, outlined = true }) {
  const baseChipSx = {
    borderRadius: 999,
    px: 0.75,
    py: 0.25, // a bit more vertical padding for multi-line
    fontWeight: 500,
    alignItems: "flex-start", // allow multi-line height
    height: "auto", // IMPORTANT: allow chip to grow vertically
    maxWidth: "100%", // don't exceed container width
    "& .MuiChip-label": {
      px: 1,
      display: "block",
      overflow: "visible", // no clipping
      textOverflow: "clip", // no ellipsis
      whiteSpace: "normal", // allow wrapping
      wordBreak: "break-word",
      overflowWrap: "anywhere",
      maxWidth: "100%", // inherit container constraints
      fontSize: { xs: 12, sm: 13 },
      lineHeight: 1.4,
    },
    bgcolor: outlined
      ? (t) => (t.palette.mode === "dark" ? "#111A25" : "#F3F4F6")
      : (t) => (t.palette.mode === "dark" ? "#0F1520" : "#FFFFFF"),
    color: (t) => t.palette.text.primary,
    border: outlined
      ? `1px solid ${tone}`
      : (t) => `1px solid ${t.palette.divider}`,
    cursor: "pointer",
    transition:
      "background-color 120ms, border-color 120ms, box-shadow 120ms, transform 60ms",
    "&:hover": {
      bgcolor: (t) => (t.palette.mode === "dark" ? "#152130" : "#EEF2F6"),
      borderColor: (t) => (t.palette.mode === "dark" ? "#304050" : "#D1D5DB"),
      boxShadow: (t) =>
        t.palette.mode === "dark"
          ? "0 0 0 1px rgba(148,163,184,0.18)"
          : "0 1px 2px rgba(16,24,40,0.06)",
    },
    "&:active": { transform: "translateY(1px) scale(0.98)" },
    "&.Mui-focusVisible": {
      outline: "none",
      boxShadow: (t) =>
        `0 0 0 2px ${t.palette.background.paper}, 0 0 0 4px ${tone}`,
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        flexWrap: "wrap", // always wrap rows
        overflowX: "visible", // no horizontal scrolling
        scrollSnapType: "none",
        WebkitOverflowScrolling: "auto",
        px: { xs: 0.5, sm: 0 },
      }}
    >
      {items.map((label) => (
        <Chip
          key={label}
          label={label}
          clickable
          onClick={() => onPick(label)}
          variant={outlined ? "outlined" : "filled"}
          sx={{
            ...baseChipSx,
            // let the chip naturally size; ensure it can shrink if needed
            flexShrink: 1,
            scrollSnapAlign: "unset",
          }}
          aria-label={`Suggestion: ${label}`}
        />
      ))}
    </Box>
  );
}
