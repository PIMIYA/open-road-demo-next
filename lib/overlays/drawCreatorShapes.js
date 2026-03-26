/**
 * Creator shapes overlay layer: draws shape icons scattered outward from each NFT position.
 * Each unique creator gets a distinct shape. All shapes use brand-secondary color.
 * The number of shapes per creator at a venue reflects NFT count.
 * Shapes are placed on a grid radiating from the NFT center to avoid overlap.
 */
import { SHAPE_FUNCTIONS, SHAPE_NAMES } from "./shapes";
import { hashSeed, seededRandom } from "./seededRandom";
import { mapToScreen } from "../map-utils";

/**
 * Build a map of creator → { shapeFn, shapeName } from filtered NFTs.
 * Stable assignment: sorted alphabetically by resolved name.
 */
export function getCreatorShapeMap(filteredNfts, artistNameMap) {
  const nameMap = artistNameMap instanceof Map ? artistNameMap : new Map(Object.entries(artistNameMap || {}));

  const addresses = new Set();
  for (const nft of filteredNfts) {
    for (const addr of nft.creators || []) {
      addresses.add(addr);
    }
  }

  const creators = [...addresses]
    .map((addr) => ({ addr, name: nameMap.get(addr) || addr }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const result = new Map();
  creators.forEach(({ addr, name }, i) => {
    result.set(addr, {
      shapeFn: SHAPE_FUNCTIONS[i % SHAPE_FUNCTIONS.length],
      shapeName: SHAPE_NAMES[i % SHAPE_NAMES.length],
      color: "var(--brand-secondary)",
      name,
      address: addr,
    });
  });

  return result;
}

/**
 * Draw creator shapes layer.
 * For each NFT, scatters shapes outward from the NFT position.
 * Uses a shared occupied-cell grid to prevent overlap across all NFTs.
 */
export function drawCreatorShapesLayer(ctx, filteredNfts, venues, creatorShapeMap, opts) {
  const { viewBox, meetTransform: t, mapBoundsH: H } = opts;

  const shapeSize = 4;
  const cellSize = 15;         // spacing between shapes (half of previous 30)
  const innerClearance = 30;   // avoid NFT center (in map-space units)
  const maxRadius = 600;       // max scatter distance (map-space)
  const brandSecondary = "#ff3300";

  // Work in map-space so positions are stable across zoom/pan.
  const occupied = new Set();
  const toKey = (mx, my) => `${Math.round(mx / cellSize)},${Math.round(my / cellSize)}`;

  // Group NFTs by creator so same-creator shapes are placed consecutively
  // (spiral fills adjacent cells → they cluster together)
  const creatorNfts = new Map(); // addr → [nft, ...]
  for (const nft of filteredNfts) {
    for (const addr of nft.creators || []) {
      if (!creatorNfts.has(addr)) creatorNfts.set(addr, []);
      creatorNfts.get(addr).push(nft);
    }
  }

  // Compute a shared anchor per creator (centroid of their NFTs in map-space)
  const creatorAnchors = new Map();
  for (const [addr, nfts] of creatorNfts) {
    let sumX = 0, sumY = 0;
    for (const nft of nfts) {
      sumX += nft.svgX;
      sumY += H - nft.svgY;
    }
    creatorAnchors.set(addr, { x: sumX / nfts.length, y: sumY / nfts.length });
  }

  ctx.fillStyle = brandSecondary;
  ctx.globalAlpha = 0.8;

  // Place all shapes for each creator from their centroid, spiraling outward
  for (const [addr, nfts] of creatorNfts) {
    const info = creatorShapeMap.get(addr);
    if (!info) continue;

    const anchor = creatorAnchors.get(addr);
    const rand = seededRandom(hashSeed(addr));
    let remaining = nfts.length;

    for (let ring = Math.ceil(innerClearance / cellSize); ring < maxRadius / cellSize && remaining > 0; ring++) {
      const candidates = [];
      for (let dx = -ring; dx <= ring; dx++) {
        for (let dy = -ring; dy <= ring; dy++) {
          if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
          const dist = Math.sqrt(dx * dx + dy * dy) * cellSize;
          if (dist < innerClearance) continue;
          candidates.push({ dx, dy });
        }
      }
      // Deterministic shuffle for organic feel
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }

      for (const { dx, dy } of candidates) {
        if (remaining <= 0) break;
        const cellMx = anchor.x + dx * cellSize;
        const cellMy = anchor.y + dy * cellSize;
        const key = toKey(cellMx, cellMy);
        if (occupied.has(key)) continue;

        occupied.add(key);
        const { x: sx, y: sy } = mapToScreen(cellMx, cellMy, viewBox, t);
        info.shapeFn(ctx, sx, sy, shapeSize);
        ctx.fill();
        remaining--;
      }
    }
  }

  ctx.globalAlpha = 1;
}
