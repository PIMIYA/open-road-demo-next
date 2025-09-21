import React, { useRef, useEffect, useMemo } from 'react';

export const HTMLComponent2 = ({ unpackedFiles }) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // 穩定的 uid（避免每次 render 變動）
  const uid = useMemo(
    () => (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)),
    []
  );

  // 只處理 postMessage，不在 resize 時動 React state
  useEffect(() => {
    const onMessage = (event) => {
      // 建議檢查來源，至少要比對 data
      if (event.data !== uid) return;

      if (iframeRef.current?.contentWindow && unpackedFiles) {
        iframeRef.current.contentWindow.postMessage(
          { target: 'akaswap-html-preview', data: unpackedFiles },
          '*'
        );
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [uid, unpackedFiles]);

  // 以 ResizeObserver 監聽容器尺寸改變（效能較佳）
  useEffect(() => {
    if (!containerRef.current) return;

    const ro = new ResizeObserver(() => {
      // 如果需要在尺寸變更時通知 iframe，就在這裡做
      if (iframeRef.current?.contentWindow && unpackedFiles) {
        iframeRef.current.contentWindow.postMessage(
          { target: 'akaswap-html-preview-resize', uid },
          '*'
        );
      }
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [uid, unpackedFiles]);

  if (!unpackedFiles) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h3>HTML Content Loading...</h3>
        <p>Preparing HTML files...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <iframe
        ref={iframeRef}
        title="html-zip-embed"
        src={`https://assets.akaswap.com/ipfs/?uid=${uid}`}
        sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
        style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
      />
    </div>
  );
};
