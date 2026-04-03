/**
 * Draw category geometric shapes with impressionistic brush texture.
 * Supports progressive drawing via `progress` (0..1) — simulates
 * SVG stroke-dasharray/dashoffset animation on Canvas.
 */

const TWO_PI = Math.PI * 2;

function noise(x, y = 0) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function hexToRgba(hex, a) {
  return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;
}

/**
 * Draw scattered dots along a line segment (brush stroke).
 */
function brushLine(ctx, x1, y1, x2, y2, color, opts = {}) {
  const { density = 3, spread = 0.8, minAlpha = 0.15, maxAlpha = 0.6, minSize = 0.4, maxSize = 1.2 } = opts;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(6, Math.round(dist * density));

  for (let pass = 0; pass < 3; pass++) {
    const passSpread = spread * (0.3 + pass * 0.4);
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const n1 = noise(x * 0.05 + pass * 50, y * 0.05);
      const n2 = noise(x * 0.08 + 100 + pass * 30, y * 0.08 + 100);
      const ox = (n1 - 0.5) * passSpread * 2;
      const oy = (n2 - 0.5) * passSpread * 2;
      const alpha = minAlpha + n1 * (maxAlpha - minAlpha);
      const size = minSize + n2 * (maxSize - minSize);
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, size, 0, TWO_PI);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.fill();
    }
  }
}

/**
 * Fill area with scattered dots.
 */
function brushFill(ctx, cx, cy, r, color, shapeTest, opts = {}) {
  const { density = 0.35, minAlpha = 0.12, maxAlpha = 0.45, minSize = 0.5, maxSize = 1.8 } = opts;
  const area = Math.PI * r * r;
  const count = Math.round(area * density);
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < count; i++) {
      const angle = noise(i * 0.7 + pass * 100, cx * 0.01) * TWO_PI;
      const dist = Math.sqrt(noise(i * 0.3 + pass * 77, cy * 0.01)) * r;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      if (shapeTest && !shapeTest(x, y, cx, cy, r)) continue;
      const n = noise(x * 0.06 + pass * 20, y * 0.06);
      const alpha = minAlpha + n * (maxAlpha - minAlpha);
      const size = minSize + noise(x * 0.1 + pass * 15, y * 0.1) * (maxSize - minSize);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TWO_PI);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.fill();
    }
  }
}

function inCircle(x, y, cx, cy, r) { return Math.hypot(x - cx, y - cy) <= r; }
function inTriangle(x, y, cx, cy, r) {
  const ax = cx, ay = cy - r, bx = cx + r * 0.87, by = cy + r * 0.5, _cx = cx - r * 0.87, _cy = cy + r * 0.5;
  const d1 = (x-bx)*(ay-by)-(ax-bx)*(y-by), d2 = (x-_cx)*(by-_cy)-(bx-_cx)*(y-_cy), d3 = (x-ax)*(_cy-ay)-(_cx-ax)*(y-ay);
  return !((d1<0||d2<0||d3<0) && (d1>0||d2>0||d3>0));
}
function inPentagon(x, y, cx, cy, r) { return Math.hypot(x - cx, y - cy) <= r * 0.78; }

// ── Build path segments for each shape type ──

