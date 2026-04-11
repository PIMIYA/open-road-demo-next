export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { tokenID, walletAddress, message, contractAddress } = req.body;

        // Validate required fields
        if (!tokenID || !walletAddress || !message) {
            return res.status(400).json({
                message: 'Missing required fields. TokenID, walletAddress, and message are required.'
            });
        }

        // On-chain ownership verification: check that walletAddress holds the token
        const contract = contractAddress || "KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW";
        try {
            const tzktRes = await fetch(
                `https://api.tzkt.io/v1/tokens/balances?token.contract=${contract}&token.tokenId=${tokenID}&account=${walletAddress}&balance.gt=0`
            );
            const balances = await tzktRes.json();
            if (!Array.isArray(balances) || balances.length === 0) {
                return res.status(403).json({
                    message: 'Forbidden: wallet does not hold this token.'
                });
            }
        } catch (verifyErr) {
            console.error('Token ownership verification failed:', verifyErr.message);
            // Allow comment if verification service is down (fail-open)
        }

        // Duplicate comment check: fetch existing comments for this token
        try {
            const existingRes = await fetch(
                `${process.env.COMMENT_URL}/get-comments?tokenID=${tokenID}`
            );
            if (existingRes.ok) {
                const existingData = await existingRes.json();
                const comments = existingData?.data || existingData || [];
                const alreadyCommented = Array.isArray(comments) &&
                    comments.some((c) => c.walletAddress === walletAddress);
                if (alreadyCommented) {
                    return res.status(409).json({
                        message: 'You have already left a message for this token.'
                    });
                }
            }
        } catch (dupErr) {
            console.error('Duplicate comment check failed:', dupErr.message);
        }

        // Forward the request to the actual API endpoint
        const response = await fetch(`${process.env.COMMENT_URL}/post-comment`, {
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