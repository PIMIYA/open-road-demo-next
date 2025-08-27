const axios = require('axios');

const directusBaseUrl = "https://data.kairos-mint.art";
async function getDirectusToken(email, password) {
    // const directusBaseUrl = process.env.DIRECTUS || 'http://localhost:8055';
    const url = `${directusBaseUrl}/auth/login`;
    const body = {
        email: email,
        password: password
    };

    try {
        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const { access_token } = response.data.data;
        console.log('Directus token obtained successfully');
        return access_token;
    } catch (error) {
        console.error('Error requesting Directus token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function getDirectusFile(directusToken, fileId) {
    // const directusBaseUrl = process.env.DIRECTUS || 'http://localhost:8055';
    const url = `${directusBaseUrl}/files/${fileId}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            }
        });

        return response.data.data;
    } catch (error) {
        console.error('Error getting Directus file:', error.response ? error.response.data : error.message);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fileId } = req.query;

    if (!fileId) {
        return res.status(200).json({success: true, data: null });
    }

    try {
        // 檢查環境變量
        if (!process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL || !process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD) {
            return res.status(500).json({ 
                error: 'Directus credentials not configured',
                details: 'Please check NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL and NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD environment variables'
            });
        }

        if (!directusBaseUrl) {
            return res.status(500).json({ 
                error: 'Directus URL not configured',
                details: 'Please check DIRECTUS environment variable'
            });
        }

        // console.log('Directus URL:', directusBaseUrl);
        // console.log('Admin email:', process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL);

        // 獲取Directus admin token
        const directusToken = await getDirectusToken(
            process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL, 
            process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD
        );

        // 獲取文件信息
        const fileData = await getDirectusFile(directusToken, fileId);
        // 構建圖片的完整URL
        // const directusBaseUrl = process.env.DIRECTUS || 'http://localhost:8055';
        const imageUrl = `${directusBaseUrl}/assets/${fileId}`;

        // 返回圖片信息
        res.status(200).json({
            success: true,
            data: {
                id: fileData.id,
                filename_download: fileData.filename_download,
                title: fileData.title,
                description: fileData.description,
                type: fileData.type,
                filesize: fileData.filesize,
                width: fileData.width,
                height: fileData.height,
                url: imageUrl,
                // 如果需要帶token的URL（用於私有文件）
                authenticatedUrl: `${directusBaseUrl}/assets/${fileId}?access_token=${directusToken}`
            }
        });

    } catch (error) {
        console.error('Error in getDirectusImage:', error);
        res.status(500).json({ 
            error: 'Failed to get image from Directus',
            details: error.message 
        });
    }
}