function getShapePath(type, cx, cy, r) {
  const segs = []; // array of { x1, y1, x2, y2 }

  switch (type) {
    case "scatter": {
      const offsets = [[0.4,-0.35],[-0.45,0.3],[0.15,0.5],[-0.25,-0.5]];
      offsets.forEach(([ox, oy], i) => {
        const cr = r * (0.2 + i * 0.06);
        const x = cx + ox * r, y = cy + oy * r;
        const steps = 24;
        for (let s = 0; s < steps; s++) {
          const a1 = (s / steps) * TWO_PI, a2 = ((s + 1) / steps) * TWO_PI;
          segs.push({ x1: x + Math.cos(a1)*cr, y1: y + Math.sin(a1)*cr, x2: x + Math.cos(a2)*cr, y2: y + Math.sin(a2)*cr });
        }
      });
      break;
    }
    case "triangle": {
      const pts = [[cx, cy-r],[cx+r*0.87, cy+r*0.5],[cx-r*0.87, cy+r*0.5]];
      for (let i = 0; i < 3; i++) segs.push({ x1: pts[i][0], y1: pts[i][1], x2: pts[(i+1)%3][0], y2: pts[(i+1)%3][1] });
      break;
    }
    case "layers": {
      const ext = 5;
      for (let i = 0; i < 3; i++) {
        const y = cy - r*0.5 + i*r*0.5;
        const w = r * (0.85 - i*0.08) * ext;
        segs.push({ x1: cx-w, y1: y, x2: cx+w, y2: y });
      }
      break;
    }
    case "path": {
      const ext = 5, steps = 80;
      let prevX = null, prevY = null;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        if (Math.floor(t * 14) % 2 === 0) { prevX = null; continue; }
        const x = cx - r*0.8*ext + t*r*1.6*ext;
        const y = cy + Math.sin(t * Math.PI * 2.5) * r * 0.6;
        if (prevX !== null) segs.push({ x1: prevX, y1: prevY, x2: x, y2: y });
        prevX = x; prevY = y;
      }
      // Arrow
      const ax = cx + r*ext*0.7, ay = cy - r*0.4;
      segs.push({ x1: ax-r*0.3, y1: ay-r*0.3, x2: ax, y2: ay });
      segs.push({ x1: ax-r*0.35, y1: ay+r*0.1, x2: ax, y2: ay });
      break;
    }
    case "pentagon": {
      const angles = [0,0.75,1.4,2.2,2.85].map(a => a*Math.PI - Math.PI/2);
      const radii = [1,0.85,0.95,0.8,0.9];
      const pts = angles.map((a,i) => [cx + Math.cos(a)*r*radii[i]*0.75, cy + Math.sin(a)*r*radii[i]*0.75]);
      for (let i = 0; i < pts.length; i++) segs.push({ x1: pts[i][0], y1: pts[i][1], x2: pts[(i+1)%pts.length][0], y2: pts[(i+1)%pts.length][1] });
      break;
    }
    case "starburst": {
      const rays = 7, ext = 5;
      for (let i = 0; i < rays; i++) {
        const a = (i/rays)*TWO_PI - Math.PI/2;
        const len = r * (0.4 + (i%3)*0.15) * ext;
        segs.push({ x1: cx, y1: cy, x2: cx+Math.cos(a)*len, y2: cy+Math.sin(a)*len });
      }
      break;
    }
    case "venn": {
      const d = r * 0.3;
      [cx-d, cx+d].forEach(x => {
        const steps = 30;
        for (let s = 0; s < steps; s++) {
          const a1 = (s/steps)*TWO_PI, a2 = ((s+1)/steps)*TWO_PI;
          segs.push({ x1: x+Math.cos(a1)*r*0.5, y1: cy+Math.sin(a1)*r*0.5, x2: x+Math.cos(a2)*r*0.5, y2: cy+Math.sin(a2)*r*0.5 });
        }
      });
      break;
    }
    case "mixed": {
      const rx = cx-r*0.55, ry = cy-r*0.1, rw = r*0.45, rh = r*0.45;
      segs.push({x1:rx,y1:ry,x2:rx+rw,y2:ry},{x1:rx+rw,y1:ry,x2:rx+rw,y2:ry+rh},{x1:rx+rw,y1:ry+rh,x2:rx,y2:ry+rh},{x1:rx,y1:ry+rh,x2:rx,y2:ry});
      const tpts = [[cx+r*0.05,cy-r*0.55],[cx+r*0.5,cy+r*0.05],[cx-r*0.25,cy+r*0.05]];
      for (let i=0;i<3;i++) segs.push({x1:tpts[i][0],y1:tpts[i][1],x2:tpts[(i+1)%3][0],y2:tpts[(i+1)%3][1]});
      const ccx=cx+r*0.25, ccy=cy+r*0.4, cr2=r*0.22;
      for (let s=0;s<20;s++) { const a1=(s/20)*TWO_PI,a2=((s+1)/20)*TWO_PI; segs.push({x1:ccx+Math.cos(a1)*cr2,y1:ccy+Math.sin(a1)*cr2,x2:ccx+Math.cos(a2)*cr2,y2:ccy+Math.sin(a2)*cr2}); }
      break;
    }
    case "hub": {
      const sats = 4;
      for (let i = 0; i < sats; i++) {
        const a = (i/sats)*TWO_PI - Math.PI/4;
        const sx = cx+Math.cos(a)*r*0.65, sy = cy+Math.sin(a)*r*0.65;
        segs.push({x1:cx,y1:cy,x2:sx,y2:sy}); // spoke
        const sr = r*0.14;
        for (let s=0;s<16;s++) { const a1=(s/16)*TWO_PI,a2=((s+1)/16)*TWO_PI; segs.push({x1:sx+Math.cos(a1)*sr,y1:sy+Math.sin(a1)*sr,x2:sx+Math.cos(a2)*sr,y2:sy+Math.sin(a2)*sr}); }
      }
      // Center circle
      for (let s=0;s<16;s++) { const a1=(s/16)*TWO_PI,a2=((s+1)/16)*TWO_PI; segs.push({x1:cx+Math.cos(a1)*r*0.18,y1:cy+Math.sin(a1)*r*0.18,x2:cx+Math.cos(a2)*r*0.18,y2:cy+Math.sin(a2)*r*0.18}); }
      break;
    }
    default: {
      for (let s=0;s<24;s++) { const a1=(s/24)*TWO_PI,a2=((s+1)/24)*TWO_PI; segs.push({x1:cx+Math.cos(a1)*r*0.4,y1:cy+Math.sin(a1)*r*0.4,x2:cx+Math.cos(a2)*r*0.4,y2:cy+Math.sin(a2)*r*0.4}); }
    }
  }

  // Compute cumulative length
  let totalLen = 0;
  const segLens = segs.map(s => { const l = Math.hypot(s.x2-s.x1, s.y2-s.y1); totalLen += l; return l; });
  return { segs, segLens, totalLen };
}

