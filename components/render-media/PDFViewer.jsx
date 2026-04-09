import { useState, useEffect, useRef, useCallback } from "react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { useT } from "@/lib/i18n/useT";

const BRAND = "#ed5024";
const BRAND_BG = "rgba(237, 80, 36, 0.08)";

// Inline SVG icons
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6 6" />
  </svg>
);
const ZoomInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const ZoomOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const FullscreenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 00-2 2v3" /><path d="M21 8V5a2 2 0 00-2-2h-3" /><path d="M3 16v3a2 2 0 002 2h3" /><path d="M16 21h3a2 2 0 002-2v-3" />
  </svg>
);
const ExitFullscreenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" />
  </svg>
);

const labelSx = {
  fontSize: "10px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  opacity: 0.5,
};

const btnSx = {
  width: 28,
  height: 28,
  minWidth: 28,
  borderRadius: 0,
  color: "inherit",
};

const BASE_WIDTH = 595;

/** Render a single PDF page to a canvas element */
async function renderPageToCanvas(pdf, pageNum, baseScale, canvas) {
  const page = await pdf.getPage(pageNum);
  const dpr = window.devicePixelRatio || 1;
  const renderViewport = page.getViewport({ scale: baseScale * dpr });
  const displayViewport = page.getViewport({ scale: baseScale });

  canvas.width = renderViewport.width;
  canvas.height = renderViewport.height;
  canvas.style.width = `${displayViewport.width}px`;
  canvas.style.height = `${displayViewport.height}px`;

  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
}

