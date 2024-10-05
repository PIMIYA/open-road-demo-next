export default async function handler(req, res) {
    console.log("Received request body:", req.body);

    const { contract, poolId, email, address } = req.body;

    if (!contract || !poolId || !email || !address) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (!process.env.NEXT_PUBLIC_PARTNER_ID || !process.env.NEXT_PUBLIC_BAUTH_USERNAME || !process.env.NEXT_PUBLIC_BAUTH_PASSWORD) {
        return res.status(500).json({ error: "Missing Basic Auth credentials" });
    }

    console.log(`partnerId: ${process.env.NEXT_PUBLIC_PARTNER_ID}`);
    console.log(`bauth username: ${process.env.NEXT_PUBLIC_BAUTH_USERNAME}`);
    console.log(`bauth password: ${process.env.NEXT_PUBLIC_BAUTH_PASSWORD}`);

    const auth = Buffer.from(
        `${process.env.NEXT_PUBLIC_BAUTH_USERNAME}:${process.env.NEXT_PUBLIC_BAUTH_PASSWORD}`
    ).toString('base64');

    console.log(`basic auth: ${auth}`);
    console.log(`body: ${JSON.stringify({ contract, poolId, email, address })}`);

    try {
        const response = await fetch(`https://mars.akaswap.com/drop/api/partners/${process.env.NEXT_PUBLIC_PARTNER_ID}/claims`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${auth}`,
            },
            body: JSON.stringify({ contract, poolId, email, address }),
        });

        console.log("AkaSwap response status:", response.status);
        console.log("AkaSwap response headers:", JSON.stringify([...response.headers]));

        const responseText = await response.text();
        console.log("AkaSwap response text:", responseText);

        if (!response.ok) {
            console.log("AkaSwap response not ok");
            return res.status(response.status).json({ error: `HTTP error! status: ${response.status}`, details: responseText });
        }

        const data = JSON.parse(responseText);
        console.log("AkaSwap response data:", data);
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error during claim:", error);
        return res.status(500).json({ error: error.message });
    }
}