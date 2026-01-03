import { Box, Typography, useTheme } from "@mui/material";
import { keyframes } from "@mui/system";
import { Psychology } from "@mui/icons-material";

/**
 * variant: 'chat' | 'insight'
 * chat   → green accents
 * insight→ blue accents
 */
export default function ThinkingIndicator({ variant = "chat" }) {
  const theme = useTheme();
  const isInsight = variant === "insight";
  const bar1 = isInsight ? "#93C5FD" : "#A7F3D0";
  const bar2 = isInsight ? "#60A5FA" : "#86EFAC";
  const bar3 = isInsight ? "#3B82F6" : "#34D399";
  const dot = isInsight ? "#60A5FA" : "#34D399";

  const bounce = keyframes`
    0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
    40% { transform: translateY(-4px); opacity: 1; }
  `;

  const pulse = keyframes`
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  `;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Psychology
          fontSize="small"
          sx={{ color: isInsight ? "#60A5FA" : "#34D399" }}
        />
        <Typography
          variant="body2"
          color="text.primary"
          sx={{ fontWeight: 500 }}
        >
          Thinking
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {[0, 150, 300].map((delay) => (
            <Box
              key={delay}
              sx={{
                width: 6,
                height: 6,
                borderRadius: "999px",
                background: dot,
                animation: `${bounce} 1.2s ease-in-out ${delay}ms infinite`,
              }}
            />
          ))}
        </Box>
      </Box>
      <Box sx={{ display: "grid", gap: 0.5 }}>
        <Box
          sx={{
            height: 8,
            borderRadius: 1,
            background: bar1,
            animation: `${pulse} 1.8s ease-in-out 0ms infinite`,
          }}
        />
        <Box
          sx={{
            height: 8,
            borderRadius: 1,
            background: bar2,
            width: "75%",
            animation: `${pulse} 1.8s ease-in-out 150ms infinite`,
          }}
        />
        <Box
          sx={{
            height: 8,
            borderRadius: 1,
            background: bar3,
            width: "50%",
            animation: `${pulse} 1.8s ease-in-out 300ms infinite`,
          }}
        />
      </Box>
    </Box>
  );
}
