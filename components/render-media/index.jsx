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
      objectFit: "contain", // cover, contain, none
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
    case "image/png":
      return (
        <Box {...boxProps}>
          <Image {...imageProps} />
        </Box>
      );
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
    default:
      return (
        <Box {...boxProps}>
          <Image {...imageProps} />
        </Box>
      );
  }
}
