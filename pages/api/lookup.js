export default async function handler(req, res) {
    const { email } = req.query;

    if (!process.env.NEXT_PUBLIC_BAUTH_USERNAME || !process.env.NEXT_PUBLIC_BAUTH_PASSWORD) {
        return res.status(500).json({ error: "Missing Basic Auth credentials" });
    }

    try {
        const response = await fetch(`https://mars.akaswap.com/drop/api/lookups/${email}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `HTTP error! status: ${response.status}` });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}