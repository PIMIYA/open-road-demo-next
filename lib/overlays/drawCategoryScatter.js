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
import { SHAPE_FUNCTIONS, SHAPE_NAMES } from "./shapes";

// Fixed category → color mapping for maximum contrast between similar types
const CATEGORY_COLOR_MAP = {
  "展覽":                "#fbbf24", // amber
  "表演":                "#e04428", // vermilion red
  "課程":                "#fb923c", // orange
  "導覽":                "#8a6e4e", // coffee brown
  "工作坊":              "#69ff1f", // lime green
  "黑客松":              "#3467eb", // blue
  "研討會／論壇／座談":  "#60a5fa", // sky blue
  "研討會 / 論壇 / 座談": "#60a5fa",
  "節祭／展會／市集":    "#e879f9", // fuchsia (was violet, too close to 導覽)
  "分享會／同好會／見面會": "#00c9a7", // teal
};

/**
 * Build a map of category → { color, shapeFn, shapeName } from filtered NFTs.
 * Each category gets a unique shape assigned by index.
 */
export function getCategoryColorMap(filteredNfts) {
  const result = new Map();
  let idx = 0;
  for (const nft of filteredNfts) {
    if (nft.category && !result.has(nft.category)) {
      result.set(nft.category, CATEGORY_COLOR_MAP[nft.category] || "#888888");
      idx++;
    }
  }
  return result;
}

/** Get shape function for a category by its index among all categories */
function getCategoryShape(categoryColorMap, cat) {
  const keys = [...categoryColorMap.keys()];
  const idx = keys.indexOf(cat);
  return SHAPE_FUNCTIONS[idx >= 0 ? idx % SHAPE_FUNCTIONS.length : 0];
}

function getCategoryShapeName(categoryColorMap, cat) {
  const keys = [...categoryColorMap.keys()];
  const idx = keys.indexOf(cat);
  return SHAPE_NAMES[idx >= 0 ? idx % SHAPE_NAMES.length : 0];
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
  const gridSpacing = 10;   // equal distance between shapes
  const shapeSize = 3;      // radius of each shape
  const baseRadius = venueSelected ? 700 : 80; // base radius, scaled by category count
  const innerClearance = 50; // no crosses within this radius of the NFT center

  // Group NFTs by venue_id to allocate sectors
  const venueGroups = new Map();
  for (const nft of filteredNfts) {
    const key = nft.venue_id || nft.id;
    if (!venueGroups.has(key)) venueGroups.set(key, []);
    venueGroups.get(key).push(nft);
  }

  ctx.lineWidth = 1;
  ctx.lineCap = "round";

  for (const [venueKey, nfts] of venueGroups) {
    // Group NFTs by category within this venue
    const catGroups = new Map();
    for (const nft of nfts) {
      if (!nft.category) continue;
      if (!catGroups.has(nft.category)) catGroups.set(nft.category, []);
      catGroups.get(nft.category).push(nft);
    }

    // Assign each CATEGORY a sector angle proportional to its NFT count
    const catKeys = [...catGroups.keys()].sort();
    const catCount = catKeys.length;
    const totalNftsInVenue = nfts.length;

    // Calculate proportional angles
    const catAngles = catKeys.map(cat => {
      const count = catGroups.get(cat).length;
      return (count / totalNftsInVenue) * Math.PI * 2; // proportional slice of full circle
    });

    // Cumulative start angles
    let angleAccum = -Math.PI;

    for (let catIdx = 0; catIdx < catCount; catIdx++) {
      const cat = catKeys[catIdx];
      const catNfts = catGroups.get(cat);
      const colorEntry = categoryColorMap.get(cat);
      if (!colorEntry) continue;
      const color = typeof colorEntry === "string" ? colorEntry : colorEntry.color;

      const sectorAngle = catAngles[catIdx];
      const sectorStart = angleAccum;
      angleAccum += sectorAngle;
      const count = catCount;

      // Use the first NFT's position as center for this category cluster
      const nft = catNfts[0];
      const mapX = nft.svgX;
      const mapY = H - nft.svgY;
      const { x: sx, y: sy } = mapToScreen(mapX, mapY, viewBox, t);

      const rand = seededRandom(hashSeed(venueKey + "_" + cat + "_cg"));

      // Uniform radius for all categories — angle carries the proportion
      const diversityScale = Math.sqrt(Math.min(catCount, 8) / 8);
      const zoneRadius = baseRadius * diversityScale;

      // Outer boundary noise for organic edge (subtle, won't cause gaps between sectors)
      const noisePoints = 12;
      const noiseAmplitude = 0.15; // ±15% — subtle enough to not create gaps
      const radiiNoise = [];
      for (let ni = 0; ni < noisePoints; ni++) {
        radiiNoise.push(1 - noiseAmplitude + rand() * noiseAmplitude * 2);
      }
      const getRadiusAt = (angle) => {
        const norm = ((angle + Math.PI) / (Math.PI * 2)) * noisePoints;
        const i0 = Math.floor(norm) % noisePoints;
        const i1 = (i0 + 1) % noisePoints;
        const frac = norm - Math.floor(norm);
        const smooth = 0.5 - 0.5 * Math.cos(frac * Math.PI);
        return radiiNoise[i0] * (1 - smooth) + radiiNoise[i1] * smooth;
      };

      const shapeFn = getCategoryShape(categoryColorMap, cat);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.25;

      // Generate grid of shapes within the irregular zone
      for (let gx = -zoneRadius; gx <= zoneRadius; gx += gridSpacing) {
        for (let gy = -zoneRadius; gy <= zoneRadius; gy += gridSpacing) {
          const dist = Math.sqrt(gx * gx + gy * gy);

          // Skip inner clearance zone around NFT center
          if (dist < innerClearance) continue;
          const angle = Math.atan2(gy, gx);

          // Irregular boundary instead of perfect circle
          const maxDist = zoneRadius * getRadiusAt(angle);
          if (dist > maxDist) continue;

          // Check if this grid point falls within this category's sector
          if (count > 1) {
            // Normalize angle offset into [0, 2PI) relative to sectorStart
            let d = angle - sectorStart;
            d = ((d % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (d > sectorAngle) continue;
          }

          // Small jitter for organic feel
          const jx = (rand() - 0.5) * 3;
          const jy = (rand() - 0.5) * 3;

          shapeFn(ctx, sx + gx + jx, sy + gy + jy, shapeSize);
          ctx.fill();
        }
      }
    }
  }

  ctx.globalAlpha = 1;
}
