import { useState, useEffect } from 'react';
import { CardMedia } from '@mui/material';

export default function DirectusImage({ fileId, alt = "Directus image", ...props }) {
    const [imageData, setImageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchImage = async () => {
            // 如果沒有 fileId，直接返回，不設置 loading
            if (!fileId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`/api/getDirectusImage?fileId=${fileId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch image');
                }

                const result = await response.json();
                
                if (result.success) {
                    setImageData(result.data);
                } else {
                    throw new Error(result.error || 'Failed to get image data');
                }
            } catch (err) {
                setError(err.message);
                console.error('Error fetching Directus image:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchImage();
    }, [fileId]);

    // 如果沒有 fileId，直接顯示 dummy image
    if (!fileId) {
        return (
            <CardMedia
                component="img"
                alt={alt}
                sx={{
                    objectFit: "contain",
                    height: "100%",
                    width: "100%",
                    margin: "auto",
                }}
                image="https://dummyimage.com/400x200/cccccc/666666?text=Cover"
                width={400}
                height={200}
                {...props}
            />
        );
    }

    if (loading) {
        return <div>Loading image...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!imageData) {
        return <div>No image data available</div>;
    }

    return (
        <CardMedia
            component="img"
            alt={alt}
            sx={{
                objectFit: "contain",
                height: "100%",
                width: "100%",
                margin: "auto",
            }}
            image={
                imageData?.authenticatedUrl ||
                "https://dummyimage.com/400x200/cccccc/666666?text=Cover"
            }
            width={imageData?.width || 400}
            height={imageData?.height || 300}
            {...props}
        /> 
    );
}
