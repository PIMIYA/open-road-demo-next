import { useState, useRef, useEffect, useCallback } from "react";
import { Box, IconButton, Typography, Slider } from "@mui/material";

const BRAND = "#ed5024";
const BRAND_BG = "rgba(237, 80, 36, 0.08)";

// Inline SVG icons
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="6 3 20 12 6 21" />
  </svg>
);
const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
);
const SmallPlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="6 3 20 12 6 21" />
  </svg>
);
const SmallPauseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
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
const RepeatIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
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

export default function AudioViewer({ src, title = "UNTITLED", artist = "" }) {
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (audio.loop) return;
      setIsPlaying(false);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = isRepeat;
  }, [isRepeat]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play(); else a.pause();
  }, []);

  const handleSeek = useCallback((_, val) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  }, []);

  const handleVolume = useCallback((_, val) => {
    if (audioRef.current) {
      audioRef.current.volume = val / 100;
      setVolume(val);
      setIsMuted(val === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const skip = useCallback((sec) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + sec));
    }
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const circumference = 2 * Math.PI * 45;

  return (
    <Box ref={containerRef} sx={{ border: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", bgcolor: "background.paper", ...(isFullscreen && { height: "100vh" }) }}>
      {/* Circular visualization */}
      <Box sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "action.hover",
        height: isFullscreen ? undefined : 200,
        flex: isFullscreen ? 1 : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>
        <Box sx={{ position: "relative", width: 128, height: 128 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" opacity={0.1} />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={BRAND}
              strokeWidth="1"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              style={{ transition: "stroke-dashoffset 0.2s" }}
              strokeLinecap="square"
            />
          </svg>
          <Box sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <IconButton
              onClick={togglePlay}
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "1px solid",
                borderColor: isPlaying ? BRAND : "divider",
                color: isPlaying ? BRAND : "inherit",
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Time */}
        <Box sx={{ position: "absolute", bottom: 12, display: "flex", gap: 0.5, alignItems: "center" }}>
          <Typography sx={labelSx}>{formatTime(currentTime)}</Typography>
          <Typography sx={{ ...labelSx, opacity: 0.3 }}>/</Typography>
          <Typography sx={labelSx}>{formatTime(duration)}</Typography>
        </Box>
      </Box>

      {/* Track info */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 1.5, py: 1.5 }}>
        <Typography sx={{ fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {title}
        </Typography>
        {artist && (
          <Typography sx={{ ...labelSx, mt: 0.25 }}>{artist}</Typography>
        )}
      </Box>

      {/* Controls */}
      <Box sx={{ px: 1.5, py: 1.5 }}>
        {/* Progress slider */}
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
            <IconButton
              size="small"
              onClick={() => setIsRepeat(!isRepeat)}
              sx={{ ...btnSx, bgcolor: isRepeat ? BRAND_BG : "transparent", color: isRepeat ? BRAND : "inherit" }}
            >
              <RepeatIcon />
            </IconButton>
            <IconButton size="small" onClick={() => skip(-10)} sx={btnSx}>
              <SkipBackIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={togglePlay}
              sx={{ ...btnSx, border: "1px solid", borderColor: isPlaying ? BRAND : "divider", color: isPlaying ? BRAND : "inherit" }}
            >
              {isPlaying ? <SmallPauseIcon /> : <SmallPlayIcon />}
            </IconButton>
            <IconButton size="small" onClick={() => skip(10)} sx={btnSx}>
              <SkipForwardIcon />
            </IconButton>
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
        <Typography sx={labelSx}>FORMAT: AUDIO</Typography>
        <Typography sx={labelSx}>DURATION: {formatTime(duration)}</Typography>
      </Box>

      <audio ref={audioRef} src={src} />
    </Box>
  );
}
