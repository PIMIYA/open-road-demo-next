
export const categories = [
    { label: "展覽" },
    { label: "表演" },
    { label: "課程" },
    { label: "導覽" },
    { label: "工作坊" },
    { label: "黑客松" },
    { label: "研討會／論壇／座談" },
    { label: "節祭／展會／市集" },
    { label: "分享會／同好會／見面會" },
];

export const tags = [
    { label: "視覺藝術" },
    { label: "新媒體" },
    { label: "說唱" },
    { label: "戲劇 " },
    { label: "舞蹈" },
    { label: "音樂" },
    { label: "設計" },
    { label: "建築" },
    { label: "元宇宙" },
    { label: "出版" },
    { label: "電影" },
    { label: "人文" },
    { label: "科學" },
];

export const licenses = [
    { label: "All rights reserved" },
    { label: "CC0 public (Public Domain)" },
    { label: "CC BY (Attribution)" },
    { label: "CC BY-SA (Attribution-ShareAlike)" },
];

// Custom styles for the file upload button and hide the input
import { createTheme, styled } from "@mui/material/styles";
export const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
});

export const theme = createTheme({
    palette: {
        primary: {
            main: "rgba(0,0,0,0.87)",
        },
    },
});

export const MIMETYPE = {
    BMP: 'image/bmp',
    GIF: 'image/gif',
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    SVG: 'image/svg+xml',
    // TIFF: 'image/tiff',
    WEBP: 'image/webp',
    MP4: 'video/mp4',
    OGV: 'video/ogg',
    QUICKTIME: 'video/quicktime',
    WEBM: 'video/webm',
    GLB: 'model/gltf-binary',
    GLTF: 'model/gltf+json',
    MP3: 'audio/mpeg',
    OGA: 'audio/ogg',
    PDF: 'application/pdf',
    ZIP: 'application/zip',
    ZIP1: 'application/x-zip-compressed',
    ZIP2: 'multipart/x-zip',
}

export const IPFS_DIRECTORY_MIMETYPE = 'application/x-directory'