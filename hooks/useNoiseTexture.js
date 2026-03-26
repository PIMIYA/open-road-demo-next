import { useEffect, useRef } from "react";

const TILE_SIZE = 128;

/**
 * Generate a 128×128 grayscale noise tile once, return its data URL.
 * The result is cached across all component instances via module-level variable.
 */
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
    data[i + 3] = 12;  // A — 50% lighter
  }

  ctx.putImageData(imageData, 0, 0);
  cachedDataUrl = canvas.toDataURL("image/png");
  return cachedDataUrl;
}

/**
 * Hook that returns a stable noise texture data URL.
 * Generated once on first mount, cached permanently.
 */
export function useNoiseTexture() {
  const urlRef = useRef(cachedDataUrl);

  useEffect(() => {
    if (!urlRef.current) {
      urlRef.current = generateNoiseTile();
    }
  }, []);

  // On server, return null; on client, return cached or freshly generated
  if (typeof window === "undefined") return null;
  if (!urlRef.current) urlRef.current = generateNoiseTile();
  return urlRef.current;
}
