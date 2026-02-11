import { useEffect, useMemo, useRef, useState, useLayoutEffect, useCallback } from "react";
import Image from "next/image";
import MapFrame from "@/components/map-frame";
import MobileGestureTutorial from "@/components/MobileGestureTutorial";
import { useUIEnvironment } from "@/contexts/UIEnvironmentContext";

const nftPointRadius = 2.5;
const nftPointColor = { default: "#2483ff", selected: "#ff3300" };

const MAP_SERVER = process.env.NEXT_PUBLIC_MAP_SERVER || "http://localhost:3001";

/**
 * CustomSelect
 * - We must parse <option/> robustly because React children is not always an Array
 * - Using React.Children.forEach avoids nested arrays/fragments causing "no options"
 */
function CustomSelect({
  style,
  children,
  value,
  onChange,
  arrowRight = 8,
  dropdownMaxHeight = 200,
  menuZIndex = 1000,
  forceOpenUpward = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const options = useMemo(() => {
    const arr = [];
    // Children could be: single node, array, fragment, nested arrays.
    // React.Children flattens and iterates safely.
    // eslint-disable-next-line react/no-children-prop
    const ReactPkg = require("react");
    ReactPkg.Children.forEach(children, (child) => {
      if (!child) return;
      if (child.type === "option") {
        arr.push({
          value: child.props.value ?? "",
          label: child.props.children ?? "",
          disabled: !!child.props.disabled,
        });
      }
    });
    return arr;
  }, [children]);

  const selectedOption =
    options.find((opt) => opt.value === value) ||
    options.find((opt) => !opt.disabled) ||
    options[0] ||
    { value: "", label: "" };

  const hasWidth = style?.width || style?.minWidth;

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHoveredIndex(-1);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const idx = options.findIndex((o) => o.value === value && !o.disabled);
    if (idx >= 0) setHoveredIndex(idx);
    else setHoveredIndex(options.findIndex((o) => !o.disabled));

    if (forceOpenUpward) {
      setOpenUpward(true);
      return;
    }

    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const estimatedMenuHeight = Math.min(dropdownMaxHeight, options.length * 40);

    if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) setOpenUpward(true);
    else setOpenUpward(false);
  }, [isOpen, options, value, dropdownMaxHeight, forceOpenUpward]);

  const emitChange = (nextValue) => onChange?.({ target: { value: nextValue } });

  const close = () => {
    setIsOpen(false);
    setHoveredIndex(-1);
  };

  const pick = (opt) => {
    if (!opt || opt.disabled) return;
    emitChange(opt.value);
    close();
    requestAnimationFrame(() => triggerRef.current?.focus?.());
  };

  const moveHover = (dir) => {
    if (!options.length) return;
    let i = hoveredIndex;
    for (let step = 0; step < options.length + 1; step++) {
      i = i + dir;
      if (i < 0) i = options.length - 1;
      if (i >= options.length) i = 0;
      if (!options[i].disabled) {
        setHoveredIndex(i);
        return;
      }
    }
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();

    if (!isOpen) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHover(1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHover(-1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      pick(options[hoveredIndex]);
      return;
    }
  };

  const isFocused = isOpen;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        width: hasWidth ? style.width : undefined,
        minWidth: style?.minWidth,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={triggerRef}
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onKeyDown={handleKeyDown}
        onClick={() => setIsOpen((v) => !v)}
        style={{
          ...style,
          border: "none",
          borderBottom: `1px solid ${isFocused ? "var(--brand-secondary)" : "var(--brand-primary)"}`,
          borderRadius: 0,
          background: "transparent",
          position: "relative",
          paddingRight: 56,
          width: hasWidth ? "100%" : style?.width,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          userSelect: "none",
          outline: "none",
          color: isFocused ? "var(--brand-secondary)" : style?.color || "var(--brand-primary)",
          transition: "border-color 0.2s, color 0.2s",
        }}
      >
        <span style={{ paddingRight: 20 }}>{selectedOption?.label ?? ""}</span>

        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: arrowRight,
            top: "50%",
            transform: isOpen
              ? openUpward
                ? "translateY(-50%)"
                : "translateY(-50%) rotate(180deg)"
              : "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--brand-secondary)",
            fontSize: 14,
            lineHeight: 1,
            transition: "transform 0.2s",
          }}
        >
          ▾
        </span>
      </div>

      {isOpen && (
        <ul
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="custom-select-menu"
          style={{
            position: "absolute",
            ...(openUpward
              ? { bottom: "100%", marginBottom: 6, marginTop: 0 }
              : { top: "100%", marginTop: 6, marginBottom: 0 }),
            left: 0,
            right: 0,
            padding: 0,
            listStyle: "none",
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid var(--brand-secondary)",
            borderRadius: 6,
            maxHeight: `${dropdownMaxHeight}px`,
            overflowY: "auto",
            zIndex: menuZIndex,
            boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
            backdropFilter: "blur(2px)",
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHovered = index === hoveredIndex;

            return (
              <li
                key={`${option.value}-${index}`}
                role="option"
                aria-selected={isSelected}
                style={{
                  padding: "4px 8px",
                  cursor: option.disabled ? "not-allowed" : "pointer",
                  backgroundColor: isSelected
                    ? "rgba(36, 131, 255, 0.6)"
                    : isHovered
                    ? "rgba(255, 51, 0, 0.6)"
                    : "transparent",
                  color: isSelected || isHovered ? "white" : "var(--brand-primary)",
                  transition: "background-color 0.12s, color 0.12s",
                  opacity: option.disabled ? 0.5 : 1,
                }}
                onMouseEnter={() => !option.disabled && setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(-1)}
                onClick={() => pick(option)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * UI callout line geometry
 */
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
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  const from = formatDate(fromString);
  const to = formatDate(toString);
  if (from && to) return `${from} - ${to}`;
  return from || to || "";
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
  if (!placement) return null;

  const { x, y, w, h } = placement;
  const rect = { x, y, w, h };
  const lineEnd = anchorLineToRect(anchor, rect);

  return (
    <>
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 30,  }}>
        <circle cx={anchor.x} cy={anchor.y} r={4} fill={"var(--brand-secondary)"} opacity={0.9} />
        <line
          x1={anchor.x}
          y1={anchor.y}
          x2={lineEnd.x}
          y2={lineEnd.y}
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
          zIndex: 40,
          background: "rgba(255, 255, 255, 0.3)",
          backdropFilter: "blur(2px)",
          border: "1px solid var(--brand-secondary)",
          borderRadius: 10,
          padding: 14,
          maxWidth: 360,
          color: "var(--brand-primary)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
          pointerEvents: "auto",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* NFT Thumbnail */}
        {nft?.image_thumbnail && (
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <Image
              src={nft.image_thumbnail}
              alt={nft?.name || "NFT thumbnail"}
              width={150}
              height={150}
              style={{
                objectFit: "cover",
                borderRadius: 8,
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
              <div style={{ fontSize: 10, color: "var(--brand-secondary)", marginBottom: 4 }}>Event</div>
              <div style={{ fontSize: 14 }}>{nft.event_title}</div>
            </div>
          )}

          {Array.isArray(nft?.creators) && nft.creators.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: "var(--brand-secondary)", marginBottom: 4 }}>Artists</div>
              <div style={{ fontSize: 14 }}>{nft.creators.join(", ")}</div>
            </div>
          )}

          {nft?.venue && (
            <div>
              <div style={{ fontSize: 10, color: "var(--brand-secondary)", marginBottom: 4 }}>Venue</div>
              <div style={{ fontSize: 14 }}>{nft.venue}</div>
              {nft?.event_time && (
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                  {formatDateRange(nft.event_time?.from, nft.event_time?.to)}
                </div>
              )}
            </div>
          )}

          {nft?.category && (
            <div>
              <div style={{ fontSize: 10, color: "var(--brand-secondary)", marginBottom: 4 }}>Category</div>
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
  }, [nft?.id, nft?.name, nft?.event_title, nft?.venue, nft?.category, nft?.image_thumbnail, onMeasure]);

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
      {nft?.image_thumbnail && (
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
            <div style={{ fontSize: 10, marginBottom: 4 }}>Event</div>
            <div style={{ fontSize: 14 }}>{nft.event_title}</div>
          </div>
        )}
        {Array.isArray(nft?.creators) && nft.creators.length > 0 && (
          <div>
            <div style={{ fontSize: 10, marginBottom: 4 }}>Artists</div>
            <div style={{ fontSize: 14 }}>{nft.creators.join(", ")}</div>
          </div>
        )}
        {nft?.venue && (
          <div>
            <div style={{ fontSize: 10, marginBottom: 4 }}>Venue</div>
            <div style={{ fontSize: 14 }}>{nft.venue}</div>
            {nft?.event_time && (
              <div style={{ fontSize: 12, marginTop: 2 }}>
                {formatDateRange(nft.event_time?.from, nft.event_time?.to)}
              </div>
            )}
          </div>
        )}
        {nft?.category && (
          <div>
            <div style={{ fontSize: 10, marginBottom: 4 }}>Category</div>
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
function BoundaryMapPage() {
  const { isMobileUI } = useUIEnvironment();

  const [cities, setCities] = useState([]);
  const [currentCityIndex, setCurrentCityIndex] = useState(0);

  const [cityMaps, setCityMaps] = useState({});
  const [cityNfts, setCityNfts] = useState({});
  const [cityVenues, setCityVenues] = useState({});
  const [cityEvents, setCityEvents] = useState({});

  const [selectedVenue, setSelectedVenue] = useState({});
  const [selectedEvent, setSelectedEvent] = useState({});
  const [filtersByCity, setFiltersByCity] = useState({});

  // Multiple open bubbles per city: { [citySlug]: nft[] }
  const [openBubbleNfts, setOpenBubbleNfts] = useState({});

  // Mobile gesture tutorial animation state
  const [isTutorialAnimating, setIsTutorialAnimating] = useState(false);

  const containerRefs = useRef({});
  const canvasRefs = useRef({});
  const [containerSizes, setContainerSizes] = useState({});

  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewBoxStartRef = useRef(null);
  const currentPanningCity = useRef(null);

  // Mobile pan optimization: refs for RAF batching
  const pendingViewBoxRef = useRef(null);
  const rafIdRef = useRef(null);

  const currentCity = cities[currentCityIndex];
  const currentSlug = currentCity?.slug;

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
        (!Array.isArray(nft.creators) || !nft.creators.includes(currentFilters.creator))
      )
        return false;

      const from = nft?.time?.from ? new Date(nft.time.from) : null;
      const to = nft?.time?.to ? new Date(nft.time.to) : null;

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

    const base = filteredNfts;

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
      if (Array.isArray(nft.creators)) nft.creators.forEach((c) => creators.add(c));

      if (nft?.time?.from) {
        const d = new Date(nft.time.from);
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
  }, [currentSlug, filteredNfts, currentFilters]);

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

  // Load spotlight NFTs per city (5 NFTs from different venues)
  // These are shown as bubbles on initial load
  // On mobile: skip fetching spotlight NFTs (only fetch when venue is selected)
  useEffect(() => {
    if (cities.length === 0) return;
    const city = cities[currentCityIndex];
    if (!city) return;
    const slug = city.slug;

    if (cityNfts[slug] !== undefined) return;

    // On mobile, skip spotlight NFT loading - only show NFTs after venue selection
    if (isMobileUI) {
      setCityNfts((prev) => ({ ...prev, [slug]: [] }));
      return;
    }

    let cancelled = false;

    async function loadSpotlightNFTs() {
      try {
        const res = await fetch(`${MAP_SERVER}/api/nfts/${slug}/spotlight?limit=5`);
        if (cancelled) return;

        if (!res.ok) {
          if (res.status === 404) {
            setCityNfts((prev) => ({ ...prev, [slug]: [] }));
            return;
          }
          throw new Error(`Failed to load spotlight NFTs for ${slug}: ${res.status}`);
        }

        const nftData = await res.json();
        if (cancelled) return;

        const valid = Array.isArray(nftData)
          ? nftData.filter((nft) => Number.isFinite(nft.svgX) && Number.isFinite(nft.svgY))
          : [];

        setCityNfts((prev) => ({ ...prev, [slug]: valid }));

        // Auto-open all spotlight NFTs as bubbles
        setOpenBubbleNfts((prev) => ({ ...prev, [slug]: valid }));
      } catch (err) {
        if (cancelled) return;
        console.error(`Load spotlight NFTs for ${slug} failed`, err);
        setCityNfts((prev) => ({ ...prev, [slug]: [] }));
      }
    }

    loadSpotlightNFTs();
    return () => {
      cancelled = true;
    };
  }, [cities, currentCityIndex, cityNfts, isMobileUI]);

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

  // Load events per city (cached)
  useEffect(() => {
    if (cities.length === 0) return;
    const city = cities[currentCityIndex];
    if (!city) return;
    const slug = city.slug;

    if (cityEvents?.[slug]?.loaded) return;

    let cancelled = false;

    async function loadCityEvents() {
      try {
        const eventsRes = await fetch(`${MAP_SERVER}/api/events/${slug}`);
        if (cancelled) return;

        if (!eventsRes.ok) {
          if (eventsRes.status === 404) {
            setCityEvents((prev) => ({ ...prev, [slug]: { events: [], loaded: true } }));
            return;
          }
          throw new Error(`Failed to load events for ${slug}: ${eventsRes.status}`);
        }

        const eventsData = await eventsRes.json();
        if (cancelled) return;

        setCityEvents((prev) => ({
          ...prev,
          [slug]: { events: Array.isArray(eventsData) ? eventsData : [], loaded: true },
        }));
      } catch (err) {
        if (cancelled) return;
        console.error(`Load events for ${slug} failed`, err);
        setCityEvents((prev) => ({ ...prev, [slug]: { events: [], loaded: true } }));
      }
    }

    loadCityEvents();
    return () => {
      cancelled = true;
    };
  }, [cities, currentCityIndex, cityEvents]);

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

    for (const nft of filteredNfts) {
      const mapX = nft.svgX;
      const mapY = H - nft.svgY;

      const { x: sx, y: sy } = mapToScreen(mapX, mapY, viewBox, t);

      const isSelected = openIds.has(nft.id);
      ctx.beginPath();
      ctx.arc(sx, sy, isSelected ? nftPointRadius * 1.5 : nftPointRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? nftPointColor.selected : nftPointColor.default;
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
    const cityMap = cityMaps[slug];
    if (!cityMap?.viewBox) return;
    if (e.button !== 0) return;

    e.preventDefault();
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

    const clickThreshold = nftPointRadius * 3;
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

    // Toggle bubble: if clicked NFT is already open, close it; otherwise add it
    if (clicked) {
      setOpenBubbleNfts((prev) => {
        const current = prev[slug] || [];
        const isAlreadyOpen = current.some((n) => n.id === clicked.id);
        if (isAlreadyOpen) {
          return { ...prev, [slug]: current.filter((n) => n.id !== clicked.id) };
        } else {
          return { ...prev, [slug]: [...current, clicked] };
        }
      });
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
    // Desktop: 0.05 (~20x zoom), Mobile: 0.025 (~40x zoom)
    const zoomFactor = isMobileUI ? 0.025 : 0.05;
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

      // On desktop: open first few NFTs as bubbles (up to 5)
      // On mobile: do NOT auto-open bubbles (display only NFT points)
      if (!isMobileUI) {
        const bubbles = valid.slice(0, 5);
        setOpenBubbleNfts((prev) => ({ ...prev, [slug]: bubbles }));
      } else {
        // Clear any existing bubbles on mobile venue selection
        setOpenBubbleNfts((prev) => ({ ...prev, [slug]: [] }));
      }
    } catch (err) {
      console.error(`Fetch venue NFTs failed for ${slug}:`, err);
    }
  };

  /**
   * Fetch spotlight NFTs (reset to default view).
   * Called when "All Venues" is selected.
   */
  const fetchSpotlightNfts = async (slug) => {
    try {
      const res = await fetch(`${MAP_SERVER}/api/nfts/${slug}/spotlight?limit=5`);
      if (!res.ok) {
        console.error(`Failed to fetch spotlight NFTs: ${res.status}`);
        return;
      }

      const nftData = await res.json();
      const valid = Array.isArray(nftData)
        ? nftData.filter((nft) => Number.isFinite(nft.svgX) && Number.isFinite(nft.svgY))
        : [];

      setCityNfts((prev) => ({ ...prev, [slug]: valid }));
      setOpenBubbleNfts((prev) => ({ ...prev, [slug]: valid }));
    } catch (err) {
      console.error(`Fetch spotlight NFTs failed for ${slug}:`, err);
    }
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
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--brand-bg)' }}
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

                  <MapFrame city={city} cityMap={cityMap} containerSize={containerSizes[slug]} isMobileUI={isMobileUI} />
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
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--brand-primary)', padding: '0.5rem 0' }}>{city.name_zh || city.name_en || city.slug}</div>

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
                      // "All Venues" selected: reset zoom and fetch spotlight NFTs
                      resetZoom(slug);
                      fetchSpotlightNfts(slug);
                    }
                  }}
                >
                  <option value="">All Venues</option>
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
                  }}
                >
                  <option value="">All Events</option>
                  {eventsForThisCity.map((ev, index) => (
                    <option key={`${ev.id}-${index}`} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </CustomSelect>

                <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', opacity: 0.7, marginTop: '0.25rem' }}>Drag to pan, wheel to zoom</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Render NFT bubbles outside carousel to escape stacking context */}
      {currentSlug && currentContainerSize?.w && currentContainerSize?.h && (() => {
        const rawBubbleNfts = openBubbleNfts[currentSlug] || [];
        if (rawBubbleNfts.length === 0) return null;

        const cityMap = cityMaps[currentSlug];
        if (!cityMap?.viewBox || !cityMap?.mapBounds) return null;

        // Enrich NFTs with venue name for display
        const venues = cityVenues?.[currentSlug]?.venues || [];
        const bubbleNfts = rawBubbleNfts.map((nft) => enrichNftWithVenue(nft, venues));

        // Compute anchors for all bubbles
        const anchors = bubbleNfts
          .map((nft) => {
            const anchor = computeAnchor(nft, cityMap, currentContainerSize);
            if (!anchor) return null;
            return { id: nft.id, x: anchor.x, y: anchor.y };
          })
          .filter(Boolean);

        if (anchors.length === 0) return null;

        return (
          <BubbleLayoutManager
            containerW={currentContainerSize.w}
            containerH={currentContainerSize.h}
            nfts={bubbleNfts}
            anchors={anchors}
            onClose={(nftId) => setOpenBubbleNfts((prev) => ({
              ...prev,
              [currentSlug]: (prev[currentSlug] || []).filter((n) => n.id !== nftId),
            }))}
          />
        );
      })()}

      {cities.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevCity();
            }}
            className={isTutorialAnimating ? "city-nav-pulse" : ""}
            style={{
              position: 'absolute',
              left: isMobileUI ? 'max(1.25rem, env(safe-area-inset-left))' : '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3rem',
              height: '3rem',
              fontSize: '1.5rem',
              color: 'var(--brand-primary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 20,
            }}
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNextCity();
            }}
            className={isTutorialAnimating ? "city-nav-pulse" : ""}
            style={{
              position: 'absolute',
              right: isMobileUI ? 'max(1.25rem, env(safe-area-inset-right))' : '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3rem',
              height: '3rem',
              fontSize: '1.5rem',
              color: 'var(--brand-primary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 20,
            }}
          >
            ›
          </button>
        </>
      )}

      {/* City carousel dots: On mobile, hide in Focused Mode to avoid accidental navigation */}
      {cities.length > 1 && (!isMobileUI || !isMobileFocusedMode) && (
        <div
          style={{
            position: 'absolute',
            bottom: isMobileUI ? 'max(1.25rem, env(safe-area-inset-bottom))' : '1.25rem',
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
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                background: 'transparent',
                border: `${index === currentCityIndex ? '2px' : '1px'} solid var(--brand-primary)`,
                cursor: 'pointer',
                opacity: index === currentCityIndex ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* Left-bottom filters: only for current city (because options are derived from current city's filtered NFTs) */}
      {/* On mobile: only show in Focused Mode (venue or event selected) */}
      {currentSlug && currentFilters && (!isMobileUI || isMobileFocusedMode) && (
        <div
          style={{
            position: 'absolute',
            bottom: isMobileUI ? 'max(1.25rem, env(safe-area-inset-bottom))' : '1.25rem',
            left: isMobileUI ? 'max(1.25rem, env(safe-area-inset-left))' : '1.25rem',
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
            style={{
              background: "transparent",
              padding: "4px",
              fontSize: 14,
              color: "var(--brand-primary)",
              minWidth: 220,
            }}
            value={currentFilters.tag}
            onChange={(e) => setCurrentFilters((prev) => ({ ...prev, tag: e.target.value }))}
            forceOpenUpward
          >
            <option value="">Tag</option>
            {filterOptions.tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
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
            }}
            value={currentFilters.category}
            onChange={(e) => setCurrentFilters((prev) => ({ ...prev, category: e.target.value }))}
            forceOpenUpward
          >
            <option value="">Category</option>
            {filterOptions.categories.map((c) => (
              <option key={c} value={c}>
                {c}
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
            }}
            value={currentFilters.creator}
            onChange={(e) => setCurrentFilters((prev) => ({ ...prev, creator: e.target.value }))}
            forceOpenUpward
          >
            <option value="">Creator</option>
            {filterOptions.creators.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </CustomSelect>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <CustomSelect
              style={{
                background: "transparent",
                padding: "4px",
                fontSize: 14,
                color: "var(--brand-primary)",
                width: "90px",
              }}
              value={currentFilters.year}
              onChange={(e) =>
                setCurrentFilters((prev) => ({
                  ...prev,
                  year: e.target.value,
                  month: "",
                  week: "",
                  day: "",
                }))
              }
              forceOpenUpward
            >
              <option value="">Year</option>
              {filterOptions.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </CustomSelect>

            <CustomSelect
              style={{
                background: "transparent",
                padding: "4px",
                fontSize: 14,
                color: "var(--brand-primary)",
                width: "110px",
              }}
              value={currentFilters.month}
              onChange={(e) =>
                setCurrentFilters((prev) => ({
                  ...prev,
                  month: e.target.value,
                  day: "",
                }))
              }
              forceOpenUpward
            >
              <option value="">Month</option>
              {filterOptions.months.map((m) => {
                const parts = m.split("-");
                const label = parts[1] || m;
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </CustomSelect>

            <CustomSelect
              style={{
                background: "transparent",
                padding: "4px",
                fontSize: 14,
                color: "var(--brand-primary)",
                width: "90px",
              }}
              value={currentFilters.day}
              onChange={(e) => setCurrentFilters((prev) => ({ ...prev, day: e.target.value }))}
              forceOpenUpward
            >
              <option value="">Day</option>
              {filterOptions.days.map((d) => {
                const parts = d.split("-");
                const label = parts[2] || d;
                return (
                  <option key={d} value={d}>
                    {label}
                  </option>
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
              Past
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
              Ongoing
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
              Future
            </label>
          </div>
        </div>
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
      `}</style>
    </div>
  );
}

BoundaryMapPage.displayName = "ShowCase";

export default BoundaryMapPage;
