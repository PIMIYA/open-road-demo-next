import { useState, useRef, useEffect, useCallback } from "react";
import { Box, IconButton, Typography, Slider } from "@mui/material";
import { useT } from "@/lib/i18n/useT";

const BRAND = "#ed5024";

// Inline SVG icons
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="6 3 20 12 6 21" />
  </svg>
);
const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
);
const SkipBackIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);
const SkipForwardIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);
const VolumeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);
const MuteIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);
const FullscreenIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 00-2 2v3" /><path d="M21 8V5a2 2 0 00-2-2h-3" /><path d="M3 16v3a2 2 0 002 2h3" /><path d="M16 21h3a2 2 0 002-2v-3" />
  </svg>
);

const labelSx = {
  fontSize: "10px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  opacity: 0.5,
};

const btnSx = {
  width: 32,
  height: 32,
  minWidth: 32,
  borderRadius: 0,
  color: "inherit",
};

const sliderSx = {
  height: 2,
  color: BRAND,
  "& .MuiSlider-thumb": { width: 8, height: 8, borderRadius: 0 },
  "& .MuiSlider-rail": { opacity: 0.2 },
};

const formatTime = (seconds) => {
  if (!seconds || !isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function VideoViewer({ src, mimeType, poster }) {
  const t = useT();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setCurrentTime(video.currentTime);
    const onMeta = () => setDuration(video.duration);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      const e = video.error;
      setError(e?.message || t.nft.videoNotSupported);
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch((err) => setError(err.message || t.nft.videoNotSupported)); else v.pause();
  }, []);

  const handleSeek = useCallback((_, val) => {
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  }, []);

  const handleVolume = useCallback((_, val) => {
    if (videoRef.current) {
      videoRef.current.volume = val / 100;
      setVolume(val);
      setIsMuted(val === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const skip = useCallback((sec) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + sec));
    }
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  }, []);

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      {/* Video */}
      <Box sx={{ bgcolor: "black", position: "relative", cursor: "pointer" }} onClick={togglePlay}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", display: error ? "none" : "block" }}
        />
        {error && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, px: 3 }}>
            <Typography sx={{ ...labelSx, color: "grey.500", textAlign: "center" }}>{error}</Typography>
          </Box>
        )}
      </Box>

      {/* Controls */}
      <Box sx={{ borderTop: "1px solid", borderColor: "divider", px: 1.5, py: 1.5 }}>
        {/* Progress */}
        <Slider
          value={currentTime}
          onChange={handleSeek}
          max={duration || 1}
          step={0.1}
          size="small"
          sx={{ ...sliderSx, p: 0, mb: 1.5 }}
        />

        {/* Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" onClick={() => skip(-10)} sx={btnSx}>
              <SkipBackIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={togglePlay}
              sx={{ ...btnSx, border: "1px solid", borderColor: isPlaying ? BRAND : "divider", color: isPlaying ? BRAND : "inherit" }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <IconButton size="small" onClick={() => skip(10)} sx={btnSx}>
              <SkipForwardIcon />
            </IconButton>
            <Typography sx={{ ...labelSx, ml: 1 }}>{formatTime(currentTime)} / {formatTime(duration)}</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={toggleMute} sx={btnSx}>
              {isMuted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
            </IconButton>
            <Slider
              value={isMuted ? 0 : volume}
              onChange={handleVolume}
              max={100}
              step={1}
              size="small"
              sx={{ ...sliderSx, width: 80 }}
            />
            <Box sx={{ width: "1px", height: 16, bgcolor: "divider", mx: 0.5 }} />
            <IconButton size="small" onClick={toggleFullscreen} sx={btnSx}>
              <FullscreenIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Info Bar */}
      <Box sx={{ borderTop: "1px solid", borderColor: "divider", px: 1.5, py: 0.5, display: "flex", justifyContent: "space-between" }}>
        <Typography sx={labelSx}>{t.nft.format}: {(mimeType || "").split("/")[1]?.toUpperCase() || "VIDEO"}</Typography>
        <Typography sx={labelSx}>{t.nft.duration}: {formatTime(duration)}</Typography>
      </Box>
    </Box>
  );
}
