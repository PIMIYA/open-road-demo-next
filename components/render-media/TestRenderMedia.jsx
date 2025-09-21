// components/render-media/TestRenderMedia.jsx
import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

// 讓高度一致的容器樣式
const boxProps = {
  sx: {
    width: { xs: '100%', md: '100%' },
    height: { xs: '100vw', md: '70vh' },
    position: 'relative',
    overflow: 'hidden',
  },
};

export default function TestRenderMedia({ mimeType, src }) {
  const { url, blob, name } = src || {};
  const [htmlPreviewUrl, setHtmlPreviewUrl] = useState(null); // ZIP->HTML 轉換後的 blob: URL
  const [modelUrl, setModelUrl] = useState(null); // ZIP->3D 轉換後的主模型 URL
  const [posterUrl, setPosterUrl] = useState(null); // ZIP->3D 封面（可選）
  const htmlUrlRef = useRef(null);
  const modelUrlRef = useRef(null);
  const posterUrlRef = useRef(null);

  // 掛載 3D viewer（只在 client）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@google/model-viewer').catch(() => {});
    }
  }, []);

  // 清理臨時 URL
  useEffect(() => {
    return () => {
      if (htmlUrlRef.current) URL.revokeObjectURL(htmlUrlRef.current);
      if (modelUrlRef.current) URL.revokeObjectURL(modelUrlRef.current);
      if (posterUrlRef.current) URL.revokeObjectURL(posterUrlRef.current);
    };
  }, []);

  // ZIP：解壓 -> 判斷是 HTML or 3D -> 建立對應的 blob URL
  useEffect(() => {
    let cancelled = false;

    const handleZip = async () => {
      if (!blob || !/zip|x-zip|x-zip-compressed|x-directory/i.test(mimeType)) return;

      const { unzip } = await import('unzipit');
      const { entries } = await unzip(blob);

      // 原始 key 清單（保留大小寫與資料夾前綴）
      const entryKeys = Object.keys(entries);

      // 工具：以「大小寫不敏感」尋找符合條件的原始 key
      const findEntryKey = (predicate /* (lowerKey: string) => boolean */) => {
        for (const k of entryKeys) {
          if (predicate(k.toLowerCase())) return k;
        }
        return null;
      };

      // ========= 1) HTML：找 index.html =========
      const indexHtmlOrigKey =
        findEntryKey((l) => l.endsWith('/index.html')) || findEntryKey((l) => l === 'index.html');

      if (indexHtmlOrigKey) {
        const htmlText = await entries[indexHtmlOrigKey].text();

        // 為所有「非 index.html」資源建立 blob URL
        const urlMap = new Map(); // key: 規範化的原始 entry 路徑, val: blobURL
        for (const origKey of entryKeys) {
          const lower = origKey.toLowerCase();
          if (lower === indexHtmlOrigKey.toLowerCase()) continue;
          const e = entries[origKey];
          const ab = await e.arrayBuffer();
          const resBlob = new Blob([ab], { type: guessMimeByName(origKey) });
          const resUrl = URL.createObjectURL(resBlob);
          urlMap.set(normalizePath(origKey), resUrl);
        }

        // 以 index.html 所在目錄為 base，重寫相對資源為 blob URL
        const rewritten = rewriteHtmlWithUrlMap(htmlText, urlMap, dirname(indexHtmlOrigKey));
        const htmlBlob = new Blob([rewritten], { type: 'text/html' });
        const htmlUrl = URL.createObjectURL(htmlBlob);

        if (!cancelled) {
          if (htmlUrlRef.current) URL.revokeObjectURL(htmlUrlRef.current);
          htmlUrlRef.current = htmlUrl;
          setHtmlPreviewUrl(htmlUrl);
        }
        return;
      }

      // ========= 2) 3D：先找 .glb（單檔最穩） =========
      const glbOrigKey = findEntryKey((l) => l.endsWith('.glb'));
      if (glbOrigKey) {
        const ab = await entries[glbOrigKey].arrayBuffer();
        const glbBlob = new Blob([ab], { type: 'model/gltf-binary' });
        const glbUrl = URL.createObjectURL(glbBlob);

        // 可選海報：找第一張圖片
        const posterOrigKey = findEntryKey((l) => /\.(png|jpe?g|webp|gif|bmp)$/.test(l));
        let posterUrlTmp = null;
        if (posterOrigKey) {
          const pab = await entries[posterOrigKey].arrayBuffer();
          posterUrlTmp = URL.createObjectURL(new Blob([pab], { type: guessMimeByName(posterOrigKey) }));
        }

        if (!cancelled) {
          if (modelUrlRef.current) URL.revokeObjectURL(modelUrlRef.current);
          modelUrlRef.current = glbUrl;
          setModelUrl(glbUrl);

          if (posterUrlRef.current) URL.revokeObjectURL(posterUrlRef.current);
          posterUrlRef.current = posterUrlTmp;
          setPosterUrl(posterUrlTmp);
        }
        return;
      }

      // ========= 3) 3D：.gltf（含外部 .bin / 貼圖）→ 改寫 uri =========
      const gltfOrigKey = findEntryKey((l) => l.endsWith('.gltf'));
      if (gltfOrigKey) {
        // （必要時可最佳化：先解析 gltf 再只為引用到的資源建 URL）
        const urlMap = new Map();
        for (const origKey of entryKeys) {
          const ab = await entries[origKey].arrayBuffer();
          const u = URL.createObjectURL(new Blob([ab], { type: guessMimeByName(origKey) }));
          urlMap.set(normalizePath(origKey), u);
        }

        const gltfText = await entries[gltfOrigKey].text();
        const gltfJson = JSON.parse(gltfText);
        const baseDir = dirname(gltfOrigKey);

        const resolveToUrl = (uri) => {
          if (!uri || /^(https?:|data:|blob:)/i.test(uri)) return uri;
          const abs = normalizePath(joinPath(baseDir, uri));
          return urlMap.get(abs) || uri;
        };

        if (Array.isArray(gltfJson.buffers)) {
          gltfJson.buffers.forEach((buf) => {
            if (buf.uri) buf.uri = resolveToUrl(buf.uri);
          });
        }
        if (Array.isArray(gltfJson.images)) {
          gltfJson.images.forEach((img) => {
            if (img.uri) img.uri = resolveToUrl(img.uri);
          });
        }

        const newGltfBlob = new Blob([JSON.stringify(gltfJson)], { type: 'model/gltf+json' });
        const newGltfUrl = URL.createObjectURL(newGltfBlob);

        // 海報（可選）
        const posterOrigKey = findEntryKey((l) => /\.(png|jpe?g|webp|gif|bmp)$/.test(l));
        const posterUrlTmp = posterOrigKey ? urlMap.get(normalizePath(posterOrigKey)) || null : null;

        if (!cancelled) {
          if (modelUrlRef.current) URL.revokeObjectURL(modelUrlRef.current);
          modelUrlRef.current = newGltfUrl;
          setModelUrl(newGltfUrl);

          if (posterUrlRef.current && posterUrlTmp && posterUrlTmp !== posterUrlRef.current) {
            URL.revokeObjectURL(posterUrlRef.current);
          }
          posterUrlRef.current = posterUrlTmp || null;
          setPosterUrl(posterUrlTmp || null);
        }
        return;
      }

      // 若都不是，當作一般壓縮包，不做預覽
      if (!cancelled) setHtmlPreviewUrl(null);
    };

    handleZip().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [blob, mimeType]);

  // —— 分流：原生類型 —— //
  switch (true) {
    /* IMAGES */
    case /^image\/(bmp|gif|jpeg|jpg|png|svg\+xml|webp)$/i.test(mimeType): {
      return (
        <Box {...boxProps}>
          <img
            src={url}
            alt={name || 'image'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'top' }}
          />
        </Box>
      );
    }

    /* VIDEO */
    case /^video\/(mp4|ogg|ogv|quicktime|mov|webm)$/i.test(mimeType): {
      return (
        <Box {...boxProps}>
          <video
            controls
            autoPlay
            loop
            muted
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            src={url}
          />
        </Box>
      );
    }

    /* AUDIO */
    case /^audio\/(mpeg|mp3|ogg|oga)$/i.test(mimeType): {
      return (
        <Box {...boxProps}>
          <audio controls autoPlay loop style={{ width: '100%', height: '100%' }} src={url} />
        </Box>
      );
    }

    /* PDF */
    case /^application\/pdf$/i.test(mimeType): {
      return (
        <Box {...boxProps}>
          <iframe title="PDF Preview" src={url} style={{ width: '100%', height: '100%', border: 'none' }} />
        </Box>
      );
    }

    /* 3D (直檔 glb/gltf) */
    case /^model\/(gltf\+json|gltf-binary)$/i.test(mimeType): {
      return (
        <Box {...boxProps}>
          <model-viewer
            src={url}
            alt={name || '3d model'}
            camera-controls
            autoplay
            auto-rotate
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      );
    }

    /* ZIP（需先解壓判定） */
    case /(application\/(zip|x-zip|x-zip-compressed)|application\/x-directory)/i.test(mimeType): {
      if (htmlPreviewUrl) {
        return (
          <Box {...boxProps}>
            <iframe title="HTML Preview" src={htmlPreviewUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
          </Box>
        );
      }
      if (modelUrl) {
        return (
          <Box {...boxProps}>
            <model-viewer
              src={modelUrl}
              alt={name || '3d model'}
              camera-controls
              autoplay
              auto-rotate
              poster={posterUrl || undefined}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        );
      }
      return (
        <Box {...boxProps}>
          <div style={{ textAlign: 'center' }}>
            <p>ZIP 已解壓，但未找到 index.html、.glb 或 .gltf。</p>
            <p style={{ opacity: 0.7, fontSize: 12 }}>（若是含外部資源的 HTML/GLTF，也許路徑或檔名需檢查）</p>
          </div>
        </Box>
      );
    }

    /* 其他（當圖試著顯示） */
    default: {
      return (
        <Box {...boxProps}>
          <img
            src={url}
            alt={name || 'asset'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'top' }}
          />
        </Box>
      );
    }
  }
}

