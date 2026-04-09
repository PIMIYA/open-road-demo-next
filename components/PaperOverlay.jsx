import { useNoiseTexture } from "@/hooks/useNoiseTexture";

/**
 * Full-screen paper texture overlay: tiled noise grain + edge bloom.
 * Renders as fixed layers covering the entire viewport.
 * All GPU-composited — zero per-frame JS cost.
 */
export default function PaperOverlay() {
  const noiseUrl = useNoiseTexture();

  if (!noiseUrl) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: -1,
        backgroundImage: `url(${noiseUrl})`,
        backgroundRepeat: "repeat",
        mixBlendMode: "multiply",
      }}
    />
  );
}
