const DIRECTUS_URL = (process.env.DIRECTUS?.replace("/items", "") || "https://data.kairos-mint.art");
const DIRECTUS_EMAIL = process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL;
const DIRECTUS_PASSWORD = process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD;

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Directus auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.data.access_token;
  tokenExpiry = Date.now() + (data.data.expires - 60000);
  return cachedToken;
}

async function directusFetch(path, opts = {}) {
  const token = await getToken();
  const headers = { ...opts.headers, Authorization: `Bearer ${token}` };
  const res = await fetch(`${DIRECTUS_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Directus ${res.status}: ${text}`);
  }
  return res.json();
}

// Wallet (artists) editable fields
const WALLET_FIELDS = ["name", "introduction", "instagram", "x", "twitter", "discord", "website"];
// userWallets (general users) editable fields
const USER_WALLET_FIELDS = ["name"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { address, avatarBase64, avatarMime, ...fields } = req.body;

    if (!address) {
      return res.status(400).json({ error: "address is required" });
    }

    // Try Wallet table first (artists), then userWallets (general users)
    let table = null;
    let record = null;
    let allowedFields = [];

    const walletRes = await directusFetch(
      `/items/Wallet?filter[address][_eq]=${encodeURIComponent(address)}&limit=1`
    );
    if (walletRes.data?.length > 0) {
      table = "Wallet";
      record = walletRes.data[0];
      allowedFields = WALLET_FIELDS;
    } else {
      const userRes = await directusFetch(
        `/items/userWallets?filter[address][_eq]=${encodeURIComponent(address)}&limit=1`
      );
      if (userRes.data?.length > 0) {
        table = "userWallets";
        record = userRes.data[0];
        allowedFields = USER_WALLET_FIELDS;
      }
    }

    if (!record) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    // Build update body from allowed fields only
    const updateBody = {};
    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        updateBody[key] = fields[key] === "" ? null : fields[key];
      }
    }

    // Handle avatar upload (both tables support avatar)
    if (avatarBase64 && avatarMime) {
      const buffer = Buffer.from(avatarBase64, "base64");
      const blob = new Blob([buffer], { type: avatarMime });
      const formData = new FormData();
      formData.append("file", blob, `avatar-${address.slice(0, 8)}.${avatarMime.split("/")[1] || "png"}`);

      const token = await getToken();
      const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error(`File upload failed: ${uploadRes.status}`);
      const uploadData = await uploadRes.json();
      updateBody.avatar = uploadData.data.id;

      if (record.avatar) {
        try { await directusFetch(`/files/${record.avatar}`, { method: "DELETE" }); } catch {}
      }
    }

    if (Object.keys(updateBody).length === 0) {
      return res.status(200).json({ ok: true, message: "Nothing to update" });
    }

    const updated = await directusFetch(`/items/${table}/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateBody),
    });

    const avatarUrl = updated.data?.avatar
      ? `${DIRECTUS_URL}/assets/${updated.data.avatar}`
      : null;

    return res.status(200).json({ ok: true, table, data: { ...updated.data, avatarUrl } });
  } catch (err) {
    console.error("updateWalletProfile error:", err);
    return res.status(500).json({ error: err.message });
  }
}
