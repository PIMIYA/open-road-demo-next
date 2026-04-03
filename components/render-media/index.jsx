import Image from "next/image";
import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { getAkaswapAssetUrl } from "@/lib/stringUtils";
import dynamic from "next/dynamic";
import VideoViewer from "./VideoViewer";
import AudioViewer from "./AudioViewer";
import { useT } from "@/lib/i18n/useT";

const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });

/**
 * ModelViewer wrapper: mounts the <model-viewer> element once via ref
 * so React re-renders don't destroy and recreate the web component.
 */
function ModelViewer({ src, poster, alt }) {
  const containerRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return; // only mount once
    mountedRef.current = true;

    import("@google/model-viewer").then(() => {
      if (!containerRef.current) return;
      const el = document.createElement("model-viewer");
      el.setAttribute("src", src);
      if (poster) el.setAttribute("poster", poster);
      if (alt) el.setAttribute("alt", alt);
      el.setAttribute("camera-controls", "");
      el.setAttribute("autoplay", "");
      el.setAttribute("auto-rotate", "");
      el.style.width = "100%";
      el.style.height = "100%";
      containerRef.current.appendChild(el);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — src/poster/alt are stable from SSR props

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

/**
 * For x-directory IPFS content, the gateway may show a directory listing
 * instead of index.html if index.html is nested in a subdirectory.
 * This hook resolves the actual URL by checking if we need to append
 * the subdirectory path.
 */
function useResolvedXdirUrl(baseUrl, mimeType) {
  const [resolved, setResolved] = useState(null);
  useEffect(() => {
    if (mimeType !== "application/x-directory") {
      setResolved(baseUrl);
      return;
    }
    const url = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    // Fetch the root and check if it's a directory listing or actual HTML
    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        // IPFS directory listings have this specific title pattern
        if (html.includes('<meta name="description" content="A directory of content-addressed files hosted on IPFS.">')) {
          // Extract the single subdirectory link
          const match = html.match(/href="[^"]*\/([^/"]+)"/g);
          const dirLinks = (match || [])
            .map((m) => m.match(/href="[^"]*\/([^/"]+)"/)?.[1])
            .filter((name) => name && !name.includes(".") && !name.startsWith("Qm"));
          if (dirLinks.length === 1) {
            setResolved(`${url}${dirLinks[0]}/`);
            return;
          }
        }
        setResolved(url);
      })
      .catch(() => setResolved(url));
  }, [baseUrl, mimeType]);
  return resolved;
}

export default function RenderMedia({ mimeType, src }) {
  const t = useT();
  const tokenImageUrl = getAkaswapAssetUrl(src.displayUri);
  const artifactUrl = getAkaswapAssetUrl(src.artifactUri);
  const gltfUrl = artifactUrl;
  const resolvedXdirUrl = useResolvedXdirUrl(artifactUrl, mimeType);

  const boxProps = {
    sx: {
      width: { xs: "100%", md: "100%" },
      height: { xs: "100vw", md: "70vh" },
      position: "sticky",
    },
  };

  const imageProps = {
    priority: true,
    src: tokenImageUrl,
    fill: true,
    style: {
      objectFit: "contain",
      objectPosition: "top",
    },
    alt: t.nft.displayImage,
    sizes: "(max-width: 600px) 100vw, 600px",
  };


  switch (mimeType) {
    /* IMAGES */
    case "image/bmp":
    case "image/gif":
    case "image/jpeg":
    case "image/jpg":
    case "image/png":
    case "image/svg+xml":
    case "image/webp":
      return (
        <Box {...boxProps}>
          <Image {...imageProps} alt="NFT image" />
        </Box>
      );

    /* 3D */
    case "model/gltf+json":
    case "model/gltf-binary":
      return (
        <Box
          sx={{
            width: { xs: "100%", md: "100%" },
            height: { xs: "100vw", md: "70vh" },
            position: "sticky",
          }}
        >
          <ModelViewer src={gltfUrl} poster={tokenImageUrl} alt={t.nft.model3d} />
        </Box>
      );

    /* VIDEO */
    case "video/mp4":
    case "video/ogg":
    case "video/ogv":
    case "video/quicktime":
    case "video/mov":
    case "video/webm":
      return (
        <Box sx={{ width: "100%" }}>
          <VideoViewer src={artifactUrl} mimeType={mimeType} poster={tokenImageUrl} />
        </Box>
      );

    /* AUDIO */
    case "audio/mpeg":
    case "audio/mp3":
    case "audio/ogg":
    case "audio/oga":
      return (
        <Box sx={{ width: "100%" }}>
          <AudioViewer src={artifactUrl} title={src.name || t.nft.untitled} />
        </Box>
      );

    /* HTML x-directory (IPFS can serve index.html or directory listing) */
    case "application/x-directory":
      if (!resolvedXdirUrl) {
        return (
          <Box {...boxProps}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              {t.common.loading}
            </div>
          </Box>
        );
      }
      return (
        <Box {...boxProps}>
          <iframe
            src={resolvedXdirUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            sandbox="allow-scripts allow-same-origin"
            title={t.nft.htmlPreview}
          />
        </Box>
      );

    /* ZIP archives — IPFS gateway can't extract these, show thumbnail */
    case "application/zip":
    case "application/x-zip-compressed":
    case "application/multipart/x-zip":
      return (
        <Box {...boxProps}>
          <Image {...imageProps} alt="NFT image" />
        </Box>
      );

    /* PDF */
    case "application/pdf":
      return (
        <Box sx={{ width: "100%", minHeight: { xs: "100vw", md: "70vh" } }}>
          <PDFViewer src={artifactUrl} />
        </Box>
      );

    /* OCTET STREAM */
    case "application/octet-stream":
      return (
        <Box {...boxProps}>
          <Image {...imageProps} alt="NFT image" />
        </Box>
      );

    default:
      return (
        <Box {...boxProps}>
          <Image {...imageProps} alt="NFT image" />
        </Box>
      );
  }
}
