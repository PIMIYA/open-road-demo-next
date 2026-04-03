import { useEffect, useState } from "react";

const TILE_SIZE = 128;

let cachedDataUrl = null;

function generateNoiseTile() {
  if (cachedDataUrl) return cachedDataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(TILE_SIZE, TILE_SIZE);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;       // R
    data[i + 1] = v;   // G
    data[i + 2] = v;   // B
    data[i + 3] = 12;  // A — subtle grain
  }

  ctx.putImageData(imageData, 0, 0);
  cachedDataUrl = canvas.toDataURL("image/png");
  return cachedDataUrl;
}

/**
 * Returns a stable noise texture data URL.
 * Generated once on first client mount — returns null during SSR
 * and initial hydration to avoid mismatch.
 */
export function useNoiseTexture() {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    setUrl(generateNoiseTile());
  }, []);

  return url;
}
