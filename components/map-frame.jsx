import {
  buildTicks,
  fmtLng,
  fmtLat,
  niceMeters,
  fmtMeters,
  getMeetTransform,
  mapToScreen,
  createCoordMappers,
} from "@/lib/map-utils";

/**
 * MapFrame renders coordinate ticks, north arrow, and scale bar as an SVG overlay.
 * Does not draw an outer frame/border.
 *
 * On mobile (Overview Mode only - hidden in Focused Mode):
 * - Safe-area padding applied to north arrow and scale bar positions
 *
 * @param {Object} props
 * @param {Object} props.city - City data with bbox_wgs84 from cities API
 * @param {Object} props.cityMap - { viewBox, mapBounds } from loaded map state
 * @param {Object} props.containerSize - { w, h } in pixels
 * @param {boolean} props.isMobileUI - Whether mobile UI is active
 */
export default function MapFrame({ city, cityMap, containerSize, isMobileUI = false }) {
  // Validate required props
  if (!city?.bbox_wgs84) return null;
  if (!cityMap?.viewBox || !cityMap?.mapBounds) return null;
  if (!containerSize?.w || !containerSize?.h) return null;

  const bbox = city.bbox_wgs84;
  const viewBox = cityMap.viewBox;
  const mapBounds = cityMap.mapBounds;

  const pixelW = containerSize.w;
  const pixelH = containerSize.h;
  const t = getMeetTransform(pixelW, pixelH, viewBox);

  // Create coordinate mappers using bbox from cities API
  const { absToLngLat, lngLatToAbs } = createCoordMappers(bbox, mapBounds);

  // Calculate visible lat/lng range from current viewBox
  const x0 = viewBox.x;
  const x1 = viewBox.x + viewBox.width;
  const y0 = viewBox.y;
  const y1 = viewBox.y + viewBox.height;

  const tl = absToLngLat(x0, y0);
  const br = absToLngLat(x1, y1);

  const minLng = Math.min(tl.lng, br.lng);
  const maxLng = Math.max(tl.lng, br.lng);
  const minLat = Math.min(tl.lat, br.lat);
  const maxLat = Math.max(tl.lat, br.lat);

  // Build ticks
  const lngTicks = buildTicks(minLng, maxLng, 7);
  const latTicks = buildTicks(minLat, maxLat, 6);

  // Style constants (using brand colors)
  const stroke = "#2483ff";
  const textFill = "#2483ff";
  const thin = 1;
  const tickLenMajor = 10;
  const tickLenMinor = 6;
  const fontSize = 11;
  const labelOffset = 14;

  const leftX = 0.5;
  const rightX = pixelW - 0.5;
  const topY = 0.5;
  const bottomY = pixelH - 0.5;

  // North arrow position (fixed top-right, with safe-area consideration on mobile)
  const northPadding = isMobileUI ? 44 : 34;
  const north = { x: pixelW - northPadding, y: 28 };

  // Scale bar calculation
  // On mobile: position higher to avoid overlap with bottom longitude labels
  const targetPx = Math.min(180, Math.max(120, pixelW * 0.22));
  const metersPerPx = 1 / t.scale;
  const barMeters = niceMeters(targetPx * metersPerPx);
  const barPx = barMeters * t.scale;
  const sbRightOffset = isMobileUI ? 34 : 24;
  const sbBottomOffset = isMobileUI ? 45 : 22; // Higher on mobile to avoid longitude label overlap
  const sb = { x: pixelW - sbRightOffset - barPx, y: pixelH - sbBottomOffset };

  return (
    <svg
      width={pixelW}
      height={pixelH}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 11 }}
    >
      {/* Top/Bottom: Longitude ticks */}
      {lngTicks.map((lng, i) => {
        const isMajor = i % 2 === 0;
        const { absX } = lngLatToAbs(lng, (minLat + maxLat) / 2);
        const { x: sx } = mapToScreen(absX, viewBox.y + viewBox.height / 2, viewBox, t);
        if (sx < 0 || sx > pixelW) return null;

        const len = isMajor ? tickLenMajor : tickLenMinor;
        return (
          <g key={`lng-${lng}`}>
            <line x1={sx} y1={topY} x2={sx} y2={topY + len} stroke={stroke} strokeWidth={thin} opacity="0.9" />
            <line x1={sx} y1={bottomY} x2={sx} y2={bottomY - len} stroke={stroke} strokeWidth={thin} opacity="0.9" />
            {isMajor && (
              <>
                <text x={sx} y={topY + len + labelOffset} textAnchor="middle" fontSize={fontSize} fill={textFill} opacity="0.5">
                  {fmtLng(lng)}
                </text>
                <text x={sx} y={bottomY - len - 6} textAnchor="middle" fontSize={fontSize} fill={textFill} opacity="0.5">
                  {fmtLng(lng)}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Left/Right: Latitude ticks */}
      {latTicks.map((lat, i) => {
        const isMajor = i % 2 === 0;
        const { absY } = lngLatToAbs((minLng + maxLng) / 2, lat);
        const { y: sy } = mapToScreen(viewBox.x + viewBox.width / 2, absY, viewBox, t);
        if (sy < 0 || sy > pixelH) return null;

        const len = isMajor ? tickLenMajor : tickLenMinor;
        return (
          <g key={`lat-${lat}`}>
            <line x1={leftX} y1={sy} x2={leftX + len} y2={sy} stroke={stroke} strokeWidth={thin} opacity="0.9" />
            <line x1={rightX} y1={sy} x2={rightX - len} y2={sy} stroke={stroke} strokeWidth={thin} opacity="0.9" />
            {isMajor && (
              <>
                <text x={leftX + len + 6} y={sy + 4} textAnchor="start" fontSize={fontSize} fill={textFill} opacity="0.5">
                  {fmtLat(lat)}
                </text>
                <text x={rightX - len - 6} y={sy + 4} textAnchor="end" fontSize={fontSize} fill={textFill} opacity="0.5">
                  {fmtLat(lat)}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* North arrow (top-right) */}
      <g>
        <line x1={north.x} y1={north.y + 26} x2={north.x} y2={north.y} stroke={stroke} strokeWidth={thin} opacity="0.9" />
        <polygon
          points={`${north.x},${north.y - 8} ${north.x - 5},${north.y + 5} ${north.x + 5},${north.y + 5}`}
          fill={stroke}
          opacity="0.9"
        />
        <text x={north.x} y={north.y - 12} textAnchor="middle" fontSize={12} fill={textFill} opacity="0.9">
          N
        </text>
      </g>

      {/* Scale bar (bottom-right) */}
      <g>
        <line x1={sb.x} y1={sb.y} x2={sb.x + barPx} y2={sb.y} stroke={stroke} strokeWidth={2} opacity="0.95" />
        <line x1={sb.x} y1={sb.y - 6} x2={sb.x} y2={sb.y + 6} stroke={stroke} strokeWidth={thin} opacity="0.95" />
        <line x1={sb.x + barPx} y1={sb.y - 6} x2={sb.x + barPx} y2={sb.y + 6} stroke={stroke} strokeWidth={thin} opacity="0.95" />
        <text x={sb.x + barPx / 2} y={sb.y - 8} textAnchor="middle" fontSize={11} fill={textFill} opacity="0.9">
          {fmtMeters(barMeters)}
        </text>
      </g>
    </svg>
  );
}
