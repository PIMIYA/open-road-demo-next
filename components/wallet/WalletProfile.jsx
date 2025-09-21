import { Avatar, Typography, Box, Stack, IconButton } from "@mui/material";
import { truncateAddress } from "@/lib/stringUtils";
import { useEffect, useState } from "react";
import { TZKT_API } from "@/lib/api";

// SVG Icons for social media
const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
  </svg>
);

const WebsiteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

export default function WalletProfile({ address, walletInfo }) {
  const [alias, setAlias] = useState(null);
  const [avatarText, setAvatarText] = useState(null);

  useEffect(() => {
    setAlias(truncateAddress(address));
    setAvatarText(address.substring(address.length - 4));

    async function getAlias() {
      const account = await TZKT_API(`/v1/accounts/${address}`);
      if (account && account.alias) {
        setAlias(account.alias);
        setAvatarText(account.alias.substring(0, 1));
      }
    }

    getAlias();
  }, [address]);

  // 安全地解構 walletInfo，避免 undefined 錯誤
  const { introduction, instagram, x, website, twitter, discord } =
    walletInfo || {};

  // 輔助函數：確保 URL 有協議
  const ensureProtocol = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  // 處理點擊事件
  const handleSocialClick = (url) => {
    const fullUrl = ensureProtocol(url);
    if (fullUrl) {
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
  };

  // 檢查是否有任何社交媒體連結
  const hasSocialMedia = instagram || x || website || twitter || discord;

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
      {/* Left side - Avatar */}
      <Avatar
        sx={{
          width: 80,
          height: 80,
          flexShrink: 0,
        }}
      >
        {avatarText}
      </Avatar>

      {/* Right side - Information */}
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        {/* Alias */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "text.primary",
          }}
        >
          {alias}
        </Typography>

        {/* Address */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontFamily: "monospace",
            fontSize: "0.875rem",
          }}
        >
          {address}
        </Typography>

        {/* Introduction - 渲染 HTML 內容 */}
        {introduction && (
          <Box
            sx={{
              mt: 1,
              "& h1, & h2, & h3, & h4, & h5, & h6": {
                color: "text.primary",
                fontWeight: 600,
                mb: 1,
                mt: 0,
              },
              "& h3": {
                fontSize: "1.1rem",
              },
              "& p": {
                color: "text.secondary",
                lineHeight: 1.6,
                mb: 1,
                "&:last-child": {
                  mb: 0,
                },
              },
              "& strong": {
                fontWeight: 600,
                color: "text.primary",
              },
              "& em": {
                fontStyle: "italic",
              },
              "& u": {
                textDecoration: "underline",
              },
              "& br": {
                display: "block",
                content: '""',
                marginTop: "0.5rem",
              },
              "& ul, & ol": {
                color: "text.secondary",
                pl: 2,
                mb: 1,
              },
              "& li": {
                mb: 0.5,
              },
              "& a": {
                color: "primary.main",
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              },
            }}
            dangerouslySetInnerHTML={{ __html: introduction }}
          />
        )}

        {/* Social Media Links */}
        {hasSocialMedia && (
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            {instagram && (
              <IconButton
                size="small"
                onClick={() => handleSocialClick(instagram)}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "#E4405F", // Instagram brand color
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <InstagramIcon />
              </IconButton>
            )}

            {twitter && (
              <IconButton
                size="small"
                onClick={() => handleSocialClick(twitter)}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "#1DA1F2", // Twitter brand color
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <TwitterIcon />
              </IconButton>
            )}

            {x && (
              <IconButton
                size="small"
                onClick={() => handleSocialClick(x)}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "#000000", // X brand color
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <XIcon />
              </IconButton>
            )}

            {discord && (
              <IconButton
                size="small"
                onClick={() => handleSocialClick(discord)}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "#5865F2", // Discord brand color
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <DiscordIcon />
              </IconButton>
            )}

            {website && (
              <IconButton
                size="small"
                onClick={() => handleSocialClick(website)}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "#007ACC", // Website link color
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <WebsiteIcon />
              </IconButton>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
