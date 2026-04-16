import { Avatar, Typography, Box, Stack, IconButton, Button, TextField } from "@mui/material";
import { truncateAddress } from "@/lib/stringUtils";
import { useEffect, useState, useRef } from "react";
import { TZKT_API } from "@/lib/api";
import { useConnection } from "@/packages/providers";
import { useT } from "@/lib/i18n/useT";

const DIRECTUS_URL = (process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS || "https://data.kairos-mint.art").replace("/items", "");

// SVG Icons
const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
);
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
);
const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
);
const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" /></svg>
);
const WebsiteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SOCIAL_FIELDS = [
  { key: "instagram", icon: InstagramIcon, label: "Instagram", hoverColor: "#E4405F" },
  { key: "twitter", icon: TwitterIcon, label: "Twitter", hoverColor: "#1DA1F2" },
  { key: "x", icon: XIcon, label: "X", hoverColor: "#000" },
  { key: "discord", icon: DiscordIcon, label: "Discord", hoverColor: "#5865F2" },
  { key: "website", icon: WebsiteIcon, label: "Website", hoverColor: "#007ACC" },
];

export default function WalletProfile({ address, walletInfo }) {
  const t = useT();
  const { address: myAddress } = useConnection();
  const isOwner = address && myAddress && address === myAddress;

  // Determine if artist (Wallet table) or general user (userWallets)
  const isArtist = !!(walletInfo?.status || walletInfo?.introduction !== undefined);

  const [displayName, setDisplayName] = useState(null);
  const [avatarText, setAvatarText] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [localIntro, setLocalIntro] = useState(null);
  const [localSocials, setLocalSocials] = useState(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIntro, setEditIntro] = useState("");
  const [editSocials, setEditSocials] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Default: truncated address
  // 2. TZKT alias
  // 3. Directus Wallet.name (artist) or userWallets.alias (general)
  useEffect(() => {
    setDisplayName(truncateAddress(address));
    setAvatarText(address.substring(address.length - 4));
    setAvatarSrc(`https://services.tzkt.io/v1/avatars/${address}`);

    TZKT_API(`/v1/accounts/${address}`).then((account) => {
      if (account?.alias) {
        setDisplayName(account.alias);
        setAvatarText(account.alias.substring(0, 1));
      }
    }).catch(() => {});
  }, [address]);

  // Override with Directus data if available
  useEffect(() => {
    if (!walletInfo) return;
    // Both tables now use name field
    const dirName = walletInfo.name;
    if (dirName) setDisplayName(dirName);
    if (walletInfo.avatar) {
      setAvatarSrc(`${DIRECTUS_URL}/assets/${walletInfo.avatar}`);
    }
  }, [walletInfo, isArtist]);

  const introduction = localIntro ?? walletInfo?.introduction;
  const socials = localSocials ?? walletInfo ?? {};

  const ensureProtocol = (url) => {
    if (!url) return null;
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  };

  const hasSocialMedia = SOCIAL_FIELDS.some(({ key }) => socials[key]);

  // --- Edit handlers ---
  const handleStartEdit = () => {
    setEditName(displayName || "");
    setEditIntro(introduction || "");
    setEditSocials({
      instagram: socials.instagram || "",
      twitter: socials.twitter || "",
      x: socials.x || "",
      discord: socials.discord || "",
      website: socials.website || "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Avatar must be under 2MB"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { address };

      if (isArtist) {
        // Wallet table: name, introduction, socials
        if (editName !== (walletInfo?.name || "")) body.name = editName.trim();
        if (editIntro !== (walletInfo?.introduction || "")) body.introduction = editIntro;
        for (const { key } of SOCIAL_FIELDS) {
          if (editSocials[key] !== (walletInfo?.[key] || "")) body[key] = editSocials[key];
        }
      } else {
        // userWallets: name only
        if (editName !== (walletInfo?.name || "")) body.name = editName.trim();
      }

      if (avatarFile) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(avatarFile);
        });
        body.avatarBase64 = base64;
        body.avatarMime = avatarFile.type;
      }

      const res = await fetch("/api/updateWalletProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        if (body.name !== undefined) {
          setDisplayName(body.name || truncateAddress(address));
        }
        if (body.introduction !== undefined) setLocalIntro(body.introduction);
        if (data.data?.avatarUrl) setAvatarSrc(data.data.avatarUrl);
        // Update local socials
        const newSocials = {};
        for (const { key } of SOCIAL_FIELDS) {
          if (body[key] !== undefined) newSocials[key] = body[key];
        }
        if (Object.keys(newSocials).length > 0) {
          setLocalSocials((prev) => ({ ...(prev || walletInfo || {}), ...newSocials }));
        }
        setEditing(false);
      } else {
        console.error("Save failed:", data.error);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 8, flexDirection: { xs: "column", sm: "row" } }}>
      {/* Avatar */}
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Avatar
          variant="rounded"
          src={editing && avatarPreview ? avatarPreview : avatarSrc}
          sx={{ width: 120, height: 120, "& img": { objectFit: "contain", p: 1 } }}
        >
          {avatarText}
        </Avatar>
        {editing && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            <Button
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{ position: "absolute", bottom: -4, left: 0, right: 0, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--brand-secondary)", background: "rgba(255,255,255,0.9)", borderRadius: 0, minHeight: 0, py: 0.5 }}
            >
              {t.common?.upload || "Upload"}
            </Button>
          </>
        )}
      </Box>

      {/* Info */}
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0, maxWidth: "65ch" }}>
        {/* Name */}
        {editing ? (
          <TextField
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={isArtist ? "Display name" : (t.wallet?.aliasPlaceholder || "Display name")}
            size="small"
            fullWidth
            sx={{ maxWidth: 300 }}
          />
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              {displayName}
            </Typography>
            {isOwner && (
              <IconButton size="small" onClick={handleStartEdit} sx={{ color: "text.secondary", opacity: 0.5 }}>
                <EditIcon />
              </IconButton>
            )}
          </Box>
        )}

        {/* Save / Cancel */}
        {editing && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="contained" onClick={handleSave} disabled={saving} sx={{ fontSize: 11, textTransform: "uppercase" }}>
              {saving ? (t.common?.saving || "Saving...") : (t.common?.save || "Save")}
            </Button>
            <Button size="small" variant="outlined" onClick={handleCancel} disabled={saving} sx={{ fontSize: 11, textTransform: "uppercase" }}>
              {t.common?.cancel || "Cancel"}
            </Button>
          </Box>
        )}

        {/* Address */}
        <Typography
          variant="body2"
          component="a"
          href={`https://tzkt.io/${address}/operations/`}
          target="_blank"
          rel="noopener noreferrer"
          color="text.secondary"
          sx={{ fontFamily: "monospace", fontSize: "0.875rem", textDecoration: "none", "@media (hover: hover)": { "&:hover": { textDecoration: "underline" } } }}
        >
          {address}
        </Typography>

        {/* Introduction (artist only) */}
        {editing && isArtist ? (
          <TextField
            value={editIntro}
            onChange={(e) => setEditIntro(e.target.value)}
            placeholder={t.wallet?.introPlaceholder || "Write something about yourself..."}
            multiline
            rows={8}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          />
        ) : introduction ? (
          <Box
            sx={{
              mt: 1,
              "& p": { color: "text.secondary", lineHeight: 1.6, mb: 1, "&:last-child": { mb: 0 } },
              "& strong": { fontWeight: 600, color: "text.primary" },
              "& a": { color: "primary.main", textDecoration: "none", "@media (hover: hover)": { "&:hover": { textDecoration: "underline" } } },
            }}
            dangerouslySetInnerHTML={{ __html: introduction }}
          />
        ) : null}

        {/* Social media — edit or display */}
        {editing && isArtist ? (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {SOCIAL_FIELDS.map(({ key, label }) => (
              <TextField
                key={key}
                value={editSocials[key] || ""}
                onChange={(e) => setEditSocials((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={label}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ fontSize: 10, opacity: 0.4, mr: 1, whiteSpace: "nowrap" }}>
                      {label}
                    </Typography>
                  ),
                }}
              />
            ))}
          </Stack>
        ) : hasSocialMedia ? (
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            {SOCIAL_FIELDS.map(({ key, icon: Icon, hoverColor }) => {
              const url = socials[key];
              if (!url) return null;
              return (
                <IconButton
                  key={key}
                  size="small"
                  onClick={() => { const u = ensureProtocol(url); if (u) window.open(u, "_blank", "noopener,noreferrer"); }}
                  sx={{
                    color: "text.secondary",
                    transition: "all 0.2s ease-in-out",
                    "@media (hover: hover)": { "&:hover": { color: hoverColor, transform: "scale(1.1)" } },
                  }}
                >
                  <Icon />
                </IconButton>
              );
            })}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
