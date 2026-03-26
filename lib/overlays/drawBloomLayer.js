/**
 * Bloom overlay layer: draws soft blurred patches around the outer edges
 * of the visible map area using brand-primary color.
 *
 * The canvas element should have CSS `filter: blur(50px)` applied —
 * GPU-accelerated compositing, near-zero per-frame cost.
 */
import { seededRandom, hashSeed } from "./seededRandom";

const BLOOM_COLOR = "rgba(36, 131, 255, 0.30)"; // brand-primary with alpha

/**
 * Draw bloom patches along the periphery of the map area.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} opts - { pixelW, pixelH, meetTransform }
 */
export function drawBloomLayer(ctx, opts) {
  const { pixelW, pixelH } = opts;

  // Deterministic RNG so positions don't shift on re-render
  const rand = seededRandom(hashSeed("bloom-edge-overlay"));

  // Place circles along the canvas edges, allowing them to be clipped
  const count = 22;
  const baseR = Math.min(pixelW, pixelH) * 0.1;

  for (let i = 0; i < count; i++) {
    // Walk around the canvas perimeter (0→1 maps to top→right→bottom→left)
    const perimT = i / count + rand() * (1 / count) * 0.5;
    const perimeter = 2 * (pixelW + pixelH);
    const dist = perimT * perimeter;

    // Offset: negative = further outside edge, positive = slightly inward
    // Range roughly -baseR*0.6 .. +baseR*0.3  →  biased outward
    const edgeOffset = -baseR * 0.6 + rand() * baseR * 0.9;

    let x, y;
    if (dist < pixelW) {
      // Top edge
      x = dist;
      y = edgeOffset;
    } else if (dist < pixelW + pixelH) {
      // Right edge
      x = pixelW - edgeOffset;
      y = dist - pixelW;
    } else if (dist < 2 * pixelW + pixelH) {
      // Bottom edge
      x = pixelW - (dist - pixelW - pixelH);
      y = pixelH - edgeOffset;
    } else {
      // Left edge
      x = edgeOffset;
      y = pixelH - (dist - 2 * pixelW - pixelH);
    }

    const r = baseR * (0.5 + rand() * 1.0);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = BLOOM_COLOR;
    ctx.fill();
  }
}
