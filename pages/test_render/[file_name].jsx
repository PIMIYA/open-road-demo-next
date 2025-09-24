// pages/[file_name].jsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Box, Container, Typography, Button, Alert } from '@mui/material';
import dynamic from 'next/dynamic';

// 動態載入，避免 SSR 時觸發瀏覽器 API
const TestRenderMedia = dynamic(() => import('@/components/render-media/TestRenderMedia'), {
  ssr: false,
});

// 檔案類型對應的 MIME 類型
const getMimeType = (fileName) => {
  const ext = (fileName || '').toLowerCase().split('.').pop();
  const mimeTypes = {
    // 圖片
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    // 影片
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    ogv: 'video/ogg',
    // 音訊
    mp3: 'audio/mpeg',
    oga: 'audio/ogg',
    // 3D
    gltf: 'model/gltf+json',
    glb: 'model/gltf-binary',
    // 文件
    pdf: 'application/pdf',
    // ZIP
    zip: 'application/zip',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

export default function TestRender() {
  const router = useRouter();
  const { file_name } = router.query;

  const [fileData, setFileData] = useState(null); // {name, blob, url, mimeType}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const urlRef = useRef(null); // 保存 blob: URL 以便卸載時 revoke

  useEffect(() => {
    if (!file_name) return;

    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);

        const name = Array.isArray(file_name) ? file_name[0] : file_name;
        const mimeType = getMimeType(name);

        const res = await fetch(`/api/test/${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error(`File not found: ${name}`);

        const blob = await res.blob();
        // 強制 MIME（有些靜態伺服器可能回傳空 type）
        const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
        const url = URL.createObjectURL(typedBlob);
        

        // 清理舊 URL
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;

        setFileData({
          name,
          blob: typedBlob,
          url,
          formats: [{ mimeType }],
        });
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    loadFile();

    // 離開頁面時釋放 URL
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file_name]);

  const handleBack = () => router.push('/test_render');

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>Loading Test File...</Typography>
        <Typography>Loading: {String(file_name)}</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>
        <Button variant="contained" onClick={handleBack}>Back to Test List</Button>
      </Container>
    );
  }

  if (!fileData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>No File Data</Typography>
        <Button variant="contained" onClick={handleBack}>Back to Test List</Button>
      </Container>
    );
  }

  const mimeType = fileData.formats[0]?.mimeType ?? 'application/octet-stream';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Test Render: {fileData.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          MIME Type: {mimeType}
        </Typography>
        <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
          Back to Test List
        </Button>
      </Box>

      <Box
        sx={{
          border: "2px dashed #ccc",
          borderRadius: 2,
          p: 2,
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 直接把 blob 與 url 傳給子元件 */}
        <TestRenderMedia
          mimeType={mimeType}
          src={{ url: fileData.url, blob: fileData.blob, name: fileData.name }}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Debug Info:
        </Typography>
        <Box
          component="pre"
          sx={{ p: 2, borderRadius: 1, overflow: "auto", fontSize: "0.875rem" }}
        >
          {JSON.stringify(
            {
              fileName: fileData.name,
              mimeType,
              size: fileData.blob.size,
              type: fileData.blob.type,
              isBlobUrl: String(fileData.url).startsWith("blob:"),
            },
            null,
            2
          )}
        </Box>
      </Box>
    </Container>
  );
}
