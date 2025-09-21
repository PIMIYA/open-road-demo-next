// pages/api/test/[name].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

function getMimeType(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const map: Record<string, string> = {
    // images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    // video
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    ogv: 'video/ogg',
    // audio
    mp3: 'audio/mpeg',
    oga: 'audio/ogg',
    // 3d
    gltf: 'model/gltf+json',
    glb: 'model/gltf-binary',
    // docs
    pdf: 'application/pdf',
    // zip
    zip: 'application/zip',
  };
  return map[ext] || 'application/octet-stream';
}

// 防止路徑逃逸（..）
function sanitize(p: string) {
  return p.replace(/[/\\]+/g, '/').replace(/\.\.+/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name || '';
    const safe = sanitize(String(name));
    if (!safe) {
      res.status(400).json({ error: 'Missing file name' });
      return;
    }

    // 指向 public/test
    const filePath = path.join(process.cwd(), 'public', 'test', safe);

    // 確認檔案存在
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const stat = fs.statSync(filePath);
    const mime = getMimeType(safe);

    // 簡易 ETag
    const etag = `"${stat.size}-${stat.mtimeMs}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // If-None-Match
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    // Range（支援影片/音訊拖拉）
    const range = req.headers.range;
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match && match[1] ? parseInt(match[1], 10) : 0;
      const end = match && match[2] ? parseInt(match[2], 10) : stat.size - 1;

      // 邏輯保險
      const chunkStart = Math.max(0, start);
      const chunkEnd = Math.min(end, stat.size - 1);
      const chunkSize = chunkEnd - chunkStart + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${chunkStart}-${chunkEnd}/${stat.size}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', String(chunkSize));
      res.setHeader('Content-Type', mime);

      const stream = fs.createReadStream(filePath, { start: chunkStart, end: chunkEnd });
      stream.pipe(res);
      stream.on('error', () => res.status(500).end('Stream error'));
      return;
    }

    // 一般完整回應
    res.status(200);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', String(stat.size));
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => res.status(500).end('Stream error'));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