/* ===== Helpers ===== */

function guessMimeByName(name = '') {
  const n = name.toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.svg')) return 'image/svg+xml';
  if (n.endsWith('.bmp')) return 'image/bmp';
  if (n.endsWith('.mp4')) return 'video/mp4';
  if (n.endsWith('.webm')) return 'video/webm';
  if (n.endsWith('.mov')) return 'video/quicktime';
  if (n.endsWith('.ogv') || n.endsWith('.ogg')) return 'video/ogg';
  if (n.endsWith('.mp3')) return 'audio/mpeg';
  if (n.endsWith('.oga')) return 'audio/ogg';
  if (n.endsWith('.gltf')) return 'model/gltf+json';
  if (n.endsWith('.glb')) return 'model/gltf-binary';
  if (n.endsWith('.bin')) return 'application/octet-stream';
  if (n.endsWith('.css')) return 'text/css';
  if (n.endsWith('.js')) return 'text/javascript';
  if (n.endsWith('.html') || n.endsWith('.htm')) return 'text/html';
  if (n.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

function normalizePath(p = '') {
  return p.replace(/\\/g, '/');
}
function dirname(p = '') {
  const np = normalizePath(p);
  const idx = np.lastIndexOf('/');
  return idx >= 0 ? np.slice(0, idx) : '';
}
function joinPath(a = '', b = '') {
  if (!a) return normalizePath(b);
  return normalizePath(`${a}/${b}`);
}

// 把 HTML 中的相對資源引用改為 blob URL（script/src, link/href, img/src, audio/video source, model-viewer src/poster, CSS url(...)）
function rewriteHtmlWithUrlMap(htmlText, urlMap, baseDir) {
  let out = htmlText;

  const replaceUrl = (origUrl) => {
    const clean = (origUrl || '').trim().replace(/^['"]|['"]$/g, '');
    if (!clean || /^https?:\/\//i.test(clean) || /^data:/i.test(clean) || /^blob:/i.test(clean)) return origUrl;
    const abs = normalizePath(joinPath(baseDir, clean));
    const mapped = urlMap.get(abs);
    return mapped || origUrl;
  };

  out = out.replace(/(<script[^>]*\bsrc=)(["'])([^"']+)\2/gi, (m, p1, q, u) => `${p1}${q}${replaceUrl(u)}${q}`);
  out = out.replace(/(<link[^>]*\bhref=)(["'])([^"']+)\2/gi, (m, p1, q, u) => `${p1}${q}${replaceUrl(u)}${q}`);
  out = out.replace(/(<img[^>]*\bsrc=)(["'])([^"']+)\2/gi, (m, p1, q, u) => `${p1}${q}${replaceUrl(u)}${q}`);
  out = out.replace(/(<source[^>]*\bsrc=)(["'])([^"']+)\2/gi, (m, p1, q, u) => `${p1}${q}${replaceUrl(u)}${q}`);
  out = out.replace(/(<model-viewer[^>]*\bsrc=)(["'])([^"']+)\2/gi, (m, p1, q, u) => `${p1}${q}${replaceUrl(u)}${q}`);
  out = out.replace(/(<model-viewer[^>]*\bposter=)(["'])([^"']+)\2/gi, (m, p1, q, u) => `${p1}${q}${replaceUrl(u)}${q}`);
  out = out.replace(/url\(([^)]+)\)/gi, (m, u) => `url(${replaceUrl(u)})`);

  return out;
}

// 將 gltf 內相對 uri 轉換為對應 blob URL
function resolveToUrl(uri, baseDir, urlMap) {
  if (!uri) return uri;
  if (/^(https?:|data:|blob:)/i.test(uri)) return uri;
  const abs = normalizePath(joinPath(baseDir, uri));
  return urlMap.get(abs) || uri;
}
