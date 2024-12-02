
export const categories = [
    { label: "展覽" },
    { label: "表演" },
    { label: "課程" },
    { label: "導覽" },
    { label: "工作坊" },
    { label: "黑客松" },
    { label: "座談" },
    { label: "親子" },
    { label: "節祭／展會／市集" },
    { label: "分享會／同好會／見面會" },
];

export const tags = [
    { main: "視覺", sub: "繪畫" },
    { main: "視覺", sub: "裝置" },
    { main: "視覺", sub: "工藝" },
    { main: "視覺", sub: "雕塑" },
    { main: "視覺", sub: "攝影" },
    { main: "視覺", sub: "影像" },
    { main: "表演", sub: "馬戲" },
    { main: "表演", sub: "音樂劇（親子、百老匯）" },
    { main: "表演", sub: "戲曲（歌仔戲、南管、京劇）" },
    { main: "表演", sub: "現代戲劇" },
    { main: "表演", sub: "讀劇" },
    { main: "表演", sub: "音樂（搖滾、古典、電子、音像）" },
    { main: "表演", sub: "說唱（漫才、相聲、站立喜劇）" },
    { main: "表演", sub: "舞蹈（現代舞、舞踏、民俗）" },
    { main: "設計", sub: "平面" },
    { main: "設計", sub: "互動 ／媒體" },
    { main: "設計", sub: "時尚" },
    { main: "設計", sub: "建築" },
    { main: "設計", sub: "工業／商品" },
    { main: "電影", sub: "紀錄片" },
    { main: "電影", sub: "劇情片" },
    { main: "科技", sub: "區塊鏈" },
    { main: "科技", sub: "AI" },
    { main: "科技", sub: "VR／AR／MR" },
    { main: "書籍", sub: "小說" },
    { main: "書籍", sub: "詩歌" },
    { main: "書籍", sub: "散文" },
    { main: "書籍", sub: "漫畫" },
    { main: "文化", sub: "公益（社會運動、地方創生、慈善捐贈）" },
    { main: "文化", sub: "性別" },
    { main: "文化", sub: "語言" },
    { main: "文化", sub: "歷史" },
    { main: "文化", sub: "環境" },
    { main: "文化", sub: "動物" },
    { main: "科學", sub: "社會科學（經濟、政治、國際關係）" },
    { main: "科學", sub: "自然科學（天文、地理）" },
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