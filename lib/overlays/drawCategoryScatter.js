/**
 * Category cross-grid overlay layer.
 *
 * Each NFT gets a zone around its position filled with evenly-spaced tiny crosses.
 * The cross color is determined by the NFT's category.
 *
 * NFTs of the same venue are grouped: each category gets an angular sector around
 * the venue center so categories don't overlap. Within each sector, crosses are
 * placed on a regular grid, then jittered outward from the NFT point for an
 * organic feel. The grid spacing is constant (equal distance between crosses).
 */
import { hashSeed, seededRandom } from "./seededRandom";
import { mapToScreen } from "../map-utils";

// Distinct category color palette
const CATEGORY_COLORS = [
  "#00c9a7", // teal
  "#c4b5fd", // lavender
  "#fbbf24", // amber
  "#f87171", // coral
  "#60a5fa", // sky blue
  "#a78bfa", // violet
  "#34d399", // emerald
  "#fb923c", // orange
  "#e879f9", // fuchsia
  "#38bdf8", // light blue
];

/**
 * Build a map of category → color from filtered NFTs.
 */
export function getCategoryColorMap(filteredNfts) {
  const cats = new Set();
  for (const nft of filteredNfts) {
    if (nft.category) cats.add(nft.category);
  }
  const sorted = [...cats].sort();
  const result = new Map();
  sorted.forEach((cat, i) => {
    result.set(cat, CATEGORY_COLORS[i % CATEGORY_COLORS.length]);
  });
  return result;
}

/** Draw a small cross (+ shape) centered at (cx, cy) */
function drawCross(ctx, cx, cy, arm) {
  ctx.moveTo(cx - arm, cy);
  ctx.lineTo(cx + arm, cy);
  ctx.moveTo(cx, cy - arm);
  ctx.lineTo(cx, cy + arm);
}

/**
 * Draw category cross-grid layer.
 *
 * For each NFT position, fills a rectangular zone with a grid of tiny crosses
 * colored by category. NFTs sharing the same venue_id have their zones offset
 * into angular sectors so each category occupies its own area.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} filteredNfts
 * @param {Map} categoryColorMap
 * @param {Object} opts - { viewBox, meetTransform, mapBoundsH }
 */
export function drawCategoryScatterLayer(ctx, filteredNfts, categoryColorMap, opts) {
  const { viewBox, meetTransform: t, mapBoundsH: H } = opts;

  const venueSelected = !!opts.venueSelected;
  const gridSpacing = 10;   // equal distance between crosses
  const crossArm = 2.5;     // half-length of each cross arm
  const baseRadius = venueSelected ? 350 : 50; // base radius, scaled by category count
  const innerClearance = 50; // no crosses within this radius of the NFT center

  // Group NFTs by venue_id to allocate sectors
  const venueGroups = new Map();
  for (const nft of filteredNfts) {
    const key = nft.venue_id || nft.id;
    if (!venueGroups.has(key)) venueGroups.set(key, []);
    venueGroups.get(key).push(nft);
  }

  // Count NFTs per category per venue for radius scaling
  const venueCatCounts = new Map();
  for (const [key, nfts] of venueGroups) {
    const catCount = new Map();
    for (const nft of nfts) {
      if (!nft.category) continue;
      catCount.set(nft.category, (catCount.get(nft.category) || 0) + 1);
    }
    venueCatCounts.set(key, catCount);
  }

  // Find the max category count across all venues (for normalization)
  let maxCatCount = 1;
  for (const [, catCount] of venueCatCounts) {
    for (const [, c] of catCount) {
      if (c > maxCatCount) maxCatCount = c;
    }
  }

  ctx.lineWidth = 1;
  ctx.lineCap = "round";

  for (const [venueKey, nfts] of venueGroups) {
    const count = nfts.length;
    const catCounts = venueCatCounts.get(venueKey) || new Map();

    for (let idx = 0; idx < count; idx++) {
      const nft = nfts[idx];
      const color = categoryColorMap.get(nft.category);
      if (!color) continue;

      const mapX = nft.svgX;
      const mapY = H - nft.svgY;
      const { x: sx, y: sy } = mapToScreen(mapX, mapY, viewBox, t);

      // Each NFT in the venue gets an angular sector
      const sectorAngle = (Math.PI * 2) / Math.max(count, 1);
      const sectorStart = sectorAngle * idx - Math.PI;

      const rand = seededRandom(hashSeed(nft.id + "_cg"));

      // Scale zoneRadius by category count: sqrt for area-proportional scaling
      // min 30% of baseRadius (1 NFT) → 100% (max category count)
      const catNftCount = catCounts.get(nft.category) || 1;
      const scale = 0.3 + 0.7 * Math.sqrt(catNftCount / maxCatCount);
      const zoneRadius = baseRadius * scale;

      // Pre-generate irregular boundary: radius varies per angular slice
      // using low-frequency noise (8 control points interpolated smoothly)
      const noisePoints = 8;
      const noiseAmplitude = 0.35; // ±35% variation from zoneRadius
      const radiiNoise = [];
      for (let n = 0; n < noisePoints; n++) {
        radiiNoise.push(1 - noiseAmplitude + rand() * noiseAmplitude * 2);
      }
      // Get interpolated radius multiplier for any angle (smooth cosine interp)
      const getRadiusAt = (angle) => {
        const norm = ((angle + Math.PI) / (Math.PI * 2)) * noisePoints;
        const i0 = Math.floor(norm) % noisePoints;
        const i1 = (i0 + 1) % noisePoints;
        const frac = norm - Math.floor(norm);
        const smooth = 0.5 - 0.5 * Math.cos(frac * Math.PI); // cosine interp
        return radiiNoise[i0] * (1 - smooth) + radiiNoise[i1] * smooth;
      };

      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();

      // Generate grid of crosses within the irregular zone
      for (let gx = -zoneRadius; gx <= zoneRadius; gx += gridSpacing) {
        for (let gy = -zoneRadius; gy <= zoneRadius; gy += gridSpacing) {
          const dist = Math.sqrt(gx * gx + gy * gy);

          // Skip inner clearance zone around NFT center
          if (dist < innerClearance) continue;
          const angle = Math.atan2(gy, gx);

          // Irregular boundary instead of perfect circle
          const maxDist = zoneRadius * getRadiusAt(angle);
          if (dist > maxDist) continue;

          // Check if this grid point falls within this NFT's angular sector
          let angleDiff = angle - sectorStart;
          // Normalize to [-PI, PI]
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          if (count > 1 && Math.abs(angleDiff) > sectorAngle / 2) continue;

          // Small jitter for organic feel
          const jx = (rand() - 0.5) * 3;
          const jy = (rand() - 0.5) * 3;

          drawCross(ctx, sx + gx + jx, sy + gy + jy, crossArm);
        }
      }

      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}