export default function PDFViewer({ src }) {
  const t = useT();
  const [totalPages, setTotalPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const allPagesRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load PDF document once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist/build/pdf");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        let pdf;
        try {
          const loadingTask = pdfjsLib.getDocument(src);
          loadingTask.onProgress = ({ loaded, total }) => {
            if (!cancelled && total > 0) setProgress(Math.round((loaded / total) * 100));
          };
          pdf = await loadingTask.promise;
        } catch {
          const res = await fetch(src);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const total = Number(res.headers.get("content-length")) || 0;
          const reader = res.body.getReader();
          const chunks = [];
          let loaded = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            if (!cancelled && total > 0) setProgress(Math.round((loaded / total) * 100));
          }
          const buf = new Uint8Array(loaded);
          let offset = 0;
          for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.length; }

          if (cancelled) return;
          const loadingTask = pdfjsLib.getDocument({ data: buf.buffer });
          pdf = await loadingTask.promise;
        }

        if (cancelled) return;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
      } catch (err) {
        console.error("PDF load error:", err);
        if (!cancelled) setError("Failed to load PDF");
      }
    })();

    return () => { cancelled = true; };
  }, [src]);

  // Render current page to canvas (normal mode)
  useEffect(() => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas || !totalPages || isFullscreen) return;

    let cancelled = false;

    (async () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }

      const page = await pdf.getPage(currentPage);
      if (cancelled) return;

      const dpr = window.devicePixelRatio || 1;
      // Fit to container width on small screens, use BASE_WIDTH on desktop
      const containerWidth = canvasRef.current?.parentElement?.parentElement?.clientWidth;
      const fitWidth = containerWidth && containerWidth < BASE_WIDTH + 64
        ? containerWidth - 32
        : BASE_WIDTH;
      const baseScale = (fitWidth / page.getViewport({ scale: 1 }).width) * (zoom / 100);
      const renderViewport = page.getViewport({ scale: baseScale * dpr });
      const displayViewport = page.getViewport({ scale: baseScale });

      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      canvas.style.width = `${displayViewport.width}px`;
      canvas.style.height = `${displayViewport.height}px`;

      const ctx = canvas.getContext("2d");
      const renderTask = page.render({ canvasContext: ctx, viewport: renderViewport });
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (err) {
        if (err.name !== "RenderingCancelledException") {
          console.error("Page render error:", err);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [currentPage, zoom, totalPages, isFullscreen]);

  // Render ALL pages when entering fullscreen
  useEffect(() => {
    const pdf = pdfDocRef.current;
    const container = allPagesRef.current;
    if (!pdf || !container || !totalPages || !isFullscreen) return;

    let cancelled = false;

    (async () => {
      // Clear existing canvases
      container.innerHTML = "";

      const firstPage = await pdf.getPage(1);
      // Fit to container width (minus padding) so PDF fills the screen on mobile
      const containerWidth = container.parentElement?.clientWidth || window.innerWidth;
      const fitWidth = containerWidth - 32; // 16px padding on each side
      const pageWidth = firstPage.getViewport({ scale: 1 }).width;
      const baseScale = (fitWidth / pageWidth) * (zoom / 100);

      for (let i = 1; i <= totalPages; i++) {
        if (cancelled) return;
        const canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.marginBottom = "16px";
        canvas.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
        container.appendChild(canvas);

        try {
          await renderPageToCanvas(pdf, i, baseScale, canvas);
        } catch (err) {
          if (!cancelled) console.error(`Page ${i} render error:`, err);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [isFullscreen, zoom, totalPages]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= (totalPages || 1)) setCurrentPage(page);
  }, [totalPages]);

  // Listen for native fullscreen changes
  useEffect(() => {
    const onFs = () => {
      const inFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(inFs);
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
      const exitFn = document.exitFullscreen || document.webkitExitFullscreen;
      if (exitFn) exitFn.call(document);
    } else {
      const reqFn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (reqFn) {
        reqFn.call(el);
      } else {
        // Fallback for browsers without Fullscreen API (e.g., some iOS versions)
        setIsFullscreen(true);
      }
    }
  }, []);

  // Exit simulated fullscreen with Escape key
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  return (
    <Box
      ref={containerRef}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        ...(isFullscreen && {
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          border: "none",
        }),
      }}
    >
      {/* Controls */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 1.5, py: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "action.hover", flexShrink: 0 }}>
        {/* Page nav (hidden in fullscreen — all pages visible) */}
        {!isFullscreen && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} sx={btnSx}>
              <ChevronLeft />
            </IconButton>
            <TextField
              type="number"
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              size="small"
              inputProps={{ min: 1, max: totalPages || 1, style: { textAlign: "center", fontSize: "11px", padding: "2px 4px", width: 32 } }}
              sx={{
                "& .MuiOutlinedInput-root": { height: 28 },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND },
              }}
            />
            <Typography sx={labelSx}>/ {totalPages || "..."}</Typography>
            <IconButton size="small" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= (totalPages || 1)} sx={btnSx}>
              <ChevronRight />
            </IconButton>
          </Box>
        )}
        {isFullscreen && (
          <Typography sx={labelSx}>{totalPages || "..."} {t.nft.pages}</Typography>
        )}

        {/* Zoom + Fullscreen */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography sx={{ ...labelSx, mr: 1 }}>{zoom}%</Typography>
          <IconButton size="small" onClick={() => setZoom((z) => Math.max(z - 25, 50))} disabled={zoom <= 50} sx={btnSx}>
            <ZoomOutIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setZoom((z) => Math.min(z + 25, 200))} disabled={zoom >= 200} sx={btnSx}>
            <ZoomInIcon />
          </IconButton>
          <IconButton size="small" onClick={isFullscreen ? () => {
            const exitFn = document.exitFullscreen || document.webkitExitFullscreen;
            if (exitFn && (document.fullscreenElement || document.webkitFullscreenElement)) {
              exitFn.call(document);
            } else {
              setIsFullscreen(false);
            }
          } : toggleFullscreen} sx={btnSx}>
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* PDF Content */}
      {isFullscreen ? (
        /* Fullscreen: all pages scrollable */
        <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", p: 2, bgcolor: "grey.100" }}>
          <div ref={allPagesRef} style={{ display: "flex", flexDirection: "column", alignItems: "center" }} />
        </Box>
      ) : (
        /* Normal: single page */
        <Box sx={{ height: 700, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", p: 2, bgcolor: "grey.100", flex: 1 }}>
          {error ? (
            <Typography sx={{ ...labelSx, color: "error.main", mt: 4 }}>{error}</Typography>
          ) : !totalPages ? (
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography sx={labelSx}>Loading PDF...{progress > 0 && ` ${progress}%`}</Typography>
              {progress > 0 && (
                <Box sx={{ mt: 1, width: 200, height: 2, bgcolor: "divider", mx: "auto" }}>
                  <Box sx={{ height: "100%", width: `${progress}%`, bgcolor: BRAND, transition: "width 0.2s" }} />
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ boxShadow: 3 }}>
              <canvas ref={canvasRef} style={{ display: "block" }} />
            </Box>
          )}
        </Box>
      )}

      {/* Thumbnail strip (normal mode only) */}
      {!isFullscreen && totalPages && (
        <Box sx={{ borderTop: "1px solid", borderColor: "divider", px: 1.5, py: 1, bgcolor: "action.hover" }}>
          <Typography sx={{ ...labelSx, mb: 0.5 }}>{t.nft.pages}</Typography>
          <Box sx={{ display: "flex", gap: 0.5, overflowX: "auto", pb: 0.5 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Box
                key={page}
                onClick={() => setCurrentPage(page)}
                sx={{
                  flexShrink: 0,
                  width: 48,
                  height: 64,
                  border: "2px solid",
                  borderColor: currentPage === page ? BRAND : "divider",
                  bgcolor: currentPage === page ? BRAND_BG : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background-color 0.15s",
                  "@media (hover: hover)": { "&:hover": { borderColor: currentPage === page ? BRAND : "text.secondary" } },
                }}
              >
                <Typography sx={{ fontSize: "10px", opacity: currentPage === page ? 1 : 0.5, color: currentPage === page ? BRAND : "inherit", fontWeight: currentPage === page ? 700 : 400 }}>
                  {page}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Info bar (normal mode only) */}
      {!isFullscreen && (
        <Box sx={{ borderTop: "1px solid", borderColor: "divider", px: 1.5, py: 0.5, display: "flex", justifyContent: "space-between" }}>
          <Typography sx={labelSx}>{t.nft.format}: PDF</Typography>
          <Typography sx={labelSx}>{t.nft.pages}: {totalPages || "..."}</Typography>
        </Box>
      )}
    </Box>
  );
}
