/**
 * Pure utility functions for map coordinate transformations and calculations.
 * No I/O, no side effects - safe to share with server if needed.
 */

/**
 * Clamp a value between min and max.
 */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(v, max));
}

/**
 * Calculate "nice" step for tick generation (powers of 1, 2, 5, 10).
 */
export function niceStep(rawStep) {
  const pow10 = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const r = rawStep / pow10;
  const niceR = r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10;
  return niceR * pow10;
}

/**
 * Build tick values for a range [min, max] with approximately targetCount ticks.
 */
export function buildTicks(min, max, targetCount = 6) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [];
  const span = Math.abs(max - min);
  const step = niceStep(span / (targetCount - 1));
  const start = Math.ceil(min / step) * step;
  const end = Math.floor(max / step) * step;

  const ticks = [];
  for (let v = start, guard = 0; v <= end + step * 0.5 && guard < 200; v += step, guard++) {
    ticks.push(+v.toFixed(8));
  }
  return ticks;
}

/**
 * Format longitude with hemisphere indicator.
 */
export function fmtLng(lng, decimals = 4) {
  const hemi = lng >= 0 ? "E" : "W";
  return `${Math.abs(lng).toFixed(decimals)}°${hemi}`;
}

/**
 * Format latitude with hemisphere indicator.
 */
export function fmtLat(lat, decimals = 4) {
  const hemi = lat >= 0 ? "N" : "S";
  return `${Math.abs(lat).toFixed(decimals)}°${hemi}`;
}

/**
 * Calculate "nice" meter value for scale bar (powers of 1, 2, 5, 10).
 */
export function niceMeters(m) {
  const pow10 = Math.pow(10, Math.floor(Math.log10(m)));
  const r = m / pow10;
  const niceR = r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10;
  return niceR * pow10;
}

/**
 * Format meters as human-readable string (km or m).
 */
export function fmtMeters(m) {
  if (m >= 1000) {
    const km = m / 1000;
    return km % 1 === 0 ? `${km.toFixed(0)} km` : `${km.toFixed(1)} km`;
  }
  return `${Math.round(m)} m`;
}

/**
 * Calculate SVG "meet" transform for preserveAspectRatio="xMidYMid meet".
 * Returns the actual drawing area dimensions and offsets.
 */
export function getMeetTransform(pixelW, pixelH, viewBox) {
  const scale = Math.min(pixelW / viewBox.width, pixelH / viewBox.height);
  const drawW = viewBox.width * scale;
  const drawH = viewBox.height * scale;
  const offsetX = (pixelW - drawW) / 2;
  const offsetY = (pixelH - drawH) / 2;
  return { scale, drawW, drawH, offsetX, offsetY };
}

/**
 * Convert map (viewBox) coordinates to screen pixel coordinates.
 */
export function mapToScreen(mapX, mapY, viewBox, t) {
  return {
    x: t.offsetX + (mapX - viewBox.x) * t.scale,
    y: t.offsetY + (mapY - viewBox.y) * t.scale,
  };
}

/**
 * Convert screen pixel coordinates to map (viewBox) coordinates.
 */
export function screenToMap(mouseX, mouseY, viewBox, t) {
  const x = clamp(mouseX, t.offsetX, t.offsetX + t.drawW);
  const y = clamp(mouseY, t.offsetY, t.offsetY + t.drawH);
  return {
    x: viewBox.x + (x - t.offsetX) / t.scale,
    y: viewBox.y + (y - t.offsetY) / t.scale,
  };
}

/**
 * Create coordinate mappers for converting between SVG absolute coords and lat/lng.
 * Uses city bbox_wgs84 and mapBounds for linear interpolation.
 *
 * @param {Object} bbox - { minLng, maxLng, minLat, maxLat }
 * @param {Object} mapBounds - { x, y, width, height } in SVG coords
 * @returns {Object} { absToLngLat, lngLatToAbs }
 */
export function createCoordMappers(bbox, mapBounds) {
  const absToLngLat = (absX, absY) => {
    const xRatio = (absX - mapBounds.x) / mapBounds.width;
    const yRatio = (absY - mapBounds.y) / mapBounds.height;
    const lng = bbox.minLng + xRatio * (bbox.maxLng - bbox.minLng);
    const lat = bbox.maxLat - yRatio * (bbox.maxLat - bbox.minLat);
    return { lat, lng };
  };

  const lngLatToAbs = (lng, lat) => {
    const xRatio = (lng - bbox.minLng) / (bbox.maxLng - bbox.minLng);
    const yRatio = (bbox.maxLat - lat) / (bbox.maxLat - bbox.minLat);
    return {
      absX: mapBounds.x + xRatio * mapBounds.width,
      absY: mapBounds.y + yRatio * mapBounds.height,
    };
  };

  return { absToLngLat, lngLatToAbs };
}

/**
 * Calculate endpoint on a rectangle's edge for a line from an anchor point.
 * Used for callout/tooltip connector lines.
 *
 * @param {Object} anchor - { x, y } the point to draw from
 * @param {Object} rect - { x, y, w, h } the rectangle
 * @returns {Object} { x, y } point on the rectangle edge
 */
export function anchorLineToRect(anchor, rect) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = cx - anchor.x;
  const dy = cy - anchor.y;

  const adx = Math.abs(dx) < 1e-6 ? 1e-6 : dx;
  const ady = Math.abs(dy) < 1e-6 ? 1e-6 : dy;

  const tx = (rect.w / 2) / Math.abs(adx);
  const ty = (rect.h / 2) / Math.abs(ady);
  const t = Math.min(tx, ty);

  return { x: cx - dx * t, y: cy - dy * t };
}

/**
 * Parse SVG viewBox string into object.
 */
export function parseViewBox(vb) {
  const s = (vb || "0 0 100 100")
    .trim()
    .split(/\s+/)
    .map(Number);
  const [x, y, width, height] = s.length === 4 && s.every(Number.isFinite) ? s : [0, 0, 100, 100];
  return { x, y, width, height };
}