// ── Fill regions for each shape type ──

function getShapeFill(type, cx, cy, r) {
  switch (type) {
    case "scatter": return [
      { cx: cx + 0.4*r, cy: cy - 0.35*r, r: r*0.2, test: inCircle },
      { cx: cx - 0.45*r, cy: cy + 0.3*r, r: r*0.26, test: inCircle },
    ];
    case "triangle": return [{ cx, cy, r, test: inTriangle }];
    case "pentagon": return [{ cx, cy, r: r*0.65, test: inPentagon }];
    case "venn": return [{ cx: cx - r*0.3, cy, r: r*0.45, test: inCircle }];
    case "mixed": return [
      { cx: cx - r*0.55 + r*0.225, cy: cy - r*0.1 + r*0.225, r: r*0.18, test: null },
      { cx: cx + r*0.25, cy: cy + r*0.4, r: r*0.22, test: inCircle },
    ];
    case "hub": return [{ cx, cy, r: r*0.18, test: inCircle }];
    case "starburst": return [{ cx, cy, r: r*0.18, test: inCircle }];
    default: return [];
  }
}

// ── Main draw function ──

const bOpts = { density: 3, spread: 0.8, minAlpha: 0.15, maxAlpha: 0.6, minSize: 0.4, maxSize: 1.2 };
const fOpts = { density: 0.35, minAlpha: 0.12, maxAlpha: 0.45, minSize: 0.5, maxSize: 1.8 };

/**
 * @param {number} progress - 0..1, controls stroke-dashoffset-like animation
 */
export function drawShape(ctx, type, cx, cy, size, color, opts = {}) {
  const { filled = false, opacity = 1, rotation = 0, progress = 1 } = opts;
  if (progress <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (rotation) {
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);
  }

  const r = size / 2;
  const { segs, segLens, totalLen } = getShapePath(type, cx, cy, r);
  const drawLen = totalLen * progress;

  // Draw outline progressively
  let accumulated = 0;
  for (let i = 0; i < segs.length; i++) {
    if (accumulated >= drawLen) break;

    const seg = segs[i];
    const segLen = segLens[i];
    const remaining = drawLen - accumulated;

    if (remaining >= segLen) {
      // Draw full segment
      brushLine(ctx, seg.x1, seg.y1, seg.x2, seg.y2, color, bOpts);
    } else {
      // Draw partial segment
      const t = remaining / segLen;
      const mx = seg.x1 + (seg.x2 - seg.x1) * t;
      const my = seg.y1 + (seg.y2 - seg.y1) * t;
      brushLine(ctx, seg.x1, seg.y1, mx, my, color, bOpts);
    }
    accumulated += segLen;
  }

  // Fill after outline is mostly complete
  if (filled && progress > 0.6) {
    const fillProgress = (progress - 0.6) / 0.4; // 0..1 over last 40%
    const fills = getShapeFill(type, cx, cy, r);
    for (const f of fills) {
      const adjOpts = { ...fOpts, minAlpha: fOpts.minAlpha * fillProgress, maxAlpha: fOpts.maxAlpha * fillProgress };
      brushFill(ctx, f.cx, f.cy, f.r, color, f.test, adjOpts);
    }
  }

  ctx.restore();
}
