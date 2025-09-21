import React, { useState, useEffect, useRef } from 'react'
import { Box } from "@mui/material";
import { prepareFilesFromZIP, validateFiles } from './html/utils/html';
import { HTMLComponent2 } from './html/HTMLComponent2';

export const ZipHandler = ({ src, displayUri, mimeType }) => {
    const [unpackedFiles, setUnpackedFiles] = useState(null);
    const [contentType, setContentType] = useState(null); // 'html' or '3d'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const unpacking = useRef(false);

    const boxProps = {
        sx: {
            width: { xs: "100%", md: "100%" },
            height: { xs: "100vw", md: "70vh" },
            position: "sticky",
        },
    };

    useEffect(() => {
        if (!src || unpacking.current) return;
        
        const processZip = async () => {
            unpacking.current = true;
            setLoading(true);
            setError(null);

            try {
                console.log("Processing ZIP file:", src);
                
                // 將 dataURI 轉換為 buffer
                const buffer = dataURIToBuffer(src);
                
                // 解壓 ZIP 檔案
                const filesArr = await prepareFilesFromZIP(buffer);
                const files = {};
                filesArr.forEach((f) => {
                    files[f.path] = f.blob;
                });

                // 根據 MIME 類型決定內容類型
                let detectedType;
                if (mimeType === 'application/x-directory') {
                    // x-directory 一定是網站
                    detectedType = 'html';
                } else {
                    // 其他 ZIP 格式需要檢測
                    detectedType = detectContentType(files);
                }
                
                console.log("Detected content type:", detectedType);

                if (detectedType === 'html') {
                    // 驗證 HTML 檔案
                    const result = await validateFiles(files);
                    if (result.error) {
                        console.error(result.error);
                        setError(result.error);
                    } else {
                        setUnpackedFiles(files);
                        setContentType('html');
                    }
                } else if (detectedType === '3d') {
                    setUnpackedFiles(files);
                    setContentType('3d');
                } else {
                    setError('Unknown content type in ZIP file');
                }

            } catch (err) {
                console.error('Error processing ZIP:', err);
                setError(err.message || 'Failed to process ZIP file');
            } finally {
                setLoading(false);
                unpacking.current = false;
            }
        };

        processZip();
    }, [src, mimeType]);

    // 檢測 ZIP 內容類型
    const detectContentType = (files) => {
        const filePaths = Object.keys(files);
        
        // 檢查是否有 index.html
        if (filePaths.includes('index.html')) {
            return 'html';
        }
        
        // 檢查是否有 3D 模型檔案
        const has3DFiles = filePaths.some(path => 
            path.toLowerCase().endsWith('.gltf') || 
            path.toLowerCase().endsWith('.glb') ||
            path.toLowerCase().endsWith('.obj') ||
            path.toLowerCase().endsWith('.fbx')
        );
        
        if (has3DFiles) {
            return '3d';
        }
        
        return 'unknown';
    };

    // 將 dataURI 轉換為 buffer
    const dataURIToBuffer = (dataURI) => {
        const parts = dataURI.split(',');
        const base64 = parts[1] || parts[0]; // 處理有無前綴的情況
        const binaryStr = atob(base64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes;
    };

    // 渲染 3D 內容
    const render3DContent = () => {
        if (!unpackedFiles) return null;

        // 尋找主要的 3D 檔案
        const filePaths = Object.keys(unpackedFiles);
        const main3DFile = filePaths.find(path => 
            path.toLowerCase().endsWith('.gltf') || 
            path.toLowerCase().endsWith('.glb')
        );

        if (!main3DFile) {
            return (
                <Box {...boxProps}>
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <h3>3D Model Not Found</h3>
                        <p>No valid 3D model file found in ZIP</p>
                    </div>
                </Box>
            );
        }

        // 創建 3D 檔案的 URL
        const fileBlob = unpackedFiles[main3DFile];
        const fileUrl = URL.createObjectURL(fileBlob);

        const modelProps = {
            "camera-controls": true,
            autoplay: true,
            "auto-rotate": true,
            poster: displayUri,
            src: fileUrl,
            alt: "3d model",
            style: {
                width: "100%",
                height: "100%",
            },
        };

        return (
            <Box {...boxProps}>
                <model-viewer {...modelProps}></model-viewer>
            </Box>
        );
    };

    if (loading) {
        return (
            <Box {...boxProps}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Processing ZIP File...</h3>
                    <p>Please wait while we extract and analyze the content.</p>
                </div>
            </Box>
        );
    }

    if (error) {
        return (
            <Box {...boxProps}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3>Error Processing ZIP</h3>
                    <p>{error}</p>
                </div>
            </Box>
        );
    }

    if (contentType === 'html') {
        return (
            <Box {...boxProps}>
                <HTMLComponent2 unpackedFiles={unpackedFiles} displayUri={displayUri} />
            </Box>
        );
    }

    if (contentType === '3d') {
        return render3DContent();
    }

    return (
        <Box {...boxProps}>
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3>Unknown Content Type</h3>
                <p>Unable to determine content type in ZIP file</p>
            </div>
        </Box>
    );
};
