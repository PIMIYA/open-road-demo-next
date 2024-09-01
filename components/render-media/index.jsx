import Image from "next/image";
import { Box } from "@mui/material";
import { useEffect } from "react";

import { getAkaswapAssetUrl } from "@/lib/stringUtils";

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
    case "image/png":
    case "image/webp":
      return (
        <Box {...boxProps}>
          <Image {...imageProps} />
        </Box>
      );
    /* VECTOR */
    // case "image/svg+xml":
    //     return <Box {...boxProps}>VECTOR</Box>;
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
    // case "video/mp4":
    // case "video/ogg":
    // case "video/quicktime":
    // case "video/webm":
    //   return <Box {...boxProps}>VIDEO</Box>;
    /* AUDIO */
    // case "audio/mpeg":
    // case "audio/ogg":
    //   return <Box {...boxProps}>AUDIO</Box>;
    /* HTML ZIP */
    // case "application/x-directory":
    // case "application/zip":
    // case "application/x-zip-compressed":
    // case "application/multipart/x-zip":
    //   return <Box {...boxProps}>HTML ZIP</Box>;
    /* PDF */
    // case "application/pdf":
    //   return <Box {...boxProps}>PDF</Box>;
    default:
      return (
        <Box {...boxProps}>
          <Image {...imageProps} />
        </Box>
      );
  }
}
