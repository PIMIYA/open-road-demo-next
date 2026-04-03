/**
 * Pure canvas path drawing functions for geometric shapes.
 * Each function creates a path on ctx — caller decides fill/stroke.
 */

export function drawCircle(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
}

export function drawTriangle(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawSquare(ctx, cx, cy, r) {
  const s = r * 1.4; // visual size match
  ctx.beginPath();
  ctx.rect(cx - s / 2, cy - s / 2, s, s);
}

export function drawPentagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawHexagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawStar(ctx, cx, cy, r) {
  const inner = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    const x = cx + rad * Math.cos(angle);
    const y = cy + rad * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawDiamond(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.7, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.7, cy);
  ctx.closePath();
}

export function drawCross(ctx, cx, cy, r) {
  const w = r * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - r); ctx.lineTo(cx + w, cy - r);
  ctx.lineTo(cx + w, cy - w); ctx.lineTo(cx + r, cy - w);
  ctx.lineTo(cx + r, cy + w); ctx.lineTo(cx + w, cy + w);
  ctx.lineTo(cx + w, cy + r); ctx.lineTo(cx - w, cy + r);
  ctx.lineTo(cx - w, cy + w); ctx.lineTo(cx - r, cy + w);
  ctx.lineTo(cx - r, cy - w); ctx.lineTo(cx - w, cy - w);
  ctx.closePath();
}

export function drawArrow(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.7, cy);
  ctx.lineTo(cx + r * 0.3, cy);
  ctx.lineTo(cx + r * 0.3, cy + r);
  ctx.lineTo(cx - r * 0.3, cy + r);
  ctx.lineTo(cx - r * 0.3, cy);
  ctx.lineTo(cx - r * 0.7, cy);
  ctx.closePath();
}

export function drawCrescent(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.moveTo(cx + r * 0.3 + r * 0.8, cy);
  ctx.arc(cx + r * 0.3, cy, r * 0.8, 0, Math.PI * 2, true);
}

export function drawBowtie(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r * 0.7);
  ctx.lineTo(cx + r, cy + r * 0.7);
  ctx.lineTo(cx + r, cy - r * 0.7);
  ctx.lineTo(cx - r, cy + r * 0.7);
  ctx.closePath();
}

export function drawOctagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawSemiCircle(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI);
  ctx.closePath();
}

/** Ordered list of shape draw functions for cycling */
export const SHAPE_FUNCTIONS = [
  drawCircle,
  drawTriangle,
  drawSquare,
  drawPentagon,
  drawHexagon,
  drawStar,
  drawDiamond,
  drawCross,
  drawArrow,
  drawCrescent,
  drawBowtie,
  drawOctagon,
  drawSemiCircle,
];

export const SHAPE_NAMES = [
  "circle",
  "triangle",
  "square",
  "pentagon",
  "hexagon",
  "star",
  "diamond",
  "cross",
  "arrow",
  "crescent",
  "bowtie",
  "octagon",
  "semicircle",
];
