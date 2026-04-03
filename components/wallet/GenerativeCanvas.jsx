import { useEffect, useRef } from "react";
import { calcTagWeights, CATEGORY_SHAPES } from "@/lib/canvas/config";
import { drawShape } from "@/lib/canvas/drawShapes";

const TWO_PI = Math.PI * 2;

const SHAPE_STYLE = {
  "展覽":                { filled: true,  sizeMult: 1.2 },
  "表演":                { filled: true,  sizeMult: 1.2 },
  "工作坊":              { filled: true,  sizeMult: 1.2 },
  "導覽":                { filled: false, sizeMult: 1.4 },
  "課程":                { filled: false, sizeMult: 1.4 },
  "黑客松":              { filled: false, sizeMult: 1.2 },
  "研討會／論壇／座談":  { filled: false, sizeMult: 1.7 },
  "研討會 / 論壇 / 座談": { filled: false, sizeMult: 1.7 },
  "節祭／展會／市集":    { filled: false, sizeMult: 1.7 },
  "分享會／同好會／見面會": { filled: false, sizeMult: 1.7 },
};

function hexToRgba(hex, a) {
  return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;
}

export default function GenerativeCanvas({ nfts = [], width = 800, height = 450 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nfts.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    let seed = nfts.length * 17 + (nfts[0]?.id?.charCodeAt?.(1) || 3) * 31;
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };
    const randRange = (min, max) => min + rand() * (max - min);

    const tagWeights = calcTagWeights(nfts);
    const n = nfts.length;

    // ═══════════════════════════════════════
    // 1. BACKGROUND — radial gradient wash (reverted)
    // ═══════════════════════════════════════
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, width, height);

    for (let pass = 0; pass < 4; pass++) {
      for (const { color, weight } of tagWeights) {
        const blobCount = Math.max(2, Math.round(weight * 10));
        for (let b = 0; b < blobCount; b++) {
          const bx = randRange(-width * 0.3, width * 1.3);
          const by = randRange(-height * 0.3, height * 1.3);
          const br = randRange(100, 300) + weight * 200;
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
          const a = 0.05 + weight * 0.06 + pass * 0.015;
          grad.addColorStop(0, hexToRgba(color, a));
          grad.addColorStop(0.4, hexToRgba(color, a * 0.6));
          grad.addColorStop(1, hexToRgba(color, 0));
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        }
      }
    }

    // Warm overlay
    const warmGrad = ctx.createRadialGradient(width * 0.3, height * 0.4, 0, width * 0.5, height * 0.5, width * 0.8);
    warmGrad.addColorStop(0, "rgba(255, 240, 215, 0.06)");
    warmGrad.addColorStop(1, "rgba(255, 240, 215, 0)");
    ctx.fillStyle = warmGrad;
    ctx.fillRect(0, 0, width, height);

    // Kandinsky accent circles
    ctx.save();
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(randRange(width * 0.1, width * 0.9), randRange(height * 0.1, height * 0.9),
        randRange(50, 180), 0, TWO_PI);
      ctx.strokeStyle = `rgba(0, 0, 0, ${randRange(0.02, 0.04)})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.restore();

    // Scratch lines — varying length, angle, some extend beyond canvas
    ctx.save();
    for (let i = 0; i < 12; i++) {
      const sx = randRange(-width * 0.2, width * 1.2);
      const sy = randRange(-height * 0.2, height * 1.2);
      const angle = randRange(-Math.PI, Math.PI);
      const len = randRange(60, 400);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
      ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
      ctx.lineWidth = randRange(0.2, 0.6);
      ctx.stroke();
    }
    ctx.restore();

    const bgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // ═══════════════════════════════════════
    // 2. POSITIONS — dispersed random
    // ═══════════════════════════════════════
    const pad = 50;
    const points = [];

    // Distribute points evenly across the canvas using a grid + jitter approach
    // This ensures full coverage rather than clustering in the center
    const cols = Math.ceil(Math.sqrt(n * (width / height)));
    const rows = Math.ceil(n / cols);
    const cellW = (width - pad * 2) / cols;
    const cellH = (height - pad * 2) / rows;

    const gridSlots = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        gridSlots.push({
          x: pad + col * cellW + cellW * 0.5,
          y: pad + row * cellH + cellH * 0.5,
        });
      }
    }

    // Shuffle grid slots
    for (let i = gridSlots.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [gridSlots[i], gridSlots[j]] = [gridSlots[j], gridSlots[i]];
    }

    // Place each NFT in a grid cell with jitter
    for (let i = 0; i < n; i++) {
      const slot = gridSlots[i % gridSlots.length];
      const jitterX = randRange(-cellW * 0.35, cellW * 0.35);
      const jitterY = randRange(-cellH * 0.35, cellH * 0.35);
      const x = Math.max(pad, Math.min(width - pad, slot.x + jitterX));
      const y = Math.max(pad, Math.min(height - pad, slot.y + jitterY));
      points.push({ x, y });
    }

    // Order points by proximity (nearest-neighbor) for natural trail path
    const ordered = [points[0]];
    const remaining = points.slice(1);
    while (remaining.length > 0) {
      const last = ordered[ordered.length - 1];
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = Math.hypot(remaining[i].x - last.x, remaining[i].y - last.y);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      }
      ordered.push(remaining.splice(nearestIdx, 1)[0]);
    }
    points.length = 0;
    points.push(...ordered);

    // ═══════════════════════════════════════
    // 3. SHAPE DATA
    // ═══════════════════════════════════════
    const shapes = nfts.map((nft, i) => {
      const cat = nft.category || nft.metadata?.category || "";
      const shapeType = CATEGORY_SHAPES[cat] || "scatter";
      const style = SHAPE_STYLE[cat] || { filled: false, sizeMult: 1.0 };
      const firstTag = (nft.tags || [])[0];
      const tw = tagWeights.find(t => t.tag === firstTag);
      const color = tw?.color || "#2483ff";
      const baseSize = randRange(25, 75) * 1.6 * style.sizeMult;

      return {
        idx: i, shapeType, color, size: baseSize,
        filled: style.filled,
        opacity: style.filled ? randRange(0.5, 0.85) : randRange(0.6, 1),
        lineWidth: style.filled ? 0 : randRange(0.8, 2.2),
        rotation: randRange(-Math.PI * 0.4, Math.PI * 0.4),
        point: points[i],
      };
    });

    // ═══════════════════════════════════════
    // 4. BEZIER SEGMENTS
    // ═══════════════════════════════════════
    const segments = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(n - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      segments.push({ p1, p2, cp1x, cp1y, cp2x, cp2y, steps: Math.max(40, Math.round(dist * 0.8)) });
    }

    // ═══════════════════════════════════════
    // 5. ANIMATION — progressive shape + trail drawing
    // ═══════════════════════════════════════
    let currentSeg = 0;
    let segStep = 0;
    const TRAIL_SPEED = 4;

    // Each shape has its own draw progress (0..1) — stroke animation
    const shapeProgress = new Float32Array(n);
    const shapeActive = new Uint8Array(n);
    shapeActive[0] = 1;
    const SHAPE_DRAW_SPEED = 0.03; // progress per frame (~33 frames to complete)

    function drawAllShapes() {
      const indices = [...Array(n).keys()].filter(i => shapeActive[i]);
      indices.sort((a, b) => shapes[b].size - shapes[a].size);

      for (const i of indices) {
        const s = shapes[i];
        drawShape(ctx, s.shapeType, s.point.x, s.point.y, s.size, s.color, {
          filled: s.filled,
          lineWidth: s.lineWidth,
          opacity: s.opacity,
          rotation: s.rotation,
          progress: shapeProgress[i],
        });
      }
      // Center dots for completed shapes
      for (const i of indices) {
        if (shapeProgress[i] >= 1) {
          ctx.beginPath();
          ctx.arc(shapes[i].point.x, shapes[i].point.y, 1.8, 0, TWO_PI);
          ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
          ctx.fill();
        }
      }
    }

    function drawTrail(upToSeg, upToStep) {
      ctx.save();
      for (let si = 0; si <= Math.min(upToSeg, segments.length - 1); si++) {
        const seg = segments[si];
        const maxStep = si < upToSeg ? seg.steps : upToStep;
        for (let s = 0; s < maxStep; s++) {
          const t = s / seg.steps;
          const u = 1 - t;
          const bx = u*u*u*seg.p1.x + 3*u*u*t*seg.cp1x + 3*u*t*t*seg.cp2x + t*t*t*seg.p2.x;
          const by = u*u*u*seg.p1.y + 3*u*u*t*seg.cp1y + 3*u*t*t*seg.cp2y + t*t*t*seg.p2.y;
          // Tighter scatter, higher alpha for clearer trail
          const scatter = 1.0 + Math.sin(s * 0.3 + si * 5) * 1.5;
          const dotAlpha = 0.08 + Math.abs(Math.sin(s * 0.08 + si)) * 0.25;
          const dotSize = 0.4 + Math.abs(Math.sin(s * 0.15)) * 0.5;
          // Multiple bristle passes for clarity
          for (let p = 0; p < 2; p++) {
            const px = Math.sin(s * 7.3 + si * 13 + p * 3.1) * scatter * (0.5 + p * 0.5);
            const py = Math.cos(s * 5.7 + si * 17 + p * 2.7) * scatter * (0.5 + p * 0.5);
            ctx.beginPath();
            ctx.arc(bx + px, by + py, dotSize, 0, TWO_PI);
            ctx.fillStyle = `rgba(0, 0, 0, ${dotAlpha})`;
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    function frame() {
      ctx.putImageData(bgData, 0, 0);

      // Advance shape draw progress for all active shapes
      for (let i = 0; i < n; i++) {
        if (shapeActive[i] && shapeProgress[i] < 1) {
          shapeProgress[i] = Math.min(1, shapeProgress[i] + SHAPE_DRAW_SPEED);
        }
      }

      drawAllShapes();
      drawTrail(currentSeg, segStep);

      // Advance trail
      let animating = false;
      if (currentSeg < segments.length) {
        segStep += TRAIL_SPEED;
        if (segStep >= segments[currentSeg].steps) {
          currentSeg++;
          segStep = 0;
          if (currentSeg < n) shapeActive[currentSeg] = 1;
        }
        animating = true;
      }

      // Check if any shape is still drawing
      for (let i = 0; i < n; i++) {
        if (shapeActive[i] && shapeProgress[i] < 1) { animating = true; break; }
      }

      if (animating) {
        animRef.current = requestAnimationFrame(frame);
      }
    }

    animRef.current = requestAnimationFrame(frame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [nfts, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "auto", borderRadius: 8, border: "1px solid var(--brand-primary)" }}
    />
  );
}
