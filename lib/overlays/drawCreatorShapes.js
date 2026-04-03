/**
 * Creator shapes overlay layer: draws shape icons scattered outward from each NFT position.
 * Each unique creator gets a distinct shape. All shapes use brand-secondary color.
 * The number of shapes per creator at a venue reflects NFT count.
 * Shapes are placed on a grid radiating from the NFT center to avoid overlap.
 */
import { SHAPE_FUNCTIONS, SHAPE_NAMES } from "./shapes";
import { hashSeed, seededRandom } from "./seededRandom";
import { mapToScreen } from "../map-utils";

// Variation parameters derived from hash
const ROTATIONS = [0, Math.PI / 6, Math.PI / 4, Math.PI / 3]; // 0°, 30°, 45°, 60°
const SIZE_SCALES = [0.8, 1.0, 1.2];
const FILL_MODES = ["fill", "stroke"]; // removed "half" — opacity difference too subtle

/**
 * Build a map of creator → { shapeFn, shapeName, rotation, sizeScale, fillMode }
 * Uses address hash for deterministic, unique visual identity per creator.
 * 7 shapes × 4 rotations × 3 sizes × 3 fill modes = 252 unique combos.
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
  creators.forEach(({ addr, name }) => {
    const h = hashSeed(addr);
    const rand = seededRandom(h);

    // Deterministic selection from each dimension
    const shapeIdx = Math.abs(h) % SHAPE_FUNCTIONS.length;
    const rotIdx = Math.abs(hashSeed(addr + "_r")) % ROTATIONS.length;
    const sizeIdx = Math.abs(hashSeed(addr + "_s")) % SIZE_SCALES.length;
    const fillIdx = Math.abs(hashSeed(addr + "_f")) % FILL_MODES.length;

    result.set(addr, {
      shapeFn: SHAPE_FUNCTIONS[shapeIdx],
      shapeName: SHAPE_NAMES[shapeIdx],
      rotation: ROTATIONS[rotIdx],
      sizeScale: SIZE_SCALES[sizeIdx],
      fillMode: FILL_MODES[fillIdx],
      color: "var(--brand-secondary)",
      name,
      address: addr,
    });
  });

  return result;
}

/**
 * Draw creator shapes layer.
 * Groups NFTs by creator, then places all shapes for the same creator
 * in a clustered sector around a shared anchor point.
 */
export function drawCreatorShapesLayer(ctx, filteredNfts, venues, creatorShapeMap, opts) {
  const { viewBox, meetTransform: t, mapBoundsH: H } = opts;

  const baseShapeSize = 4;
  const cellSize = 15;
  const innerClearance = 30;
  const maxRadius = 600;
  const brandSecondary = "#ff3300";

  const occupied = new Set();
  const toKey = (mx, my) => `${Math.round(mx / cellSize)},${Math.round(my / cellSize)}`;

  // Group NFTs by creator address
  const creatorGroups = new Map();
  for (const nft of filteredNfts) {
    for (const addr of nft.creators || []) {
      if (!creatorShapeMap.has(addr)) continue;
      if (!creatorGroups.has(addr)) creatorGroups.set(addr, []);
      creatorGroups.get(addr).push(nft);
    }
  }

  // Sort creators for stable sector assignment
  const creatorAddrs = [...creatorGroups.keys()].sort();
  const creatorCount = creatorAddrs.length;

  for (let cIdx = 0; cIdx < creatorCount; cIdx++) {
    const addr = creatorAddrs[cIdx];
    const nfts = creatorGroups.get(addr);
    const info = creatorShapeMap.get(addr);
    if (!info || nfts.length === 0) continue;

    // Group this creator's NFTs by venue — draw at each venue separately
    const venueGroups = new Map();
    for (const nft of nfts) {
      const vKey = nft.venue_id || "none";
      if (!venueGroups.has(vKey)) venueGroups.set(vKey, []);
      venueGroups.get(vKey).push(nft);
    }

    const sectorAngle = (Math.PI * 2) / Math.max(creatorCount, 1);
    const sectorStart = sectorAngle * cIdx - Math.PI;

    for (const [, venueNfts] of venueGroups) {
      // Anchor at the first NFT of this venue
      const anchorNft = venueNfts[0];
      const anchorX = anchorNft.svgX;
      const anchorY = H - anchorNft.svgY;

      const rand = seededRandom(hashSeed(addr + "_" + (anchorNft.venue_id || "") + "_cs"));

    // Place one shape per NFT at this venue
    for (let ni = 0; ni < venueNfts.length; ni++) {
      let placed = false;

      for (let ring = Math.ceil(innerClearance / cellSize); ring < maxRadius / cellSize && !placed; ring++) {
        const candidates = [];
        for (let dx = -ring; dx <= ring; dx++) {
          for (let dy = -ring; dy <= ring; dy++) {
            if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
            const dist = Math.sqrt(dx * dx + dy * dy) * cellSize;
            if (dist < innerClearance) continue;

            // Check if within this creator's angular sector
            const angle = Math.atan2(dy, dx);
            let angleDiff = angle - sectorStart;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            if (creatorCount > 1 && Math.abs(angleDiff) > sectorAngle / 2) continue;

            candidates.push({ dx, dy });
          }
        }

        // Shuffle
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        for (const { dx, dy } of candidates) {
          const cellMx = anchorX + dx * cellSize;
          const cellMy = anchorY + dy * cellSize;
          const key = toKey(cellMx, cellMy);
          if (occupied.has(key)) continue;

          occupied.add(key);
          const { x: sx, y: sy } = mapToScreen(cellMx, cellMy, viewBox, t);
          const sz = baseShapeSize * (info.sizeScale || 1);

          ctx.save();
          // Apply rotation around shape center
          if (info.rotation) {
            ctx.translate(sx, sy);
            ctx.rotate(info.rotation);
            ctx.translate(-sx, -sy);
          }

          info.shapeFn(ctx, sx, sy, sz);

          // Apply fill mode
          ctx.fillStyle = brandSecondary;
          ctx.strokeStyle = brandSecondary;
          ctx.lineWidth = 0.8;
          if (info.fillMode === "stroke") {
            ctx.globalAlpha = 0.8;
            ctx.stroke();
          } else {
            ctx.globalAlpha = 0.8;
            ctx.fill();
          }
          ctx.restore();

          placed = true;
          break;
        }
      }
    }
    } // end venueGroups
  }

  ctx.globalAlpha = 1;
}
