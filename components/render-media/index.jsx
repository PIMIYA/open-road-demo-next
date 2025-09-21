import Image from "next/image";
import { Box } from "@mui/material";
import { useEffect } from "react";

import { getAkaswapAssetUrl } from "@/lib/stringUtils";
import { HTMLComponent } from "./html/index";
import { ZipHandler } from "./ZipHandler";

export default function RenderMedia({ mimeType, src }) {
  const tokenImageUrl = getAkaswapAssetUrl(src.displayUri);
  const gltfUrl = getAkaswapAssetUrl(src.artifactUri);

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
    alt: "display image",
    sizes: "(max-width: 600px) 100vw, 600px",
  };

  const modelProps = {
    "camera-controls": true,
    autoplay: true,
    "auto-rotate": true,
    poster: tokenImageUrl,
    src: gltfUrl,
    alt: "3d model",
    style: {
      width: "100%",
      height: "100%",
      //   backgroundColor: "transparent",
    },
  };

  useEffect(() => {
    import("@google/model-viewer").catch(console.error);
  }, []);

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
        <>
          <Box
            sx={{
              width: { xs: "100%", md: "100%" },
              height: { xs: "100vw", md: "70vh" },
              position: "sticky",
            }}
          >
            <model-viewer {...modelProps}></model-viewer>
          </Box>
        </>
      );

    /* VIDEO */
    case "video/mp4":
    case "video/ogg":
    case "video/ogv":
    case "video/quicktime":
    case "video/mov":
    case "video/webm":
      return (
        <Box {...boxProps}>
          <video
            controls
            autoPlay
            loop
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          >
            <source src={tokenImageUrl} type={mimeType} />
            Your browser does not support the video tag.
          </video>
        </Box>
      );

    /* AUDIO */
    case "audio/mpeg":
    case "audio/mp3":
    case "audio/ogg":
    case "audio/oga":
      return (
        <Box {...boxProps}>
          <audio
            controls
            autoPlay
            loop
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <source src={tokenImageUrl} type={mimeType} />
            Your browser does not support the audio tag.
          </audio>
        </Box>
      );

    /* HTML ZIP - 使用新的 ZipHandler 來分流 3D 和 HTML */
    case "application/x-directory":
    case "application/zip":
    case "application/x-zip-compressed":
    case "application/multipart/x-zip":
      return (
        <ZipHandler
          src={src.artifactUri}
          displayUri={src.displayUri}
          mimeType={mimeType}
        />
      );

    /* PDF */
    case "application/pdf":
      return (
        <Box {...boxProps}>
          <iframe
            src={tokenImageUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title="PDF Preview"
          />
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
