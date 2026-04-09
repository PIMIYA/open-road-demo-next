import { useMemo, useState, useRef, useEffect } from "react";
import { Box } from "@mui/material";
import GenerativeCanvas from "./GenerativeCanvas";
import { calcTagWeights, calcCategoryDist } from "@/lib/canvas/config";
import { getShapePath } from "@/lib/canvas/drawShapes";
import { useT } from "@/lib/i18n/useT";

const EyeOpen = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/** Convert wallet NFT data → GenerativeCanvas format */
function toCanvasNfts(canvasData) {
  if (!canvasData || canvasData.length === 0) return [];
  return canvasData.map((d) => ({
    id: d.tokenId || d.id,
    tags: d.metadata?.tags || [],
    category: d.metadata?.category || "",
  }));
}

/** Draw the legend directly on a canvas overlay using drawShape */
function renderLegendCanvas(canvas, tagWeights, categoryDist, t) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.parentElement?.clientWidth || 200;
  const h = canvas.parentElement?.clientHeight || 400;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  // Legend panel background — left side, from top of canvas
  const panelX = 10;
  const panelY = 10;
  const panelW = 190;
  const lineH = 18;
  const rows = tagWeights.length + categoryDist.length + 2; // +2 for headers
  const panelH = rows * lineH + 28;

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(36,131,255,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  let y = panelY + 16;
  const iconX = panelX + 16;
  const textX = panelX + 44; // wider gap between icon and text
  const pctX = panelX + panelW - 10;

  // --- Tags section ---
  ctx.font = "bold 9px Manrope, sans-serif";
  ctx.fillStyle = "rgba(36,131,255,0.5)";
  ctx.textAlign = "left";
  ctx.fillText((t.wallet?.legendTags || "Tags").toUpperCase(), panelX + 10, y);
  y += lineH;

  ctx.font = "10px Manrope, sans-serif";
  for (const { tag, color, weight } of tagWeights) {
    // Color dot
    ctx.beginPath();
    ctx.arc(iconX, y - 3, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Tag name (translated)
    ctx.fillStyle = "#2483ff";
    ctx.textAlign = "left";
    const label = t.tagMap?.[tag] || tag;
    ctx.fillText(label.length > 14 ? label.slice(0, 13) + "…" : label, textX, y);

    // Percentage
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(36,131,255,0.4)";
    ctx.fillText(`${Math.round(weight * 100)}%`, pctX, y);

    y += lineH;
  }

  // --- Separator ---
  y += 2;
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.beginPath();
  ctx.moveTo(panelX + 8, y);
  ctx.lineTo(panelX + panelW - 8, y);
  ctx.stroke();
  y += 10;

  // --- Categories section ---
  ctx.font = "bold 9px Manrope, sans-serif";
  ctx.fillStyle = "rgba(36,131,255,0.5)";
  ctx.textAlign = "left";
  ctx.fillText((t.wallet?.legendCategories || "Categories").toUpperCase(), panelX + 10, y);
  y += lineH;

  ctx.font = "10px Manrope, sans-serif";
  for (const { category, shape, count } of categoryDist) {
    // Draw clean shape icon — clipped to icon area to prevent overlap
    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX + 4, y - 12, 32, 20);
    ctx.clip();
    const { segs } = getShapePath(shape, iconX, y - 3, 7);
    ctx.beginPath();
    for (const seg of segs) {
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
    }
    ctx.strokeStyle = "rgba(36,131,255,0.6)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // Category name (translated)
    ctx.fillStyle = "#2483ff";
    ctx.textAlign = "left";
    const catLabel = t.categoryMap?.[category] || category;
    ctx.fillText(catLabel.length > 14 ? catLabel.slice(0, 13) + "…" : catLabel, textX, y);

    // Count
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(36,131,255,0.4)";
    ctx.fillText(String(count), pctX, y);

    y += lineH;
  }
}

export default function WalletCanvas({ canvasData }) {
  const t = useT();
  const [showLegend, setShowLegend] = useState(true);
  const legendRef = useRef(null);

  const nfts = useMemo(() => toCanvasNfts(canvasData), [canvasData]);
  const tagWeights = useMemo(() => calcTagWeights(nfts), [nfts]);
  const categoryDist = useMemo(() => calcCategoryDist(nfts), [nfts]);

  // Draw legend on canvas overlay
  useEffect(() => {
    if (!showLegend) return;
    // Small delay to ensure parent has dimensions
    const timer = setTimeout(() => {
      renderLegendCanvas(legendRef.current, tagWeights, categoryDist, t);
    }, 100);
    return () => clearTimeout(timer);
  }, [showLegend, tagWeights, categoryDist, t]);

  // Redraw on resize
  useEffect(() => {
    if (!showLegend) return;
    const onResize = () => renderLegendCanvas(legendRef.current, tagWeights, categoryDist, t);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showLegend, tagWeights, categoryDist, t]);

  if (!nfts || nfts.length === 0) return null;

  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      {/* Eye toggle button — outside canvas, top-left */}
      <button
        onClick={() => setShowLegend((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: "none",
          padding: "4px 0",
          marginBottom: 6,
          cursor: "pointer",
          fontSize: 11,
          color: "var(--brand-primary)",
          opacity: showLegend ? 1 : 0.5,
        }}
      >
        {showLegend ? <EyeOpen /> : <EyeClosed />}
        <span>{t.wallet?.legendButton || "Categories / Tags"}</span>
      </button>

      {/* Canvas container */}
      <Box sx={{ position: "relative" }}>
        <GenerativeCanvas nfts={nfts} width={800} height={450} />

        {/* Legend canvas overlay */}
        {showLegend && (
          <canvas
            ref={legendRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}
      </Box>
    </Box>
  );
}
