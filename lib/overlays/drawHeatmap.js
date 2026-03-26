/**
 * Popularity overlay layer: concentric rings around each NFT point.
 * More claimed_count = more outward-stacking rings.
 */
import { hashSeed, seededRandom } from "./seededRandom";
import { mapToScreen } from "../map-utils";

/** Generate a stable fake claimed_count (1-20) from NFT id */
function fakeClaimed(nftId) {
  const rand = seededRandom(hashSeed(nftId || "x"));
  return 1 + Math.floor(rand() * 20);
}

/**
 * Draw popularity rings on the given canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} filteredNfts
 * @param {Object} opts - { viewBox, meetTransform, mapBoundsH }
 */
export function drawHeatmapLayer(ctx, filteredNfts, opts) {
  const { viewBox, meetTransform: t, mapBoundsH: H } = opts;

  const baseRadius = 22;    // starting radius (just outside the NFT dot ~20px)
  const ringGap = 4;        // spacing between each ring
  const ringWidth = 0.7;    // stroke width of each ring

  ctx.lineWidth = ringWidth;

  for (const nft of filteredNfts) {
    // Use real data if available, otherwise generate stable fake
    const count = nft.claimed_count || fakeClaimed(nft.id);
    if (count <= 0) continue;

    const mapX = nft.svgX;
    const mapY = H - nft.svgY;
    const { x: sx, y: sy } = mapToScreen(mapX, mapY, viewBox, t);

    // City mode: compact (3 claims = 1 ring); Venue mode: amplified (1 claim = 3 rings)
    const venueSelected = !!opts.venueSelected;
    const rings = venueSelected
      ? count * 3             // 1 claim = 3 rings
      : Math.ceil(count / 3); // 3 claims = 1 ring
    for (let i = 0; i < rings; i++) {
      const r = baseRadius + i * ringGap;
      // Fade out as rings expand: innermost = 0.6, outermost fades toward 0.15
      const alpha = 0.6 - (i / Math.max(rings, 1)) * 0.45;

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(237, 80, 36, ${alpha})`;
      ctx.stroke();
    }
  }
}
