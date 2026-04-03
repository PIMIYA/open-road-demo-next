/**
 * Layer visibility toggles with eye icons + legend.
 *
 * Desktop: bare items (no enclosing box) placed directly in top-right.
 * Mobile (narrow): FAB button that expands a collapsible panel,
 *   matching the filter FAB style (brand-secondary outlined, white bg).
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useT } from "@/lib/i18n/useT";

const EyeOpen = ({ color = "currentColor" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = ({ color = "currentColor" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/** SVG mini-shape for legend — supports rotation, sizeScale, fillMode */
function ShapeIcon({ shapeName, color, size = 12, rotation = 0, sizeScale = 1, fillMode = "fill" }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;

  const shapeEl = (() => {
    switch (shapeName) {
      case "circle":
        return <circle cx={cx} cy={cy} r={r} />;
      case "triangle": {
        const pts = [0, 1, 2].map((i) => {
          const a = (Math.PI * 2 * i) / 3 - Math.PI / 2;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        });
        return <polygon points={pts.join(" ")} />;
      }
      case "square":
        return <rect x={cx - r * 0.7} y={cy - r * 0.7} width={r * 1.4} height={r * 1.4} />;
      case "pentagon": {
        const pts = [0, 1, 2, 3, 4].map((i) => {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        });
        return <polygon points={pts.join(" ")} />;
      }
      case "hexagon": {
        const pts = [0, 1, 2, 3, 4, 5].map((i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        });
        return <polygon points={pts.join(" ")} />;
      }
      case "star": {
        const inner = r * 0.45;
        const pts = [...Array(10)].map((_, i) => {
          const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
          const rad = i % 2 === 0 ? r : inner;
          return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
        });
        return <polygon points={pts.join(" ")} />;
      }
      case "diamond":
        return (
          <polygon
            points={`${cx},${cy - r} ${cx + r * 0.7},${cy} ${cx},${cy + r} ${cx - r * 0.7},${cy}`}
          />
        );
      case "cross": {
        const w = r * 0.35;
        return (
          <polygon points={`${cx-w},${cy-r} ${cx+w},${cy-r} ${cx+w},${cy-w} ${cx+r},${cy-w} ${cx+r},${cy+w} ${cx+w},${cy+w} ${cx+w},${cy+r} ${cx-w},${cy+r} ${cx-w},${cy+w} ${cx-r},${cy+w} ${cx-r},${cy-w} ${cx-w},${cy-w}`} />
        );
      }
      case "arrow":
        return (
          <polygon points={`${cx},${cy-r} ${cx+r*0.7},${cy} ${cx+r*0.3},${cy} ${cx+r*0.3},${cy+r} ${cx-r*0.3},${cy+r} ${cx-r*0.3},${cy} ${cx-r*0.7},${cy}`} />
        );
      case "crescent":
        return (
          <path d={`M${cx+r},${cy} A${r},${r} 0 1,0 ${cx-r},${cy} A${r*0.8},${r*0.8} 0 1,1 ${cx+r},${cy}`} />
        );
      case "bowtie":
        return (
          <polygon points={`${cx-r},${cy-r*0.7} ${cx+r},${cy+r*0.7} ${cx+r},${cy-r*0.7} ${cx-r},${cy+r*0.7}`} />
        );
      case "octagon": {
        const pts = [0,1,2,3,4,5,6,7].map((i) => {
          const a = (Math.PI * 2 * i) / 8 - Math.PI / 8;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        });
        return <polygon points={pts.join(" ")} />;
      }
      case "semicircle":
        return (
          <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy} Z`} />
        );
      default:
        return <circle cx={cx} cy={cy} r={r} />;
    }
  })();

  const rotDeg = (rotation || 0) * (180 / Math.PI);
  const fillProps = fillMode === "stroke"
    ? { fill: "none", stroke: color, strokeWidth: 1 }
    : { fill: color, stroke: "none" };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, overflow: "visible" }}>
      <g {...fillProps} transform={`translate(${cx}, ${cy}) rotate(${rotDeg}) scale(${sizeScale}) translate(${-cx}, ${-cy})`}>
        {shapeEl}
      </g>
    </svg>
  );
}

/** Shared layer toggles + legend content (used in both desktop and mobile panel) */
function LayerContent({ layers, onToggle, creatorShapeMap, categoryColorMap, layerVisibility }) {
  const t = useT();
  const showCreators = layerVisibility.creatorShapes && creatorShapeMap.size > 0;
  const showCategories = layerVisibility.categoryScatter && categoryColorMap.size > 0;

  return (
    <>
      {/* Eye toggles */}
      {layers.map((layer) => (
        <button
          key={layer.key}
          onClick={() => onToggle(layer.key)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            padding: "3px 0",
            cursor: "pointer",
            color: "var(--brand-primary)",
            fontSize: "12px",
            fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
            textAlign: "left",
            opacity: layer.visible ? 1 : 0.4,
            transition: "opacity 0.2s",
          }}
        >
          {layer.visible
            ? <EyeOpen color="var(--brand-primary)" />
            : <EyeClosed color="var(--brand-primary)" />}
          <span>{layer.label}</span>
        </button>
      ))}

      {/* Creator legend */}
      {showCreators && (
        <>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", margin: "4px 0" }} />
          <div style={{ fontSize: "10px", color: "var(--brand-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {t.map.creators}
          </div>
          {[...creatorShapeMap.values()].map((info) => (
            <div
              key={info.address}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "1px 0",
                fontSize: "11px",
                color: "var(--brand-primary)",
              }}
            >
              <ShapeIcon shapeName={info.shapeName} color={info.color} rotation={info.rotation} sizeScale={info.sizeScale} fillMode={info.fillMode} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif' }}>
                {t.artistMap?.[info.name] || t.organizerMap?.[info.name] || info.name}
              </span>
            </div>
          ))}
        </>
      )}

      {/* Category legend */}
      {showCategories && (
        <>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", margin: "4px 0" }} />
          <div style={{ fontSize: "10px", color: "var(--brand-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {t.map.categories}
          </div>
          {[...categoryColorMap.entries()].map(([cat, color]) => (
            <div
              key={cat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "1px 0",
                fontSize: "11px",
                color: "var(--brand-primary)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                  border: "none",
                }}
              />
              <span style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif' }}>{t.categoryMap?.[cat] || cat}</span>
            </div>
          ))}
        </>
      )}
    </>
  );
}

/**
 * @param {Object} props
 * @param {{ key: string, label: string, visible: boolean }[]} props.layers
 * @param {(key: string) => void} props.onToggle
 * @param {Map} props.creatorShapeMap
 * @param {Map} props.categoryColorMap
 * @param {Object} props.layerVisibility
 * @param {boolean} props.isNarrowWidth - mobile/narrow mode
 * @param {number} props.filteredNftsCount - triggers overflow recheck when data changes
 */
export default function LayerToggle({
  layers,
  onToggle,
  creatorShapeMap,
  categoryColorMap,
  layerVisibility,
  isNarrowWidth,
  filteredNftsCount = 0,
}) {
  const [panelOpen, setPanelOpen] = useState(false);

  // Desktop overflow detection (hooks must be before any conditional return)
  const contentRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    // Has more content below current scroll position
    setHasOverflow(el.scrollHeight - el.scrollTop > el.clientHeight + 2);
  }, []);

  useEffect(() => {
    checkOverflow();
  }, [checkOverflow, filteredNftsCount, layerVisibility]);

  useEffect(() => {
    const el = contentRef.current;
    window.addEventListener("resize", checkOverflow);
    if (el) el.addEventListener("scroll", checkOverflow);
    return () => {
      window.removeEventListener("resize", checkOverflow);
      if (el) el.removeEventListener("scroll", checkOverflow);
    };
  }, [checkOverflow]);

  const activeCount = layers.filter((l) => l.visible).length;

  const stopProp = {
    onPointerDown: (e) => e.stopPropagation(),
    onMouseDown: (e) => e.stopPropagation(),
    onClick: (e) => e.stopPropagation(),
  };

  if (isNarrowWidth) {
    // --- Mobile: FAB + collapsible panel (mirrors filter FAB style) ---
    return (
      <div {...stopProp}>
        {/* Collapsible panel */}
        {panelOpen && (
          <div
            style={{
              position: "absolute",
              bottom: 56,
              left: 0,
              zIndex: 30,
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              background: "rgba(245, 245, 245, 0.92)",
              backdropFilter: "blur(8px)",
              borderRadius: 12,
              padding: "0.75rem",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              minWidth: 160,
              maxHeight: "50vh",
              overflowY: "auto",
            }}
          >
            <LayerContent
              layers={layers}
              onToggle={onToggle}
              creatorShapeMap={creatorShapeMap}
              categoryColorMap={categoryColorMap}
              layerVisibility={layerVisibility}
            />
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setPanelOpen((prev) => !prev)}
          style={{
            position: "relative",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: panelOpen ? "var(--brand-secondary)" : "rgba(245, 245, 245, 0.85)",
            backdropFilter: "blur(4px)",
            border: `1.5px solid ${panelOpen ? "var(--brand-secondary)" : "var(--brand-secondary)"}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            padding: 0,
          }}
          aria-label="Toggle layers"
        >
          {/* Layer icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={panelOpen ? "#fff" : "var(--brand-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          {/* Active layer count badge */}
          {activeCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "var(--brand-secondary)",
                color: "#fff",
                fontSize: 10,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  // --- Desktop: bare items, no enclosing box, hidden scrollbar with scroll ---
  return (
    <div {...stopProp} style={{ position: "relative", width: 150 }}>
      <div
        ref={contentRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          maxHeight: "50vh",
          overflowY: "auto",
          scrollbarWidth: "none",        /* Firefox */
          msOverflowStyle: "none",       /* IE/Edge */
        }}
        className="layer-toggle-scroll"
      >
        <LayerContent
          layers={layers}
          onToggle={onToggle}
          creatorShapeMap={creatorShapeMap}
          categoryColorMap={categoryColorMap}
          layerVisibility={layerVisibility}
        />
      </div>
      {hasOverflow && (
        <div
          onClick={() => {
            const el = contentRef.current;
            if (el) el.scrollBy({ top: 60, behavior: "smooth" });
          }}
          style={{
            borderTop: "1px solid rgba(237, 80, 36, 0.2)",
            display: "flex",
            justifyContent: "center",
            paddingTop: "4px",
            marginTop: "2px",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
      {/* Hide WebKit scrollbar */}
      <style jsx>{`
        .layer-toggle-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
