import { useEffect, useMemo, useRef, useState, useLayoutEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import MapFrame from "@/components/map-frame";
import MobileGestureTutorial from "@/components/MobileGestureTutorial";
import { useUIEnvironment } from "@/contexts/UIEnvironmentContext";
import CustomSelect from "@/components/CustomSelect";
import { FetchDirectusData } from "@/lib/api";
import { fetchCities as fetchCitiesApi, fetchSpotlightNfts as fetchSpotlightNftsApi } from "@/lib/map-api";

const nftPointRadius = 20;
const NFT_CONTRACT = "KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW";
const nftPointColor = { default: "#2483ff", selected: "#ff3300" };

const MAP_SERVER = process.env.NEXT_PUBLIC_MAP_SERVER || "http://localhost:3001";

/**
 * UI callout line geometry
 */
/**
 * Build a polyline path from anchor to target with a 45-degree chamfer at the bend.
 * Goes vertical first, then chamfers into horizontal.
 */
function chamferedElbowPoints(anchor, target, chamferSize = 50) {
  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;

  // If nearly aligned on one axis, draw a straight line
  if (Math.abs(dx) < 5 || Math.abs(dy) < 5) {
    return `${anchor.x},${anchor.y} ${target.x},${target.y}`;
  }

  // Clamp chamfer to half the shorter leg
  const chamfer = Math.min(chamferSize, Math.abs(dx) / 2, Math.abs(dy) / 2);
  const dirX = Math.sign(dx);
  const dirY = Math.sign(dy);

  // Vertical segment ends, chamfer begins
  const bendStartY = target.y - dirY * chamfer;
  // Chamfer ends, horizontal segment begins
  const bendEndX = anchor.x + dirX * chamfer;

  return `${anchor.x},${anchor.y} ${anchor.x},${bendStartY} ${bendEndX},${target.y} ${target.x},${target.y}`;
}

function anchorLineToRect(anchor, rect) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = cx - anchor.x;
  const dy = cy - anchor.y;

  const adx = Math.abs(dx) < 1e-6 ? 1e-6 : dx;
  const ady = Math.abs(dy) < 1e-6 ? 1e-6 : dy;

  const tx = rect.w / 2 / Math.abs(adx);
  const ty = rect.h / 2 / Math.abs(ady);
  const t = Math.min(tx, ty);

  return { x: cx - dx * t, y: cy - dy * t };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseViewBox(vb) {
  const s = (vb || "0 0 100 100")
    .trim()
    .split(/\s+/)
    .map(Number);
  const [x, y, width, height] = s.length === 4 && s.every(Number.isFinite) ? s : [0, 0, 100, 100];
  return { x, y, width, height };
}

function getMeetTransform(pixelW, pixelH, viewBox) {
  const scale = Math.min(pixelW / viewBox.width, pixelH / viewBox.height);
  const drawW = viewBox.width * scale;
  const drawH = viewBox.height * scale;
  const offsetX = (pixelW - drawW) / 2;
  const offsetY = (pixelH - drawH) / 2;
  return { scale, drawW, drawH, offsetX, offsetY };
}

function screenToMap(mouseX, mouseY, viewBox, t) {
  const x = clamp(mouseX, t.offsetX, t.offsetX + t.drawW);
  const y = clamp(mouseY, t.offsetY, t.offsetY + t.drawH);
  return {
    x: viewBox.x + (x - t.offsetX) / t.scale,
    y: viewBox.y + (y - t.offsetY) / t.scale,
  };
}

function mapToScreen(mapX, mapY, viewBox, t) {
  return {
    x: t.offsetX + (mapX - viewBox.x) * t.scale,
    y: t.offsetY + (mapY - viewBox.y) * t.scale,
  };
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
}

function resolveNftThumbnail(nft) {
  if (nft?.image_thumbnail) return nft.image_thumbnail;
  if (nft?.thumbnailUri) {
    const uri = nft.thumbnailUri;
    if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.slice(7)}`;
    return uri;
  }
  return null;
}

function venueKey(v) {
  const id = typeof v?.id === "string" ? v.id.trim() : "";
  if (id) return id;
  return String(v?.name || "");
}

function getVenueNameById(venueId, venues) {
  if (!venueId || !Array.isArray(venues)) return null;
  const venue = venues.find((v) => v.id === venueId);
  return venue?.name || null;
}

function enrichNftWithVenue(nft, venues) {
  if (!nft) return nft;
  const venueName = getVenueNameById(nft.venue_id, venues);
  return venueName ? { ...nft, venue: venueName } : nft;
}

function formatDateRange(fromString, toString) {
  if (!fromString && !toString) return "";
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const from = formatDate(fromString);
  const to = formatDate(toString);
  const range = from && to ? `${from} ~ ${to}` : from || to || "";
  if (!range) return "";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  return `${range} (${tz})`;
}

/**
 * Compute bubble placements using a greedy algorithm.
 * Places bubbles one by one, choosing the best candidate position
 * that minimizes overflow and overlap with already-placed bubbles.
 *
 * @param {Object} params
 * @param {number} params.containerW - Container width
 * @param {number} params.containerH - Container height
 * @param {Array<{id: string, x: number, y: number}>} params.anchors - Anchor points in screen coords
 * @param {Map<string, {w: number, h: number}>} params.bubbleSizes - Map of id -> bubble dimensions
 * @param {Object} params.options - Layout options
 * @returns {Map<string, {x: number, y: number, w: number, h: number}>} - Placement map
 */
function computeBubblePlacements({ containerW, containerH, anchors, bubbleSizes, options = {} }) {
  const {
    padding = 12,
    gap = 14,
    weights = { overflow: 100000, overlap: 10, lineLength: 0.2, move: 1 },
  } = options;

  const placements = new Map();
  const placedRects = [];

  // Sort anchors by distance to viewport center (closest first gets best spots)
  const centerX = containerW / 2;
  const centerY = containerH / 2;
  const sortedAnchors = [...anchors].sort((a, b) => {
    const distA = Math.hypot(a.x - centerX, a.y - centerY);
    const distB = Math.hypot(b.x - centerX, b.y - centerY);
    if (Math.abs(distA - distB) < 1) {
      // Tie-break by id for stability
      return String(a.id).localeCompare(String(b.id));
    }
    return distA - distB;
  });

  for (const anchor of sortedAnchors) {
    const size = bubbleSizes.get(anchor.id);
    if (!size) continue;

    const { w, h } = size;
    const ax = anchor.x;
    const ay = anchor.y;

    // Generate 8 candidate positions around the anchor
    const candidates = [
      // Primary 4 corners
      { rawX: ax + gap, rawY: ay - h - gap, name: "NE" },
      { rawX: ax + gap, rawY: ay + gap, name: "SE" },
      { rawX: ax - w - gap, rawY: ay - h - gap, name: "NW" },
      { rawX: ax - w - gap, rawY: ay + gap, name: "SW" },
      // Additional 4 edge-centered positions
      { rawX: ax - w / 2, rawY: ay - h - gap, name: "N" },
      { rawX: ax - w / 2, rawY: ay + gap, name: "S" },
      { rawX: ax + gap, rawY: ay - h / 2, name: "E" },
      { rawX: ax - w - gap, rawY: ay - h / 2, name: "W" },
    ];

    let bestCandidate = null;
    let bestScore = Infinity;

    for (const cand of candidates) {
      // Clamp to container bounds
      const xClamped = clamp(cand.rawX, padding, Math.max(padding, containerW - w - padding));
      const yClamped = clamp(cand.rawY, padding, Math.max(padding, containerH - h - padding));

      // A) Overflow cost (before clamp)
      const overflowLeft = Math.max(0, padding - cand.rawX);
      const overflowTop = Math.max(0, padding - cand.rawY);
      const overflowRight = Math.max(0, cand.rawX + w + padding - containerW);
      const overflowBottom = Math.max(0, cand.rawY + h + padding - containerH);
      const overflow = overflowLeft + overflowTop + overflowRight + overflowBottom;

      // B) Overlap cost (using clamped rect)
      let overlapAreaTotal = 0;
      for (const placed of placedRects) {
        const ix = Math.max(0, Math.min(xClamped + w, placed.x + placed.w) - Math.max(xClamped, placed.x));
        const iy = Math.max(0, Math.min(yClamped + h, placed.y + placed.h) - Math.max(yClamped, placed.y));
        overlapAreaTotal += ix * iy;
      }

      // C) Leader line length cost
      const bubbleCenterX = xClamped + w / 2;
      const bubbleCenterY = yClamped + h / 2;
      const lineLength = Math.hypot(bubbleCenterX - ax, bubbleCenterY - ay);

      // D) Movement cost (prefer minimal clamp shift)
      const moveCost = Math.hypot(cand.rawX - xClamped, cand.rawY - yClamped);

      // Final score
      const score =
        overflow * weights.overflow +
        overlapAreaTotal * weights.overlap +
        lineLength * weights.lineLength +
        moveCost * weights.move;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = { x: xClamped, y: yClamped, w, h };
      }
    }

    if (bestCandidate) {
      placements.set(anchor.id, bestCandidate);
      placedRects.push(bestCandidate);
    }
  }

  return placements;
}

/**
 * NftCallout - renders a single bubble at a computed position
 */
function NftCalloutPositioned({ placement, anchor, nft, onClose }) {
  const router = useRouter();
  if (!placement) return null;

  const { x, y, w, h } = placement;
  const rect = { x, y, w, h };
  const lineEnd = anchorLineToRect(anchor, rect);

  return (
    <>
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8,  }}>
        <circle cx={anchor.x} cy={anchor.y} r={4} fill={"var(--brand-secondary)"} opacity={0.9} />
        <polyline
          points={chamferedElbowPoints(anchor, lineEnd)}
          fill="none"
          stroke={"var(--brand-secondary)"}
          strokeWidth={2}
          opacity={0.9}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.3)",
          backdropFilter: "blur(2px)",
          border: "1px solid var(--brand-secondary)",
          borderRadius: 10,
          padding: 14,
          maxWidth: 360,
          color: "var(--brand-primary)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
          pointerEvents: "auto",
          cursor: nft?.token_id != null ? "pointer" : "default",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (nft?.token_id != null) {
            router.push(`/claimsToken/${NFT_CONTRACT}/${nft.token_id}`);
          }
        }}
      >
        {/* NFT Thumbnail */}
        {resolveNftThumbnail(nft) && (
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", maxHeight: 150, overflow: "hidden" }}>
            <Image
              src={resolveNftThumbnail(nft)}
              alt={nft?.name || "NFT thumbnail"}
              width={150}
              height={150}
              style={{
                objectFit: "contain",
                borderRadius: 8,
                maxHeight: 150,
                width: "auto",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: "bold",
              color: "var(--brand-secondary)",
              lineHeight: 1.2,
            }}
          >
            {nft?.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "var(--brand-secondary)",
              padding: 0,
              lineHeight: 1,
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label="close"
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {nft?.event_title && (
            <div>
              <div style={{ fontSize: 10, color: "var(--brand-secondary)", marginBottom: 4 }}>活動</div>
              <div style={{ fontSize: 14 }}>{nft.event_title}</div>
            </div>
          )}

          {Array.isArray(nft?.creators) && nft.creators.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: "var(--brand-secondary)", marginBottom: 4 }}>藝術家</div>
              <div style={{ fontSize: 14 }}>{nft.creators.join(", ")}</div>
            </div>
          )}

          {nft?.venue && (
            <div>
              <div style={{ fontSize: 10, color: "var(--brand-secondary)", marginBottom: 4 }}>場館</div>
              <div style={{ fontSize: 14 }}>{nft.venue}</div>
              {(nft?.start_time || nft?.end_time) && (
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                  {formatDateRange(nft.start_time, nft.end_time)}
                </div>
              )}
            </div>
          )}

          {nft?.category && (
            <div>
              <div style={{ fontSize: 10, color: "var(--brand-secondary)", marginBottom: 4 }}>類別</div>
              <div style={{ fontSize: 14 }}>{nft.category}</div>
            </div>
          )}

          {Array.isArray(nft?.tags) && nft.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {nft.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "rgba(36, 131, 255, 0.2)",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Hidden bubble for measuring size
 */
function BubbleMeasurer({ nft, onMeasure }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    if (r.width && r.height) {
      onMeasure(nft.id, { w: Math.round(r.width), h: Math.round(r.height) });
    }
  }, [nft?.id, nft?.name, nft?.event_title, nft?.venue, nft?.category, nft?.image_thumbnail, nft?.thumbnailUri, onMeasure]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        visibility: "hidden",
        pointerEvents: "none",
        zIndex: -1,
        background: "rgba(255, 255, 255, 0.3)",
        border: "1px solid var(--brand-secondary)",
        borderRadius: 10,
        padding: 14,
        maxWidth: 360,
        color: "var(--brand-primary)",
      }}
    >
      {/* NFT Thumbnail placeholder for measurement */}
      {resolveNftThumbnail(nft) && (
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 150, height: 150, borderRadius: 8 }} />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: "bold", lineHeight: 1.2 }}>
          {nft?.name}
        </h3>
        <span style={{ width: 22, height: 22, flexShrink: 0 }}>×</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {nft?.event_title && (
          <div>
            <div style={{ fontSize: 10, marginBottom: 4 }}>活動</div>
            <div style={{ fontSize: 14 }}>{nft.event_title}</div>
          </div>
        )}
        {Array.isArray(nft?.creators) && nft.creators.length > 0 && (
          <div>
            <div style={{ fontSize: 10, marginBottom: 4 }}>藝術家</div>
            <div style={{ fontSize: 14 }}>{nft.creators.join(", ")}</div>
          </div>
        )}
        {nft?.venue && (
          <div>
            <div style={{ fontSize: 10, marginBottom: 4 }}>場館</div>
            <div style={{ fontSize: 14 }}>{nft.venue}</div>
            {(nft?.start_time || nft?.end_time) && (
              <div style={{ fontSize: 12, marginTop: 2 }}>
                {formatDateRange(nft.start_time, nft.end_time)}
              </div>
            )}
          </div>
        )}
        {nft?.category && (
          <div>
            <div style={{ fontSize: 10, marginBottom: 4 }}>類別</div>
            <div style={{ fontSize: 14 }}>{nft.category}</div>
          </div>
        )}
        {Array.isArray(nft?.tags) && nft.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {nft.tags.map((tag, idx) => (
              <span key={idx} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10 }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SpotlightStack - horizontal coverflow-style NFT carousel.
 * Shows NFT thumbnails in a 3D perspective strip with auto-play (3s).
 * Swipe left/right or tap to select. Tap active item to navigate.
 */
const COVERFLOW_VISIBLE = 5;

// Shortest signed distance from `from` to `to` on a circular array of length `len`
function shortestWrap(from, to, len) {
  const d = ((to - from) % len + len) % len;
  return d <= len / 2 ? d : d - len;
}

function SpotlightStack({ nfts, anchors, onClose }) {
  const router = useRouter();
  const widgetRef = useRef(null);
  const svgRef = useRef(null);
  const [widgetRect, setWidgetRect] = useState(null);
  const [windowH, setWindowH] = useState(typeof window !== "undefined" ? window.innerHeight : 800);
  const [windowW, setWindowW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const autoPlayRef = useRef(null);
  const inertiaRef = useRef(null);

  // Continuous float position — THE single source of truth for rendering.
  // Integer part = center item index, fractional part = sub-item offset.
  const [floatPos, setFloatPos] = useState(0);
  const floatRef = useRef(0); // mirror for RAF loops (avoids stale closures)
  const velRef = useRef(0);
  const draggingRef = useRef(false);

  const compact = windowW <= 600;
  const nn = nfts?.length || 0;
  const wrap = (i) => ((i % nn) + nn) % nn;
  const selectedIndex = nn > 0 ? wrap(Math.round(floatPos)) : 0;

  const coverWidth = compact ? Math.round(windowW * 0.9) : Math.round(windowW * 0.38);
  const itemSize = compact ? Math.min(Math.round(coverWidth * 0.38), 120) : Math.min(Math.round(coverWidth * 0.42), 180);
  const spacing = itemSize * 0.55;

  useEffect(() => {
    const onResize = () => { setWindowH(window.innerHeight); setWindowW(window.innerWidth); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    if (!svgRef.current || !widgetRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const r = widgetRef.current.getBoundingClientRect();
    setWidgetRect({ x: r.left - svgRect.left, y: r.top - svgRect.top, w: r.width, h: r.height });
  }, [nfts, floatPos, windowW, windowH]);

  const anchorMap = useMemo(() => {
    const map = {};
    for (const a of anchors || []) map[a.id] = a;
    return map;
  }, [anchors]);

  // --- Auto-play with smooth animation ---
  const autoAnimRef = useRef(null);
  const stopAutoAnim = () => { if (autoAnimRef.current) { cancelAnimationFrame(autoAnimRef.current); autoAnimRef.current = null; } };

  const animateToNext = useCallback(() => {
    if (draggingRef.current) return;
    stopAutoAnim();
    const target = Math.round(floatRef.current) + 1;
    const tick = () => {
      const diff = target - floatRef.current;
      if (Math.abs(diff) < 0.005) {
        floatRef.current = target;
        setFloatPos(target);
        return;
      }
      floatRef.current += diff * 0.08; // ease-out speed
      setFloatPos(floatRef.current);
      autoAnimRef.current = requestAnimationFrame(tick);
    };
    autoAnimRef.current = requestAnimationFrame(tick);
  }, []);

  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(animateToNext, 3000);
  }, [animateToNext]);

  useEffect(() => {
    if (nn > 1) resetAutoPlay();
    return () => { clearInterval(autoPlayRef.current); stopAutoAnim(); };
  }, [resetAutoPlay, nn]);

  // --- Drag + inertia (pointer events for desktop & mobile) ---
  const dragState = useRef({ startX: 0, lastX: 0, lastTime: 0 });

  const stopInertia = () => { if (inertiaRef.current) { cancelAnimationFrame(inertiaRef.current); inertiaRef.current = null; } };

  const onDragStart = (e) => {
    stopInertia();
    stopAutoAnim();
    draggingRef.current = true;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    dragState.current = { startX: x, lastX: x, lastTime: performance.now() };
    velRef.current = 0;
    if (e.type === "pointerdown") { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} }
  };

  const onDragMove = (e) => {
    if (!draggingRef.current) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const now = performance.now();
    const dt = now - dragState.current.lastTime;
    const dx = x - dragState.current.lastX;

    if (dt > 0) {
      const instantV = dx / dt; // px/ms
      velRef.current = velRef.current * 0.65 + instantV * 0.35; // EMA smoothing
    }

    // Update float position proportional to pixel drag
    floatRef.current -= dx / spacing;
    setFloatPos(floatRef.current);

    dragState.current.lastX = x;
    dragState.current.lastTime = now;
  };

  const onDragEnd = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (e.type === "pointerup" || e.type === "pointercancel") {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    // Convert px/ms velocity → items/frame (16ms)
    // Clamp max velocity so fast swipes don't skip too many items
    const rawV = -(velRef.current / spacing) * 16;
    let v = Math.sign(rawV) * Math.min(Math.abs(rawV), 0.6);

    // If very slow, just snap to nearest
    if (Math.abs(v) < 0.005) {
      floatRef.current = Math.round(floatRef.current);
      setFloatPos(floatRef.current);
      resetAutoPlay();
      return;
    }

    // Physics inertia loop: high friction for controlled deceleration
    const friction = 0.92;
    const tick = () => {
      v *= friction;
      floatRef.current += v;
      setFloatPos(floatRef.current);

      if (Math.abs(v) < 0.002) {
        // Smooth snap to nearest integer
        const target = Math.round(floatRef.current);
        const snapTick = () => {
          const diff = target - floatRef.current;
          if (Math.abs(diff) < 0.005) {
            floatRef.current = target;
            setFloatPos(target);
            resetAutoPlay();
            return;
          }
          floatRef.current += diff * 0.2; // ease-out snap
          setFloatPos(floatRef.current);
          inertiaRef.current = requestAnimationFrame(snapTick);
        };
        inertiaRef.current = requestAnimationFrame(snapTick);
        return;
      }
      inertiaRef.current = requestAnimationFrame(tick);
    };
    inertiaRef.current = requestAnimationFrame(tick);
  };

  // --- Click handler (distinguish tap vs drag) ---
  const handleItemClick = (idx, itemNft) => {
    const dx = Math.abs(dragState.current.lastX - dragState.current.startX);
    if (dx > 8) return; // was a drag, not a tap
    if (idx === selectedIndex && itemNft.token_id != null) {
      router.push(`/claimsToken/${NFT_CONTRACT}/${itemNft.token_id}`);
    } else {
      stopInertia();
      // Animate to clicked item
      const target = floatRef.current + shortestWrap(selectedIndex, idx, nn);
      const snapTo = () => {
        const diff = target - floatRef.current;
        if (Math.abs(diff) < 0.005) {
          floatRef.current = target;
          setFloatPos(target);
          resetAutoPlay();
          return;
        }
        floatRef.current += diff * 0.15;
        setFloatPos(floatRef.current);
        inertiaRef.current = requestAnimationFrame(snapTo);
      };
      inertiaRef.current = requestAnimationFrame(snapTo);
    }
  };

  if (!nfts || nn === 0) return null;

  const nft = nfts[selectedIndex] || nfts[0];
  const anchor = anchorMap[nft?.id];
  const frac = floatPos - Math.round(floatPos); // -0.5 to 0.5

  // Build visible items: up to 4 on each side, but never exceed nn to avoid duplicate keys
  const halfRange = Math.min(4, Math.floor((nn - 1) / 2));
  const visibleItems = [];
  const seenIdx = new Set();
  for (let off = -halfRange; off <= halfRange; off++) {
    const idx = wrap(Math.round(floatPos) + off);
    if (seenIdx.has(idx)) continue; // skip duplicates for small arrays
    seenIdx.add(idx);
    const contOff = off - frac;
    visibleItems.push({ idx, contOff, nft: nfts[idx] });
  }

  return (
    <>
      <svg ref={svgRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8, width: "100%", height: "100%" }}>
        {anchor && widgetRect && (
          <g>
            <circle cx={anchor.x} cy={anchor.y} r={3} fill="var(--brand-secondary)" opacity={0.7} />
            <polyline
              points={chamferedElbowPoints(anchor, compact ? { x: widgetRect.x + widgetRect.w / 2, y: widgetRect.y - 3 } : { x: widgetRect.x, y: widgetRect.y + widgetRect.h / 2 })}
              fill="none" stroke="var(--brand-secondary)" strokeWidth={1} opacity={0.7}
            />
          </g>
        )}
      </svg>

      <div
        style={{
          position: "absolute",
          bottom: compact ? 70 : "auto",
          top: compact ? "auto" : 0,
          right: compact ? 0 : 0,
          width: compact ? "100%" : "40%",
          height: compact ? "auto" : "100%",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: compact ? "flex-end" : "center",
          zIndex: 10, pointerEvents: "none",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={widgetRef}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          style={{
            position: "relative", width: coverWidth, pointerEvents: "auto",
            overflow: "hidden", background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(2px)", border: "1px solid var(--brand-secondary)",
            borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            touchAction: "pan-y", cursor: "grab",
            userSelect: "none", WebkitUserSelect: "none",
            padding: "10px 0 8px",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--brand-secondary)", fontWeight: "bold", padding: "0 12px 6px", pointerEvents: "none" }}>
            近期活動
          </div>

          {/* Coverflow strip — all positions driven by continuous floatPos */}
          <div style={{ position: "relative", height: itemSize + 16, perspective: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {visibleItems.map(({ idx, contOff, nft: itemNft }) => {
              const abs = Math.abs(contOff);
              const thumbUrl = resolveNftThumbnail(itemNft);
              const tx = contOff * spacing;
              const rotateY = contOff < -0.05 ? Math.min(35, abs * 35) : contOff > 0.05 ? Math.max(-35, -abs * 35) : 0;
              const scale = Math.max(0.6, 1 - abs * 0.12);
              const opacity = Math.max(0.15, 1 - abs * 0.25);
              const zIdx = Math.round(10 - abs);

              return (
                <div
                  key={idx}
                  onClick={() => handleItemClick(idx, itemNft)}
                  style={{
                    position: "absolute", width: itemSize, height: itemSize,
                    transform: `translateX(${tx}px) rotateY(${rotateY}deg) scale(${scale})`,
                    zIndex: zIdx, cursor: "pointer", opacity,
                    borderRadius: 8, overflow: "hidden", border: "none",
                    boxShadow: abs < 0.5 ? "0 4px 16px rgba(237,80,36,0.15)" : "none",
                    background: "transparent",
                    willChange: "transform, opacity",
                  }}
                >
                  {thumbUrl ? (
                    <Image src={thumbUrl} alt={itemNft.name || "NFT"} width={itemSize * 2} height={itemSize * 2}
                      style={{ objectFit: "contain", width: "100%", height: "100%", pointerEvents: "none" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#999", padding: 4, textAlign: "center" }}>
                      {itemNft.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            onClick={() => { if (nft?.token_id != null) router.push(`/claimsToken/${NFT_CONTRACT}/${nft.token_id}`); }}
            style={{
              padding: "8px 12px 2px", fontSize: 13, fontWeight: "bold",
              color: "var(--brand-secondary)", textAlign: "center",
              cursor: nft?.token_id != null ? "pointer" : "default",
              textDecoration: nft?.token_id != null ? "underline" : "none",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {nft?.name}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "6px 0 2px" }}>
            {nfts.map((_, idx) => (
              <div
                key={idx}
                onClick={() => handleItemClick(idx, nfts[idx])}
                style={{
                  width: idx === selectedIndex ? 12 : 5, height: 5, borderRadius: 3,
                  background: idx === selectedIndex ? "var(--brand-secondary)" : "rgba(0,0,0,0.15)",
                  cursor: "pointer", transition: "width 0.3s ease, background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * VenueNftCarousel - fixed-position modal for venue-selected state.
 * Shows one NFT at a time with prev/next navigation and full detail fields.
 * Positioned on the right 1/3 of the screen, vertically centered.
 */
function VenueNftCarousel({ nfts, onClose, compact = false }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchRef = useRef({ startX: 0, startY: 0, swiping: false });
  const modalRef = useRef(null);

  // Reset index when nfts change (e.g., different venue selected)
  useEffect(() => {
    setCurrentIndex(0);
  }, [nfts]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchRef.current = { startX: touch.clientX, startY: touch.clientY, swiping: false };
  }, []);

  const handleTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - touchRef.current.startX;
    const dy = e.touches[0].clientY - touchRef.current.startY;
    // If horizontal movement is dominant, mark as swiping and prevent scroll
    if (!touchRef.current.swiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      touchRef.current.swiping = true;
    }
    if (touchRef.current.swiping) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchRef.current.swiping) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const threshold = 40;
    if (dx < -threshold) {
      setCurrentIndex((i) => (i + 1) % nfts.length);
    } else if (dx > threshold) {
      setCurrentIndex((i) => (i - 1 + nfts.length) % nfts.length);
    }
  }, [nfts.length]);

  // Attach touchmove with { passive: false } so preventDefault works
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, [handleTouchMove]);

  if (!nfts || nfts.length === 0) return null;

  const nft = nfts[currentIndex];
  const goPrev = () => setCurrentIndex((i) => (i - 1 + nfts.length) % nfts.length);
  const goNext = () => setCurrentIndex((i) => (i + 1) % nfts.length);

  return (
    <div
      style={{
        position: "absolute",
        top: compact ? 0 : 0,
        left: compact ? 0 : "auto",
        right: compact ? 0 : 0,
        width: compact ? "100%" : "33.33%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        pointerEvents: "none",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={modalRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          width: 280,
          maxHeight: "80vh",
          overflowY: "auto",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(2px)",
          border: "1px solid var(--brand-secondary)",
          borderRadius: 10,
          padding: 12,
          color: "var(--brand-primary)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
          pointerEvents: "auto",
        }}
      >
        {/* Close button row */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "var(--brand-secondary)",
              padding: 0,
              lineHeight: 1,
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="close"
          >
            ×
          </button>
        </div>

        {/* Thumbnail */}
        {resolveNftThumbnail(nft) && (
          <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", maxHeight: 150, overflow: "hidden" }}>
            <Image
              src={resolveNftThumbnail(nft)}
              alt={nft?.name || "NFT"}
              width={150}
              height={150}
              style={{ objectFit: "contain", width: "100%", maxHeight: 150, borderRadius: 8 }}
            />
          </div>
        )}

        {/* Name */}
        <h3
          style={{
            margin: "0 0 6px 0",
            fontSize: 16,
            fontWeight: "bold",
            color: "var(--brand-secondary)",
            lineHeight: 1.6,
          }}
        >
          {nft?.name}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Date range */}
          {(nft?.start_time || nft?.end_time) && (
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>{formatDateRange(nft.start_time, nft.end_time)}</div>
          )}

          {/* Creators */}
          {Array.isArray(nft?.creators) && nft.creators.length > 0 && (
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <span style={{ color: "var(--brand-secondary)", marginRight: 6 }}>藝術家</span>
              {nft.creators.join(", ")}
            </div>
          )}

          {/* Venue */}
          {nft?.venue && (
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <span style={{ color: "var(--brand-secondary)", marginRight: 6 }}>場館</span>
              {nft.venue}
            </div>
          )}

          {/* Category */}
          {nft?.category && (
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <span style={{ color: "var(--brand-secondary)", marginRight: 6 }}>類別</span>
              {nft.category}
            </div>
          )}

          {/* Tags */}
          {Array.isArray(nft?.tags) && nft.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
              {nft.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--brand-primary)",
                    padding: "2px 8px",
                    borderRadius: 2,
                    fontSize: 10,
                    lineHeight: 1.6,
                    color: "var(--brand-primary)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Read more link */}
        {nft?.token_id != null && (
          <button
            onClick={() => router.push(`/claimsToken/${NFT_CONTRACT}/${nft.token_id}`)}
            style={{
              display: "block",
              marginTop: 8,
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 12,
              color: "var(--brand-secondary)",
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            [ 閱讀更多 ]
          </button>
        )}

        {/* Carousel navigation */}
        {nfts.length > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginTop: 8,
              paddingTop: 6,
              borderTop: "1px solid rgba(36, 131, 255, 0.2)",
            }}
          >
            <button
              onClick={goPrev}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: "var(--brand-secondary)",
                padding: "2px 8px",
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              {currentIndex + 1} / {nfts.length}
            </span>
            <button
              onClick={goNext}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: "var(--brand-secondary)",
                padding: "2px 8px",
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * BubbleLayoutManager - measures bubbles and computes optimal placements
 */
function BubbleLayoutManager({ containerW, containerH, nfts, anchors, onClose }) {
  const [bubbleSizes, setBubbleSizes] = useState(new Map());

  const handleMeasure = useCallback((id, size) => {
    setBubbleSizes((prev) => {
      const next = new Map(prev);
      next.set(id, size);
      return next;
    });
  }, []);

  // Compute placements when all sizes are ready
  const placements = useMemo(() => {
    // Check if all bubbles have been measured
    const allMeasured = nfts.every((nft) => bubbleSizes.has(nft.id));
    if (!allMeasured || !containerW || !containerH) {
      return new Map();
    }

    return computeBubblePlacements({
      containerW,
      containerH,
      anchors,
      bubbleSizes,
    });
  }, [containerW, containerH, anchors, bubbleSizes, nfts]);

  // Create anchor lookup
  const anchorMap = useMemo(() => {
    const map = new Map();
    for (const a of anchors) {
      map.set(a.id, a);
    }
    return map;
  }, [anchors]);

  return (
    <>
      {/* Hidden measurers */}
      {nfts.map((nft) => (
        <BubbleMeasurer key={`measure-${nft.id}`} nft={nft} onMeasure={handleMeasure} />
      ))}

      {/* Rendered bubbles with computed positions */}
      {nfts.map((nft) => {
        const placement = placements.get(nft.id);
        const anchor = anchorMap.get(nft.id);
        if (!placement || !anchor) return null;

        return (
          <NftCalloutPositioned
            key={nft.id}
            placement={placement}
            anchor={anchor}
            nft={nft}
            onClose={() => onClose(nft.id)}
          />
        );
      })}
    </>
  );
}

/**
 * Page state model
 * - Single source of truth:
 *   - "data" are normalized per-city slug (cities/maps/venues/events/nfts)
 *   - "selection" and "filters" are also stored per-city slug
 * - All derived UI options come from useMemo selectors (no duplicated filter logic)
 */
/**
 * Get a rotation batch of NFTs via continuous round-robin across venues.
 * Position advances through venues cyclically; each venue's NFTs wrap independently.
 *
 * Example (5 venues, 3 NFTs each, batchSize=3):
 *   step 0 → [A.1, B.1, C.1]
 *   step 1 → [D.1, E.1, A.2]
 *   step 2 → [B.2, C.2, D.2]
 *   step 3 → [E.2, A.3, B.3]
 *   step 4 → [C.3, D.3, E.3]
 */
function BoundaryMapPage({ artists = [], directusEvents = [], spotlightByCity = {} }) {
  const router = useRouter();
  const { isMobileUI, isSmallViewport } = useUIEnvironment();

  // Build wallet address → artist name lookup from Directus artists
  const artistNameMap = useMemo(() => {
    const map = new Map();
    for (const a of artists) {
      if (a.address && a.name) {
        map.set(a.address, a.name);
      }
    }
    return map;
  }, [artists]);

  // Resolve creator addresses to artist names
  const resolveCreatorName = useCallback(
    (address) => artistNameMap.get(address) || address,
    [artistNameMap]
  );

  const [cities, setCities] = useState([]);
  const [currentCityIndex, setCurrentCityIndex] = useState(0);

  const [cityMaps, setCityMaps] = useState({});
  // Initialize cityNfts from SSR spotlight data (avoids client-side fetch)
  const [cityNfts, setCityNfts] = useState(() => {
    const initial = {};
    for (const [slug, nfts] of Object.entries(spotlightByCity)) {
      initial[slug] = nfts;
    }
    return initial;
  });
  const [cityVenues, setCityVenues] = useState({});
  const [cityEvents, setCityEvents] = useState({});

  const [selectedVenue, setSelectedVenue] = useState({});
  const [carouselOpen, setCarouselOpen] = useState({});
  const [selectedEvent, setSelectedEvent] = useState({});
  const [filtersByCity, setFiltersByCity] = useState({});

  // All spotlight NFTs per city: { [citySlug]: nft[] }
  const [openBubbleNfts, setOpenBubbleNfts] = useState(() => {
    const initial = {};
    for (const [slug, nfts] of Object.entries(spotlightByCity)) {
      initial[slug] = nfts;
    }
    return initial;
  });

  // Mobile gesture tutorial animation state
  const [isTutorialAnimating, setIsTutorialAnimating] = useState(false);

  // Collapsible filter menu for narrow screens
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const containerRefs = useRef({});
  const canvasRefs = useRef({});
  const [containerSizes, setContainerSizes] = useState({});

  // Pure width-based narrow check (≤600px), independent of device detection
  const [isNarrowWidth, setIsNarrowWidth] = useState(false);
  useEffect(() => {
    const check = () => setIsNarrowWidth(window.innerWidth <= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewBoxStartRef = useRef(null);
  const currentPanningCity = useRef(null);

  // Mobile pan optimization: refs for RAF batching
  const pendingViewBoxRef = useRef(null);
  const rafIdRef = useRef(null);

  // Pinch-to-zoom refs
  const pinchRef = useRef({ active: false, initialDist: 0, initialVB: null, city: null });

  const currentCity = cities[currentCityIndex];
  const currentSlug = currentCity?.slug;
  const currentVenueSelected = selectedVenue?.[currentSlug];

  // Mobile UI mode: Overview (no selection) vs Focused (venue or event selected)
  // Used for conditional visibility of filters, MapFrame, and city dots
  const isMobileFocusedMode = useMemo(() => {
    if (!isMobileUI || !currentSlug) return false;
    const hasVenueSelected = !!selectedVenue?.[currentSlug];
    const hasEventSelected = !!selectedEvent?.[currentSlug];
    return hasVenueSelected || hasEventSelected;
  }, [isMobileUI, currentSlug, selectedVenue, selectedEvent]);

  const currentFilters = useMemo(() => {
    if (!currentSlug) return null;
    return (
      filtersByCity[currentSlug] || {
        tag: "",
        category: "",
        creator: "",
        year: "",
        month: "",
        week: "",
        day: "",
        activityStatus: { past: true, ongoing: true, future: true },
      }
    );
  }, [filtersByCity, currentSlug]);

  // Count active filters for badge on collapsed filter button
  const activeFilterCount = useMemo(() => {
    if (!currentFilters) return 0;
    let count = 0;
    if (currentFilters.tag) count++;
    if (currentFilters.category) count++;
    if (currentFilters.creator) count++;
    if (currentFilters.year) count++;
    if (currentFilters.month) count++;
    if (currentFilters.day) count++;
    if (!currentFilters.activityStatus.past) count++;
    if (!currentFilters.activityStatus.ongoing) count++;
    if (!currentFilters.activityStatus.future) count++;
    return count;
  }, [currentFilters]);

  const setCurrentFilters = (updater) => {
    if (!currentSlug) return;
    setFiltersByCity((prev) => {
      const base =
        prev[currentSlug] || {
          tag: "",
          category: "",
          creator: "",
          year: "",
          month: "",
          week: "",
          day: "",
          activityStatus: { past: true, ongoing: true, future: true },
        };
      const next = typeof updater === "function" ? updater(base) : updater;
      return { ...prev, [currentSlug]: next };
    });
    if (selectedVenue?.[currentSlug]) {
      setCarouselOpen((prev) => ({ ...prev, [currentSlug]: true }));
    }
  };

  const resolveVenueId = (slug) => {
    const key = selectedVenue?.[slug] || "";
    if (!key) return null;
    const venues = cityVenues?.[slug]?.venues || [];
    const v = venues.find((x) => venueKey(x) === key);
    return v?.id || null;
  };

  const filteredEvents = useMemo(() => {
    if (!currentSlug) return [];
    const allEvents = cityEvents?.[currentSlug]?.events || [];
    const venueId = resolveVenueId(currentSlug);
    if (!venueId) return allEvents;
    return allEvents.filter((ev) => ev?.venue_id === venueId);
  }, [currentSlug, cityEvents, selectedVenue, cityVenues]);

  const filteredNfts = useMemo(() => {
    if (!currentSlug || !currentFilters) return [];
    const allNfts = cityNfts?.[currentSlug] || [];

    const venueId = resolveVenueId(currentSlug);
    const eventId = selectedEvent?.[currentSlug] || "";

    const now = new Date();

    return allNfts.filter((nft) => {
      if (venueId && nft.venue_id !== venueId) return false;
      if (eventId && nft.event_id !== eventId) return false;

      if (currentFilters.tag && (!Array.isArray(nft.tags) || !nft.tags.includes(currentFilters.tag)))
        return false;
      if (currentFilters.category && nft.category !== currentFilters.category) return false;
      if (
        currentFilters.creator &&
        (!Array.isArray(nft.creators) || !nft.creators.map(resolveCreatorName).includes(currentFilters.creator))
      )
        return false;

      const from = nft?.start_time ? new Date(nft.start_time) : null;
      const to = nft?.end_time ? new Date(nft.end_time) : null;

      if (from && to) {
        if (currentFilters.year && from.getFullYear().toString() !== currentFilters.year) return false;

        if (currentFilters.month) {
          const monthKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
          if (monthKey !== currentFilters.month) return false;
        }

        if (currentFilters.week) {
          const wkStart = getWeekStart(from);
          const wkKey = `${wkStart.getFullYear()}-W${getWeekNumber(wkStart)}`;
          if (wkKey !== currentFilters.week) return false;
        }

        if (currentFilters.day) {
          const dayKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(
            from.getDate()
          ).padStart(2, "0")}`;
          if (dayKey !== currentFilters.day) return false;
        }

        const isPast = to < now;
        const isOngoing = from <= now && to >= now;
        const isFuture = from > now;

        if (isPast && !currentFilters.activityStatus.past) return false;
        if (isOngoing && !currentFilters.activityStatus.ongoing) return false;
        if (isFuture && !currentFilters.activityStatus.future) return false;
      }

      return true;
    });
  }, [currentSlug, cityNfts, selectedVenue, selectedEvent, currentFilters, cityVenues]);

  const filterOptions = useMemo(() => {
    if (!currentSlug) {
      return { tags: [], categories: [], creators: [], years: [], months: [], weeks: [], days: [] };
    }

    // Use city NFTs filtered only by venue/event (structural selection),
    // NOT by dimension filters (tag, category, creator, time).
    // This ensures all dropdown options remain visible regardless of other filter selections.
    const allNfts = cityNfts?.[currentSlug] || [];
    const venueId = resolveVenueId(currentSlug);
    const eventId = selectedEvent?.[currentSlug] || "";
    const base = allNfts.filter((nft) => {
      if (venueId && nft.venue_id !== venueId) return false;
      if (eventId && nft.event_id !== eventId) return false;
      return true;
    });

    const tags = new Set();
    const categories = new Set();
    const creators = new Set();
    const years = new Set();
    const months = new Set();
    const weeks = new Set();
    const days = new Set();

    const selectedYear = currentFilters?.year ? parseInt(currentFilters.year, 10) : null;
    const selectedMonth = currentFilters?.month || null;

    for (const nft of base) {
      if (Array.isArray(nft.tags)) nft.tags.forEach((t) => tags.add(t));
      if (nft.category) categories.add(nft.category);
      if (Array.isArray(nft.creators)) nft.creators.forEach((c) => creators.add(resolveCreatorName(c)));

      if (nft?.start_time) {
        const d = new Date(nft.start_time);
        const y = d.getFullYear();
        years.add(String(y));

        if (!selectedYear || y === selectedYear) {
          const monthKey = `${y}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          months.add(monthKey);

          const wkStart = getWeekStart(d);
          const wkKey = `${wkStart.getFullYear()}-W${getWeekNumber(wkStart)}`;
          weeks.add(wkKey);

          if (!selectedMonth || monthKey === selectedMonth) {
            const dayKey = `${y}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            days.add(dayKey);
          }
        }
      }
    }

    const sortAlpha = (a, b) => String(a).localeCompare(String(b));
    return {
      tags: Array.from(tags).sort(sortAlpha),
      categories: Array.from(categories).sort(sortAlpha),
      creators: Array.from(creators).sort(sortAlpha),
      years: Array.from(years).sort(sortAlpha),
      months: Array.from(months).sort(sortAlpha),
      weeks: Array.from(weeks).sort(sortAlpha),
      days: Array.from(days).sort(sortAlpha),
    };
  }, [currentSlug, cityNfts, selectedVenue, selectedEvent, cityVenues, currentFilters]);

  // Load cities
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await fetch(`${MAP_SERVER}/api/cities`);
        if (!res.ok) throw new Error(`Failed to load cities: ${res.status}`);
        const citiesData = await res.json();
        setCities(citiesData);

        const initialMaps = {};
        for (const city of citiesData) {
          initialMaps[city.slug] = { svgInner: "", mapBounds: null, viewBox: null, loaded: false };
        }
        setCityMaps(initialMaps);

        setFiltersByCity((prev) => {
          const next = { ...prev };
          for (const city of citiesData) {
            if (!next[city.slug]) {
              next[city.slug] = {
                tag: "",
                category: "",
                creator: "",
                year: "",
                month: "",
                week: "",
                day: "",
                activityStatus: { past: true, ongoing: true, future: true },
              };
            }
          }
          return next;
        });
      } catch (err) {
        console.error("Load cities failed", err);
      }
    }
    loadCities();
  }, []);

  // ResizeObserver per city container
  useEffect(() => {
    if (cities.length === 0) return;
    const observers = [];

    for (const city of cities) {
      const slug = city.slug;
      const el = containerRefs.current[slug];
      if (!el) continue;
      const ro = new ResizeObserver((entries) => {
        for (const ent of entries) {
          const cr = ent.contentRect;
          const w = Math.round(cr.width);
          const h = Math.round(cr.height);
          // Sanity check: ignore if dimensions are 0 or unreasonably large
          if (w <= 0 || h <= 0 || w > 10000 || h > 10000) return;
          setContainerSizes((prev) => {
            // Avoid unnecessary updates if size hasn't changed
            if (prev[slug]?.w === w && prev[slug]?.h === h) return prev;
            return { ...prev, [slug]: { w, h } };
          });
        }
      });
      ro.observe(el);
      observers.push(ro);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [cities]);

  // Load city SVG on demand
  useEffect(() => {
    if (cities.length === 0) return;
    const city = cities[currentCityIndex];
    if (!city) return;
    const slug = city.slug;
    if (cityMaps?.[slug]?.loaded) return;

    let cancelled = false;

    async function loadCitySVG() {
      try {
        const svgRes = await fetch(`${MAP_SERVER}/api/map/${slug}`);
        if (!svgRes.ok) throw new Error(`Failed to load SVG for ${slug}: ${svgRes.status}`);

        const svgText = await svgRes.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const svgEl = doc.querySelector("svg");
        if (!svgEl) return;

        const vb = parseViewBox(svgEl.getAttribute("viewBox") || "0 0 100 100");
        const bounds = { x: vb.x, y: vb.y, width: vb.width, height: vb.height };

        const paddingScale = 1.15;
        const initialViewBox = {
          x: bounds.x - (bounds.width * (paddingScale - 1)) / 2,
          y: bounds.y - (bounds.height * (paddingScale - 1)) / 2,
          width: bounds.width * paddingScale,
          height: bounds.height * paddingScale,
        };

        if (cancelled) return;

        setCityMaps((prev) => ({
          ...prev,
          [slug]: {
            svgInner: svgEl.innerHTML,
            mapBounds: bounds,
            viewBox: initialViewBox,
            loaded: true,
          },
        }));
      } catch (err) {
        console.error(`Load SVG for ${slug} failed`, err);
      }
    }

    loadCitySVG();
    return () => {
      cancelled = true;
    };
  }, [cities, currentCityIndex, cityMaps]);

  // Ensure all spotlight NFTs are loaded when city changes
  useEffect(() => {
    if (!currentSlug || currentVenueSelected) return;
    const allNfts = spotlightByCity[currentSlug] || [];
    if (allNfts.length === 0) return;
    setOpenBubbleNfts((prev) => {
      if (prev[currentSlug]?.length === allNfts.length) return prev;
      return { ...prev, [currentSlug]: allNfts };
    });
  }, [currentSlug, currentVenueSelected, spotlightByCity]);

  // Load venues list per city (cached)
  useEffect(() => {
    if (cities.length === 0) return;
    const city = cities[currentCityIndex];
    if (!city) return;
    const slug = city.slug;

    if (cityVenues?.[slug]?.loaded) return;

    let cancelled = false;

    async function loadCityVenues() {
      try {
        const venuesRes = await fetch(`${MAP_SERVER}/api/venues-list/${slug}`);
        if (cancelled) return;

        if (!venuesRes.ok) {
          if (venuesRes.status === 404) {
            setCityVenues((prev) => ({ ...prev, [slug]: { venues: [], loaded: true } }));
            return;
          }
          throw new Error(`Failed to load venues for ${slug}: ${venuesRes.status}`);
        }

        const venuesData = await venuesRes.json();
        if (cancelled) return;

        setCityVenues((prev) => ({ ...prev, [slug]: { venues: Array.isArray(venuesData) ? venuesData : [], loaded: true } }));
      } catch (err) {
        if (cancelled) return;
        console.error(`Load venues for ${slug} failed`, err);
        setCityVenues((prev) => ({ ...prev, [slug]: { venues: [], loaded: true } }));
      }
    }

    loadCityVenues();
    return () => {
      cancelled = true;
    };
  }, [cities, currentCityIndex, cityVenues]);

  // Handle ?venue=xxx&city=xxx query params (e.g. deep-link from claimsToken page)
  useEffect(() => {
    const { venue: qVenue, city: qCity } = router.query;
    if (!qVenue || !qCity) return;
    if (cities.length === 0) return;

    const cityIndex = cities.findIndex((c) => c.slug === qCity);
    if (cityIndex === -1) return;

    // Switch to the target city first
    if (currentCityIndex !== cityIndex) {
      setCurrentCityIndex(cityIndex);
      return; // wait for venues to load after city switch
    }

    const slug = qCity;
    const venues = cityVenues?.[slug]?.venues || [];
    if (!cityVenues?.[slug]?.loaded) return; // venues not loaded yet

    const venue = venues.find((v) => v.id === qVenue);
    if (!venue) return;

    // Focus the venue (same as clicking it on the map)
    const vKey = venueKey(venue);
    setSelectedVenue((prev) => ({ ...prev, [slug]: vKey }));
    setCarouselOpen((prev) => ({ ...prev, [slug]: true }));
    setSelectedEvent((prev) => ({ ...prev, [slug]: "" }));
    zoomToVenue(slug, venue);
    fetchVenueNfts(slug, venue.id);

    // Clear query params so it doesn't re-trigger
    router.replace("/", undefined, { shallow: true });
  }, [router.query, cities, currentCityIndex, cityVenues]);

  // Initialize events per city from Directus data (grouped via venue_id → city)
  // Waits for venues to load so we can determine which events belong to which city
  useEffect(() => {
    if (cities.length === 0 || !directusEvents.length) return;
    const city = cities[currentCityIndex];
    if (!city) return;
    const slug = city.slug;

    // Need venues loaded first to know which venue_ids belong to this city
    if (!cityVenues?.[slug]?.loaded) return;
    if (cityEvents?.[slug]?.loaded) return;

    const venueIds = new Set((cityVenues[slug].venues || []).map((v) => v.id));
    const eventsForCity = directusEvents.filter((e) => venueIds.has(e.venue_id));

    setCityEvents((prev) => ({
      ...prev,
      [slug]: { events: eventsForCity, loaded: true },
    }));
  }, [cities, currentCityIndex, directusEvents, cityVenues, cityEvents]);

  /**
   * Draw NFTs
   * - NFT data uses Y-up coordinate system, SVG uses Y-down
   * - Must flip Y using: mapY = H - svgY
   */
  useEffect(() => {
    if (!currentSlug) return;

    const cityMap = cityMaps[currentSlug];
    if (!cityMap?.viewBox || !cityMap?.mapBounds) return;

    const size = containerSizes[currentSlug];
    if (!size?.w || !size?.h) return;

    const canvasEl = canvasRefs.current[currentSlug];
    if (!canvasEl) return;

    const pixelW = size.w;
    const pixelH = size.h;

    const viewBox = cityMap.viewBox;
    const t = getMeetTransform(pixelW, pixelH, viewBox);

    const dpr = window.devicePixelRatio || 1;
    canvasEl.style.width = `${pixelW}px`;
    canvasEl.style.height = `${pixelH}px`;
    canvasEl.width = Math.round(pixelW * dpr);
    canvasEl.height = Math.round(pixelH * dpr);

    const ctx = canvasEl.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, pixelW, pixelH);

    const H = cityMap.mapBounds.height;
    const openIds = new Set((openBubbleNfts[currentSlug] || []).map((n) => n.id));

    // Draw all NFT translucent fills first, then strokes + dots on top.
    // Use a separate offscreen canvas so overlapping circles don't stack alpha.
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.round(pixelW * dpr);
    offscreen.height = Math.round(pixelH * dpr);
    const oCtx = offscreen.getContext("2d");
    oCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Pass 1: draw all fills onto offscreen with globalCompositeOperation
    // "source-over" first circle, then "lighter" would add — but we want max, not add.
    // Trick: draw opaque circles, then composite the offscreen onto main at reduced alpha.
    for (const nft of filteredNfts) {
      const mapX = nft.svgX;
      const mapY = H - nft.svgY;
      const { x: sx, y: sy } = mapToScreen(mapX, mapY, viewBox, t);
      const isSelected = openIds.has(nft.id);
      const r = isSelected ? nftPointRadius * 1.3 : nftPointRadius;
      const color = isSelected ? nftPointColor.selected : nftPointColor.default;
      oCtx.beginPath();
      oCtx.arc(sx, sy, r, 0, Math.PI * 2);
      oCtx.fillStyle = color;
      oCtx.fill();
    }

    // Composite offscreen fills at 0.4 alpha onto main canvas
    // Reset transform so drawImage maps pixel-to-pixel (offscreen already has dpr scaling baked in)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.4;
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();

    // Pass 2: strokes and center dots directly on main canvas (deduplicated)
    const drawn = new Set();
    for (const nft of filteredNfts) {
      const mapX = nft.svgX;
      const mapY = H - nft.svgY;
      const { x: sx, y: sy } = mapToScreen(mapX, mapY, viewBox, t);
      const isSelected = openIds.has(nft.id);
      const cellX = Math.round(sx / nftPointRadius);
      const cellY = Math.round(sy / nftPointRadius);
      const posKey = `${cellX},${cellY}`;
      if (!isSelected && drawn.has(posKey)) continue;
      drawn.add(posKey);

      const r = isSelected ? nftPointRadius * 1.3 : nftPointRadius;
      const color = isSelected ? nftPointColor.selected : nftPointColor.default;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Center dot
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [currentSlug, cityMaps, containerSizes, filteredNfts, openBubbleNfts]);

  // Wheel zoom
  useEffect(() => {
    const wheelHandlers = {};

    for (const city of cities) {
      const slug = city.slug;
      const containerEl = containerRefs.current[slug];
      if (!containerEl) continue;

      const handler = (e) => {
        const cityMap = cityMaps[slug];
        if (!cityMap?.viewBox || !cityMap?.mapBounds) return;

        const size = containerSizes[slug];
        if (!size?.w || !size?.h) return;

        e.preventDefault();

        const rect = containerEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const viewBox = cityMap.viewBox;
        const t = getMeetTransform(size.w, size.h, viewBox);
        const anchor = screenToMap(mouseX, mouseY, viewBox, t);

        const zoomIntensity = 0.12;
        const direction = e.deltaY > 0 ? 1 : -1;
        const scaleFactor = 1 + zoomIntensity * direction;

        const newWidth = viewBox.width * scaleFactor;
        const newHeight = viewBox.height * scaleFactor;

        const minWidth = cityMap.mapBounds.width * 0.02;
        const maxWidth = cityMap.mapBounds.width * 100;
        if (newWidth < minWidth || newWidth > maxWidth) return;

        const ax = (clamp(mouseX, t.offsetX, t.offsetX + t.drawW) - t.offsetX) / t.drawW;
        const ay = (clamp(mouseY, t.offsetY, t.offsetY + t.drawH) - t.offsetY) / t.drawH;

        const newViewBox = {
          width: newWidth,
          height: newHeight,
          x: anchor.x - ax * newWidth,
          y: anchor.y - ay * newHeight,
        };

        setCityMaps((prev) => ({ ...prev, [slug]: { ...prev[slug], viewBox: newViewBox } }));
      };

      wheelHandlers[slug] = handler;
      containerEl.addEventListener("wheel", handler, { passive: false });
    }

    return () => {
      for (const city of cities) {
        const slug = city.slug;
        const containerEl = containerRefs.current[slug];
        const handler = wheelHandlers[slug];
        if (containerEl && handler) containerEl.removeEventListener("wheel", handler);
      }
    };
  }, [cities, cityMaps, containerSizes]);

  // Pinch-to-zoom (touch events for multi-touch)
  useEffect(() => {
    if (cities.length === 0) return;

    const getTouchDist = (t0, t1) =>
      Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);

    const getTouchMid = (t0, t1) => ({
      x: (t0.clientX + t1.clientX) / 2,
      y: (t0.clientY + t1.clientY) / 2,
    });

    const handlers = [];

    for (const city of cities) {
      const slug = city.slug;
      const containerEl = containerRefs.current[slug];
      if (!containerEl) continue;

      const onTouchStart = (e) => {
        if (e.touches.length === 2) {
          // Cancel any ongoing single-finger pan
          isPanningRef.current = false;
          currentPanningCity.current = null;
          viewBoxStartRef.current = null;

          const cityMap = cityMaps[slug];
          if (!cityMap?.viewBox) return;

          pinchRef.current = {
            active: true,
            initialDist: getTouchDist(e.touches[0], e.touches[1]),
            initialVB: { ...cityMap.viewBox },
            city: slug,
          };
        }
      };

      const onTouchMove = (e) => {
        if (!pinchRef.current.active || pinchRef.current.city !== slug) return;
        if (e.touches.length < 2) return;

        e.preventDefault();

        const cityMap = cityMaps[slug];
        const size = containerSizes[slug];
        if (!cityMap?.viewBox || !cityMap?.mapBounds || !size?.w || !size?.h) return;

        const currentDist = getTouchDist(e.touches[0], e.touches[1]);
        const scaleFactor = pinchRef.current.initialDist / currentDist;

        const vb0 = pinchRef.current.initialVB;
        const newWidth = vb0.width * scaleFactor;
        const newHeight = vb0.height * scaleFactor;

        const minWidth = cityMap.mapBounds.width * 0.02;
        const maxWidth = cityMap.mapBounds.width * 100;
        if (newWidth < minWidth || newWidth > maxWidth) return;

        // Zoom centered on midpoint of two fingers
        const rect = containerEl.getBoundingClientRect();
        const mid = getTouchMid(e.touches[0], e.touches[1]);
        const midX = mid.x - rect.left;
        const midY = mid.y - rect.top;

        const t = getMeetTransform(size.w, size.h, vb0);
        const ax = (clamp(midX, t.offsetX, t.offsetX + t.drawW) - t.offsetX) / t.drawW;
        const ay = (clamp(midY, t.offsetY, t.offsetY + t.drawH) - t.offsetY) / t.drawH;

        const anchorMapX = vb0.x + ax * vb0.width;
        const anchorMapY = vb0.y + ay * vb0.height;

        const newViewBox = {
          width: newWidth,
          height: newHeight,
          x: anchorMapX - ax * newWidth,
          y: anchorMapY - ay * newHeight,
        };

        // Use RAF batching for performance
        pendingViewBoxRef.current = { slug, viewBox: newViewBox };
        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(() => {
            if (!pendingViewBoxRef.current) return;
            const pend = pendingViewBoxRef.current;
            setCityMaps((prev) => ({
              ...prev,
              [pend.slug]: { ...prev[pend.slug], viewBox: pend.viewBox },
            }));
            pendingViewBoxRef.current = null;
            rafIdRef.current = null;
          });
        }
      };

      const onTouchEnd = (e) => {
        if (!pinchRef.current.active || pinchRef.current.city !== slug) return;
        if (e.touches.length < 2) {
          // Commit any pending viewBox
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
          if (pendingViewBoxRef.current) {
            const pend = pendingViewBoxRef.current;
            setCityMaps((prev) => ({
              ...prev,
              [pend.slug]: { ...prev[pend.slug], viewBox: pend.viewBox },
            }));
            pendingViewBoxRef.current = null;
          }
          pinchRef.current = { active: false, initialDist: 0, initialVB: null, city: null };
        }
      };

      containerEl.addEventListener("touchstart", onTouchStart, { passive: true });
      containerEl.addEventListener("touchmove", onTouchMove, { passive: false });
      containerEl.addEventListener("touchend", onTouchEnd, { passive: true });
      containerEl.addEventListener("touchcancel", onTouchEnd, { passive: true });
      handlers.push({ el: containerEl, onTouchStart, onTouchMove, onTouchEnd });
    }

    return () => {
      for (const h of handlers) {
        h.el.removeEventListener("touchstart", h.onTouchStart);
        h.el.removeEventListener("touchmove", h.onTouchMove);
        h.el.removeEventListener("touchend", h.onTouchEnd);
        h.el.removeEventListener("touchcancel", h.onTouchEnd);
      }
    };
  }, [cities, cityMaps, containerSizes]);

  // Pan (window pointermove)
  // On mobile: uses requestAnimationFrame to batch updates for better performance
  // On desktop: updates immediately for responsiveness
  useEffect(() => {
    const commitViewBox = () => {
      if (!pendingViewBoxRef.current) return;
      const { slug, viewBox } = pendingViewBoxRef.current;
      setCityMaps((prev) => ({
        ...prev,
        [slug]: { ...prev[slug], viewBox },
      }));
      pendingViewBoxRef.current = null;
      rafIdRef.current = null;
    };

    const onMove = (e) => {
      if (!isPanningRef.current || !viewBoxStartRef.current || !currentPanningCity.current) return;

      const slug = currentPanningCity.current;
      const size = containerSizes[slug];
      if (!size?.w || !size?.h) return;

      const vb0 = viewBoxStartRef.current;
      const t0 = getMeetTransform(size.w, size.h, vb0);

      const dxPixel = e.clientX - panStartRef.current.x;
      const dyPixel = e.clientY - panStartRef.current.y;

      const dxMap = -dxPixel / t0.scale;
      const dyMap = -dyPixel / t0.scale;

      const newViewBox = { ...vb0, x: vb0.x + dxMap, y: vb0.y + dyMap };

      if (isMobileUI) {
        // Mobile: batch updates with RAF for performance
        pendingViewBoxRef.current = { slug, viewBox: newViewBox };
        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(commitViewBox);
        }
      } else {
        // Desktop: immediate update for responsiveness
        setCityMaps((prev) => ({
          ...prev,
          [slug]: { ...prev[slug], viewBox: newViewBox },
        }));
      }
    };

    const onUp = () => {
      // On pointer release, commit any pending viewBox immediately
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (pendingViewBoxRef.current) {
        const { slug, viewBox } = pendingViewBoxRef.current;
        setCityMaps((prev) => ({
          ...prev,
          [slug]: { ...prev[slug], viewBox },
        }));
        pendingViewBoxRef.current = null;
      }

      isPanningRef.current = false;
      currentPanningCity.current = null;
      viewBoxStartRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [containerSizes, isMobileUI]);

  const handlePointerDown = (e, slug) => {
    if (pinchRef.current.active) return; // Don't start pan during pinch
    const cityMap = cityMaps[slug];
    if (!cityMap?.viewBox) return;
    if (e.button !== 0) return;

    // Don't preventDefault here — it blocks click events on child links/buttons.
    // touchAction: 'none' on the container already handles touch gestures.
    e.stopPropagation();

    isPanningRef.current = true;
    currentPanningCity.current = slug;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    viewBoxStartRef.current = { ...cityMap.viewBox };
  };

  const handleCanvasClick = (e, slug) => {
    e.stopPropagation();

    const size = containerSizes[slug];
    const cityMap = cityMaps[slug];
    if (!size?.w || !size?.h) return;
    if (!cityMap?.viewBox || !cityMap?.mapBounds) return;

    const containerEl = containerRefs.current[slug];
    if (!containerEl) return;

    const rect = containerEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const viewBox = cityMap.viewBox;
    const t = getMeetTransform(size.w, size.h, viewBox);

    const clickThreshold = nftPointRadius * 2.5;
    let clicked = null;

    const candidates = slug === currentSlug ? filteredNfts : cityNfts?.[slug] || [];
    const H = cityMap.mapBounds.height;

    for (const nft of candidates) {
      const mapX = nft.svgX;
      const mapY = H - nft.svgY;

      const { x: sx, y: sy } = mapToScreen(mapX, mapY, viewBox, t);
      const dx = mouseX - sx;
      const dy = mouseY - sy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= clickThreshold) {
        clicked = nft;
        break;
      }
    }

    // Clicking an NFT point focuses its venue
    if (clicked && clicked.venue_id) {
      const venues = cityVenues?.[slug]?.venues || [];
      const venue = venues.find((v) => v.id === clicked.venue_id);
      if (venue) {
        const vKey = venueKey(venue);
        setSelectedVenue((prev) => ({ ...prev, [slug]: vKey }));
        setCarouselOpen((prev) => ({ ...prev, [slug]: true }));
        setSelectedEvent((prev) => ({ ...prev, [slug]: "" }));
        zoomToVenue(slug, venue);
        fetchVenueNfts(slug, venue.id);
      }
    }
  };

  const goToNextCity = () => {
    setCurrentCityIndex((prev) => (prev + 1) % cities.length);
  };

  const goToPrevCity = () => {
    setCurrentCityIndex((prev) => (prev - 1 + cities.length) % cities.length);
  };

  const goToCity = (index) => {
    setCurrentCityIndex(index);
  };

  /**
   * Zoom to a venue using lat/lng coordinates.
   * Converts lat/lng to SVG map coordinates using bbox_wgs84 and mapBounds.
   */
  const zoomToVenue = (slug, venue) => {
    const cityMap = cityMaps[slug];
    const city = cities.find((c) => c.slug === slug);

    if (!cityMap?.viewBox || !cityMap?.mapBounds) return;
    if (!city?.bbox_wgs84) return;
    if (!Number.isFinite(venue?.lat) || !Number.isFinite(venue?.lng)) return;

    const { minLng, minLat, maxLng, maxLat } = city.bbox_wgs84;
    const bboxWidth = maxLng - minLng;
    const bboxHeight = maxLat - minLat;

    // Normalize venue position within WGS84 bbox (0 to 1)
    const normX = (venue.lng - minLng) / bboxWidth;
    const normY = (venue.lat - minLat) / bboxHeight;

    // Convert to SVG map coordinates
    // X maps directly, Y is inverted (SVG Y increases downward, lat increases upward)
    const H = cityMap.mapBounds.height;
    const W = cityMap.mapBounds.width;
    const mapX = cityMap.mapBounds.x + normX * W;
    const mapY = cityMap.mapBounds.y + (1 - normY) * H; // Invert Y

    // Zoom factor: mobile uses deeper zoom (smaller factor = more zoomed in)
    // Desktop: 0.03 (~33x zoom), Mobile: 0.015 (~67x zoom)
    const zoomFactor = 0.015;
    const newWidth = W * zoomFactor;
    const newHeight = H * zoomFactor;

    // Center on the venue
    const newViewBox = {
      x: mapX - newWidth / 2,
      y: mapY - newHeight / 2,
      width: newWidth,
      height: newHeight,
    };

    setCityMaps((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], viewBox: newViewBox },
    }));
  };

  /**
   * Reset viewBox to initial (zoomed out) state with padding.
   */
  const resetZoom = (slug) => {
    const cityMap = cityMaps[slug];
    if (!cityMap?.mapBounds) return;

    const bounds = cityMap.mapBounds;
    const paddingScale = 1.15;
    const initialViewBox = {
      x: bounds.x - (bounds.width * (paddingScale - 1)) / 2,
      y: bounds.y - (bounds.height * (paddingScale - 1)) / 2,
      width: bounds.width * paddingScale,
      height: bounds.height * paddingScale,
    };

    setCityMaps((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], viewBox: initialViewBox },
    }));
  };

  /**
   * Fetch NFTs for a specific venue and update state.
   * Called when a venue is selected from the dropdown.
   */
  const fetchVenueNfts = async (slug, venueId) => {
    try {
      const res = await fetch(`${MAP_SERVER}/api/nfts/${slug}?venue=${venueId}`);
      if (!res.ok) {
        console.error(`Failed to fetch venue NFTs: ${res.status}`);
        return;
      }

      const nftData = await res.json();
      const valid = Array.isArray(nftData)
        ? nftData.filter((nft) => Number.isFinite(nft.svgX) && Number.isFinite(nft.svgY))
        : [];

      // Update NFTs for this city with venue-filtered results
      setCityNfts((prev) => ({ ...prev, [slug]: valid }));

      // Store all venue NFTs for the carousel modal (desktop)
      // On mobile: clear bubbles (display only NFT points)
      if (!isMobileUI) {
        setOpenBubbleNfts((prev) => ({ ...prev, [slug]: valid }));
      } else {
        setOpenBubbleNfts((prev) => ({ ...prev, [slug]: [] }));
      }
    } catch (err) {
      console.error(`Fetch venue NFTs failed for ${slug}:`, err);
    }
  };

  /**
   * Restore spotlight NFTs from SSR data (no API call).
   * Called when "All Venues" is selected to reset to default view.
   */
  const restoreSpotlightNfts = (slug) => {
    const allSpotlight = spotlightByCity[slug] || [];
    setCityNfts((prev) => ({ ...prev, [slug]: allSpotlight }));
    setOpenBubbleNfts((prev) => ({ ...prev, [slug]: allSpotlight }));
  };

  // Helper to compute anchor for any NFT
  const currentContainerSize = currentSlug ? containerSizes[currentSlug] : null;

  const computeAnchor = (nft, cityMap, containerSize) => {
    if (!nft || !cityMap?.viewBox || !cityMap?.mapBounds) return null;
    if (!containerSize?.w || !containerSize?.h) return null;

    const t = getMeetTransform(containerSize.w, containerSize.h, cityMap.viewBox);
    const H = cityMap.mapBounds.height;
    const mapX = nft.svgX;
    const mapY = H - nft.svgY;
    const { x: sx, y: sy } = mapToScreen(mapX, mapY, cityMap.viewBox, t);
    return { x: sx, y: sy };
  };

  if (cities.length === 0) {
    return <div style={{ padding: '1rem', backgroundColor: 'var(--brand-bg)', color: 'var(--brand-primary)' }}>Loading cities...</div>;
  }

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', backgroundColor: 'var(--brand-bg)' }}
      onClick={() => currentSlug && setOpenBubbleNfts((prev) => ({ ...prev, [currentSlug]: [] }))}
    >
      <MobileGestureTutorial onAnimationStateChange={setIsTutorialAnimating} />
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: `${cities.length * 100}%`,
          transform: `translateX(-${currentCityIndex * (100 / cities.length)}%)`,
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        {cities.map((city) => {
          const slug = city.slug;
          const cityMap = cityMaps[slug];

          const venues = cityVenues?.[slug]?.venues || [];
          const events = cityEvents?.[slug]?.events || [];

          const activeVenueKey = selectedVenue?.[slug] || "";
          const activeEventId = selectedEvent?.[slug] || "";

          const eventsForThisCity = (() => {
            const venueId = resolveVenueId(slug);
            if (!venueId) return events;
            return events.filter((ev) => ev?.venue_id === venueId);
          })();

          return (
            <div
              key={city.id}
              ref={(el) => (containerRefs.current[slug] = el)}
              style={{
                position: 'relative',
                height: '100%',
                width: `${100 / cities.length}%`,
                flexShrink: 0,
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                cursor: isPanningRef.current && currentPanningCity.current === slug ? "grabbing" : "grab",
              }}
              onPointerDown={(e) => handlePointerDown(e, slug)}
            >
              {cityMap && cityMap.loaded && cityMap.svgInner ? (
                <>
                  <svg
                    width={containerSizes[slug]?.w || "100%"}
                    height={containerSizes[slug]?.h || "100%"}
                    viewBox={`${cityMap.viewBox.x} ${cityMap.viewBox.y} ${cityMap.viewBox.width} ${cityMap.viewBox.height}`}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    preserveAspectRatio="xMidYMid meet"
                    dangerouslySetInnerHTML={{ __html: cityMap.svgInner }}
                  />
                  <canvas
                    ref={(el) => (canvasRefs.current[slug] = el)}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'auto', cursor: 'pointer', zIndex: 5 }}
                    onClick={(e) => handleCanvasClick(e, slug)}
                  />

                  <MapFrame city={city} cityMap={cityMap} containerSize={containerSizes[slug]} isMobileUI={isMobileUI} hideScaleBar={isSmallViewport && !!selectedVenue?.[slug]} />
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--brand-primary)' }}>
                  Loading {city.name_en || city.slug} map...
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  top: isMobileUI ? 'max(1.25rem, env(safe-area-inset-top))' : '1.25rem',
                  left: isMobileUI ? 'max(1.25rem, env(safe-area-inset-left))' : '1.25rem',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  onClick={() => {
                    setSelectedVenue((prev) => ({ ...prev, [slug]: "" }));
                    setSelectedEvent((prev) => ({ ...prev, [slug]: "" }));
                    setCarouselOpen((prev) => ({ ...prev, [slug]: false }));
                    setOpenBubbleNfts((prev) => ({ ...prev, [slug]: [] }));
                    setFiltersByCity((prev) => ({
                      ...prev,
                      [slug]: { tag: "", category: "", creator: "", year: "", month: "", week: "", day: "", activityStatus: { past: true, ongoing: true, future: true } },
                    }));
                    resetZoom(slug);
                    restoreSpotlightNfts(slug);
                  }}
                  style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--brand-primary)', padding: '0.5rem 0', cursor: 'pointer' }}
                >{city.name_zh || city.name_en || city.slug}</div>

                <CustomSelect
                  style={{
                    background: "transparent",
                    padding: "4px",
                    fontSize: 14,
                    color: "var(--brand-primary)",
                    minWidth: 220,
                    width: "100%",
                  }}
                  value={activeVenueKey}
                  onChange={(e) => {
                    const vKey = e.target.value;
                    setSelectedVenue((prev) => ({ ...prev, [slug]: vKey }));
                    setCarouselOpen((prev) => ({ ...prev, [slug]: !!vKey }));
                    setSelectedEvent((prev) => ({ ...prev, [slug]: "" }));

                    if (vKey) {
                      // Venue selected: zoom and fetch venue-specific NFTs
                      const venue = venues.find((v) => venueKey(v) === vKey);
                      if (venue) {
                        zoomToVenue(slug, venue);
                        // Use venue.id (UUID) for API call
                        fetchVenueNfts(slug, venue.id);
                      }
                    } else {
                      // "All Venues" selected: reset zoom and restore spotlight NFTs from SSR data
                      resetZoom(slug);
                      restoreSpotlightNfts(slug);
                    }
                  }}
                >
                  <option value="">所有場館</option>
                  {venues.map((venue, index) => (
                    <option key={`${venueKey(venue)}-${index}`} value={venueKey(venue)}>
                      {venue.name}
                      {Number.isFinite(venue.count) ? ` (${venue.count})` : ""}
                    </option>
                  ))}
                </CustomSelect>

                <CustomSelect
                  style={{
                    background: "transparent",
                    padding: "4px",
                    fontSize: 14,
                    color: "var(--brand-primary)",
                    minWidth: 220,
                    width: "100%",
                  }}
                  value={activeEventId}
                  onChange={(e) => {
                    setSelectedEvent((prev) => ({ ...prev, [slug]: e.target.value }));
                    setOpenBubbleNfts((prev) => ({ ...prev, [slug]: [] }));
                    // Reopen carousel if a venue is selected so filtered results show
                    if (selectedVenue?.[slug]) {
                      setCarouselOpen((prev) => ({ ...prev, [slug]: true }));
                    }
                  }}
                >
                  <option value="">所有活動</option>
                  {eventsForThisCity.map((ev, index) => (
                    <option key={`${ev.id}-${index}`} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </CustomSelect>

                <button
                  onClick={() => {
                    setSelectedVenue((prev) => ({ ...prev, [slug]: "" }));
                    setSelectedEvent((prev) => ({ ...prev, [slug]: "" }));
                    setCarouselOpen((prev) => ({ ...prev, [slug]: false }));
                    setOpenBubbleNfts((prev) => ({ ...prev, [slug]: [] }));
                    setFiltersByCity((prev) => ({
                      ...prev,
                      [slug]: { tag: "", category: "", creator: "", year: "", month: "", week: "", day: "", activityStatus: { past: true, ongoing: true, future: true } },
                    }));
                    resetZoom(slug);
                    restoreSpotlightNfts(slug);
                  }}
                  style={{ fontSize: 14, color: 'var(--brand-primary)', marginTop: '0.25rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' }}
                >重置</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spotlight bubbles (no venue selected) */}
      {currentSlug && !selectedVenue?.[currentSlug] && (() => {
        const rawBubbleNfts = openBubbleNfts[currentSlug] || [];
        if (rawBubbleNfts.length === 0) return null;

        const closeBubble = (nftId) => setOpenBubbleNfts((prev) => ({
          ...prev,
          [currentSlug]: (prev[currentSlug] || []).filter((n) => n.id !== nftId),
        }));
        const cityMap = cityMaps[currentSlug];
        const spotlightAnchors = (cityMap?.viewBox && cityMap?.mapBounds && currentContainerSize?.w)
          ? rawBubbleNfts
              .map((nft) => {
                const anchor = computeAnchor(nft, cityMap, currentContainerSize);
                if (!anchor) return null;
                return { id: nft.id, x: anchor.x, y: anchor.y };
              })
              .filter(Boolean)
          : [];

        return (
          <SpotlightStack
            nfts={rawBubbleNfts}
            anchors={spotlightAnchors}
            onClose={closeBubble}
            compact={isSmallViewport}
          />
        );
      })()}

      {/* Venue selected: carousel modal — uses filteredNfts directly, independent of openBubbleNfts */}
      {currentSlug && selectedVenue?.[currentSlug] && carouselOpen?.[currentSlug] && (() => {
        const venues = cityVenues?.[currentSlug]?.venues || [];
        const carouselNfts = filteredNfts.map((nft) => {
          const enriched = enrichNftWithVenue(nft, venues);
          const resolvedCreators = Array.isArray(enriched.creators)
            ? enriched.creators.map(resolveCreatorName)
            : enriched.creators;
          return { ...enriched, creators: resolvedCreators };
        });

        const closeCarousel = () => {
          setCarouselOpen((prev) => ({ ...prev, [currentSlug]: false }));
        };

        return (
          <VenueNftCarousel
            nfts={carouselNfts}
            onClose={closeCarousel}
            compact={isSmallViewport}
          />
        );
      })()}

      {/* Left/Right nav: switch venues in focus mode, otherwise switch cities */}
      {(() => {
        const slug = currentSlug;
        const inVenueMode = !!selectedVenue?.[slug];
        const venues = inVenueMode ? (cityVenues?.[slug]?.venues || []) : [];
        const currentVKey = selectedVenue?.[slug] || "";
        const currentVIdx = venues.findIndex((v) => venueKey(v) === currentVKey);

        const goVenue = (dir) => {
          if (venues.length === 0) return;
          const nextIdx = ((currentVIdx + dir) % venues.length + venues.length) % venues.length;
          const nextVenue = venues[nextIdx];
          const vKey = venueKey(nextVenue);
          setSelectedVenue((prev) => ({ ...prev, [slug]: vKey }));
          setSelectedEvent((prev) => ({ ...prev, [slug]: "" }));
          setCarouselOpen((prev) => ({ ...prev, [slug]: true }));
          zoomToVenue(slug, nextVenue);
          fetchVenueNfts(slug, nextVenue.id);
        };

        const onPrev = (e) => {
          e.stopPropagation();
          inVenueMode ? goVenue(-1) : goToPrevCity();
        };
        const onNext = (e) => {
          e.stopPropagation();
          inVenueMode ? goVenue(1) : goToNextCity();
        };

        // Show buttons: always for cities > 1, or in venue mode with venues > 1
        if (cities.length <= 1 && (!inVenueMode || venues.length <= 1)) return null;
        if (inVenueMode && venues.length <= 1) return null;

        return (
          <>
            <button
              onClick={onPrev}
              className={!inVenueMode && isTutorialAnimating ? "city-nav-pulse" : "city-nav-breathe"}
              style={{
                position: 'absolute',
                left: isMobileUI ? 'max(1.25rem, env(safe-area-inset-left))' : '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3rem',
                height: '3rem',
                fontSize: '1.5rem',
                color: 'var(--brand-secondary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                zIndex: 20,
              }}
            >
              ‹
            </button>
            <button
              onClick={onNext}
              className={!inVenueMode && isTutorialAnimating ? "city-nav-pulse" : "city-nav-breathe"}
              style={{
                position: 'absolute',
                right: isMobileUI ? 'max(1.25rem, env(safe-area-inset-right))' : '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3rem',
                height: '3rem',
                fontSize: '1.5rem',
                color: 'var(--brand-secondary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                zIndex: 20,
              }}
            >
              ›
            </button>
          </>
        );
      })()}

      {/* City carousel dots: On mobile, hide in Focused Mode to avoid accidental navigation */}
      {cities.length > 1 && (!isMobileUI || !isMobileFocusedMode) && (
        <div
          style={{
            position: 'absolute',
            bottom: isMobileUI ? 'max(2.5rem, env(safe-area-inset-bottom))' : '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.5rem',
            zIndex: 20,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {cities.map((city, index) => (
            <button
              key={city.id}
              onClick={() => goToCity(index)}
              style={{
                width: 12,
                height: 12,
                minWidth: 12,
                minHeight: 12,
                borderRadius: '50%',
                background: 'transparent',
                border: `${index === currentCityIndex ? '2px' : '1px'} solid var(--brand-primary)`,
                cursor: 'pointer',
                opacity: index === currentCityIndex ? 1 : 0.5,
                padding: 0,
                boxSizing: 'border-box',
              }}
            />
          ))}
        </div>
      )}

      {/* Left-bottom filters: only for current city */}
      {/* On narrow viewports (≤600px): collapsible circular button; on wide: inline */}
      {currentSlug && currentFilters && (!isNarrowWidth || !!(selectedVenue?.[currentSlug] || selectedEvent?.[currentSlug])) && (
        isNarrowWidth ? (
          /* --- Narrow: circular FAB + collapsible panel --- */
          <div
            style={{
              position: 'absolute',
              bottom: 'max(2.5rem, env(safe-area-inset-bottom))',
              left: 'max(1.25rem, env(safe-area-inset-left))',
              zIndex: 20,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Collapsible filter panel */}
            {filterMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 56,
                  left: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  background: 'rgba(245, 245, 245, 0.92)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 12,
                  padding: '0.75rem',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  minWidth: 200,
                }}
              >
                <CustomSelect
                  style={{ background: "transparent", padding: "4px", fontSize: 13, color: "var(--brand-primary)", width: "100%" }}
                  value={currentFilters.tag}
                  onChange={(e) => setCurrentFilters((prev) => ({ ...prev, tag: e.target.value }))}
                  forceOpenUpward
                >
                  <option value="">標籤</option>
                  {filterOptions.tags.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </CustomSelect>

                <CustomSelect
                  style={{ background: "transparent", padding: "4px", fontSize: 13, color: "var(--brand-primary)", width: "100%" }}
                  value={currentFilters.category}
                  onChange={(e) => setCurrentFilters((prev) => ({ ...prev, category: e.target.value }))}
                  forceOpenUpward
                >
                  <option value="">類別</option>
                  {filterOptions.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </CustomSelect>

                <CustomSelect
                  style={{ background: "transparent", padding: "4px", fontSize: 13, color: "var(--brand-primary)", width: "100%" }}
                  value={currentFilters.creator}
                  onChange={(e) => setCurrentFilters((prev) => ({ ...prev, creator: e.target.value }))}
                  forceOpenUpward
                >
                  <option value="">藝術家</option>
                  {filterOptions.creators.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </CustomSelect>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <CustomSelect
                    style={{ background: "transparent", padding: "4px", fontSize: 13, color: "var(--brand-primary)", width: "80px" }}
                    value={currentFilters.year}
                    onChange={(e) => setCurrentFilters((prev) => ({ ...prev, year: e.target.value, month: "", week: "", day: "" }))}
                    forceOpenUpward
                  >
                    <option value="">年</option>
                    {filterOptions.years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </CustomSelect>

                  <CustomSelect
                    style={{ background: "transparent", padding: "4px", fontSize: 13, color: "var(--brand-primary)", width: "90px" }}
                    value={currentFilters.month}
                    onChange={(e) => setCurrentFilters((prev) => ({ ...prev, month: e.target.value, day: "" }))}
                    forceOpenUpward
                  >
                    <option value="">月</option>
                    {filterOptions.months.map((m) => {
                      return <option key={m} value={m}>{m}</option>;
                    })}
                  </CustomSelect>

                  <CustomSelect
                    style={{ background: "transparent", padding: "4px", fontSize: 13, color: "var(--brand-primary)", width: "110px" }}
                    value={currentFilters.day}
                    onChange={(e) => setCurrentFilters((prev) => ({ ...prev, day: e.target.value }))}
                    forceOpenUpward
                  >
                    <option value="">日</option>
                    {filterOptions.days.map((d) => {
                      return <option key={d} value={d}>{d}</option>;
                    })}
                  </CustomSelect>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', color: 'var(--brand-primary)', fontSize: 13 }}>
                  {[
                    { key: "past", label: "過去" },
                    { key: "ongoing", label: "進行中" },
                    { key: "future", label: "未來" },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!currentFilters.activityStatus[key]}
                        onChange={(e) =>
                          setCurrentFilters((prev) => ({
                            ...prev,
                            activityStatus: { ...prev.activityStatus, [key]: e.target.checked },
                          }))
                        }
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Circular filter toggle button */}
            <button
              onClick={() => setFilterMenuOpen((prev) => !prev)}
              style={{
                position: 'relative',
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: filterMenuOpen ? 'var(--brand-secondary)' : 'rgba(245, 245, 245, 0.85)',
                backdropFilter: 'blur(4px)',
                border: `1.5px solid ${filterMenuOpen ? 'var(--brand-secondary)' : 'var(--brand-primary)'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                padding: 0,
              }}
              aria-label="Toggle filters"
            >
              {/* Filter funnel icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={filterMenuOpen ? '#fff' : 'var(--brand-primary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {/* Active filter count badge */}
              {activeFilterCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--brand-secondary)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        ) : (
          /* --- Wide: inline filters (unchanged) --- */
          <div
            style={{
              position: 'absolute',
              bottom: '2.5rem',
              left: '1.25rem',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <CustomSelect
              style={{ background: "transparent", padding: "4px", fontSize: 14, color: "var(--brand-primary)", minWidth: 220 }}
              value={currentFilters.tag}
              onChange={(e) => setCurrentFilters((prev) => ({ ...prev, tag: e.target.value }))}
              forceOpenUpward
            >
              <option value="">標籤</option>
              {filterOptions.tags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </CustomSelect>

            <CustomSelect
              style={{ background: "transparent", padding: "4px", fontSize: 14, color: "var(--brand-primary)", minWidth: 220 }}
              value={currentFilters.category}
              onChange={(e) => setCurrentFilters((prev) => ({ ...prev, category: e.target.value }))}
              forceOpenUpward
            >
              <option value="">類別</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </CustomSelect>

            <CustomSelect
              style={{ background: "transparent", padding: "4px", fontSize: 14, color: "var(--brand-primary)", minWidth: 220 }}
              value={currentFilters.creator}
              onChange={(e) => setCurrentFilters((prev) => ({ ...prev, creator: e.target.value }))}
              forceOpenUpward
            >
              <option value="">藝術家</option>
              {filterOptions.creators.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </CustomSelect>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <CustomSelect
                style={{ background: "transparent", padding: "4px", fontSize: 14, color: "var(--brand-primary)", width: "90px" }}
                value={currentFilters.year}
                onChange={(e) => setCurrentFilters((prev) => ({ ...prev, year: e.target.value, month: "", week: "", day: "" }))}
                forceOpenUpward
              >
                <option value="">年</option>
                {filterOptions.years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </CustomSelect>

              <CustomSelect
                style={{ background: "transparent", padding: "4px", fontSize: 14, color: "var(--brand-primary)", width: "110px" }}
                value={currentFilters.month}
                onChange={(e) => setCurrentFilters((prev) => ({ ...prev, month: e.target.value, day: "" }))}
                forceOpenUpward
              >
                <option value="">月</option>
                {filterOptions.months.map((m) => {
                  return (
                    <option key={m} value={m}>{m}</option>
                  );
                })}
              </CustomSelect>

              <CustomSelect
                style={{ background: "transparent", padding: "4px", fontSize: 14, color: "var(--brand-primary)", width: "120px" }}
                value={currentFilters.day}
                onChange={(e) => setCurrentFilters((prev) => ({ ...prev, day: e.target.value }))}
                forceOpenUpward
              >
                <option value="">日</option>
                {filterOptions.days.map((d) => {
                  return (
                    <option key={d} value={d}>{d}</option>
                  );
                })}
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', color: 'var(--brand-primary)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!currentFilters.activityStatus.past}
                  onChange={(e) =>
                    setCurrentFilters((prev) => ({
                      ...prev,
                      activityStatus: { ...prev.activityStatus, past: e.target.checked },
                    }))
                  }
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                過去
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!currentFilters.activityStatus.ongoing}
                  onChange={(e) =>
                    setCurrentFilters((prev) => ({
                      ...prev,
                      activityStatus: { ...prev.activityStatus, ongoing: e.target.checked },
                    }))
                  }
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                進行中
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!currentFilters.activityStatus.future}
                  onChange={(e) =>
                    setCurrentFilters((prev) => ({
                      ...prev,
                      activityStatus: { ...prev.activityStatus, future: e.target.checked },
                    }))
                  }
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                未來
              </label>
            </div>
          </div>
        )
      )}

      <style jsx global>{`
        :root {
          --brand-primary: #2483ff;
          --brand-secondary: #ff3300;
          --brand-bg: #f5f5f5;
        }

        input[type="checkbox"]:checked {
          accent-color: var(--brand-secondary) !important;
        }

        .custom-select-menu {
          scrollbar-width: thin;
          scrollbar-color: var(--brand-secondary) transparent;
        }

        .custom-select-menu::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        .custom-select-menu::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-select-menu::-webkit-scrollbar-thumb {
          background: var(--brand-secondary);
          border-radius: 999px;
        }

        .custom-select-menu::-webkit-scrollbar-thumb:hover {
          filter: brightness(1.1);
        }

        /* City navigation button pulse animation for mobile tutorial */
        @keyframes city-nav-pulse {
          0%, 100% {
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-50%) scale(1.15);
            opacity: 0.8;
          }
        }

        .city-nav-pulse {
          animation: city-nav-pulse 0.8s ease-in-out infinite;
        }

        /* Breathing glow effect for city nav arrows */
        @keyframes city-nav-breathe {
          0%, 100% {
            opacity: 0.4;
            transform: translateY(-50%) scale(1);
            text-shadow: 0 0 0 transparent;
          }
          50% {
            opacity: 1;
            transform: translateY(-50%) scale(1.15);
            text-shadow: 0 0 8px var(--brand-secondary), 0 0 16px var(--brand-secondary);
          }
        }

        .city-nav-breathe {
          animation: city-nav-breathe 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

BoundaryMapPage.displayName = "ShowCase";

export async function getServerSideProps() {
  const [artistsRes, eventsRes, cities] = await Promise.all([
    FetchDirectusData(`/artists`),
    FetchDirectusData(`/events`),
    fetchCitiesApi().catch(() => []),
  ]);

  const artists = (artistsRes?.data || []).filter((a) => a.status === "published");
  const directusEvents = (eventsRes?.data || []).filter((e) => e.status === "published");

  // Fetch all ongoing/future spotlight NFTs per city (limit=0 returns all)
  const spotlightByCity = {};
  await Promise.all(
    (cities || []).map(async (city) => {
      try {
        const nfts = await fetchSpotlightNftsApi(city.slug, 0);
        spotlightByCity[city.slug] = Array.isArray(nfts)
          ? nfts.filter((n) => Number.isFinite(n.svgX) && Number.isFinite(n.svgY))
          : [];
      } catch {
        spotlightByCity[city.slug] = [];
      }
    })
  );

  return { props: { artists, directusEvents, spotlightByCity } };
}

export default BoundaryMapPage;
