export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { tokenID, walletAddress, message } = req.body;

        // Validate required fields
        if (!tokenID || !walletAddress || !message) {
            return res.status(400).json({
                message: 'Missing required fields. TokenID, walletAddress, and message are required.'
            });
        }

        // Forward the request to the actual API endpoint
        const response = await fetch("http://localhost:3040/post-comment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tokenID, walletAddress, message }),
        });

        // Get the response data
        const data = await response.json();

        // Return the same status code and data
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Error posting comment:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}