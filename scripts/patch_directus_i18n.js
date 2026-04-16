#!/usr/bin/env node
/**
 * patch_directus_i18n.js
 *
 * Writes the current i18n const translations into Directus name_en fields.
 *
 * Collections updated:
 *   - events:       name_en  (from eventMap)
 *   - artists:      name_en  (from artistMap, matched by artist.name)
 *   - organizers:   name_en  (from organizerMap, matched by organizer.name)
 *
 * Usage:
 *   DIRECTUS=https://data.kairos-mint.art/items \
 *   NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL=... \
 *   NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD=... \
 *   node scripts/patch_directus_i18n.js
 */

const DIRECTUS_BASE = (process.env.DIRECTUS || "").replace("/items", "");
const EMAIL = process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL;
const PASSWORD = process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD;

// ── i18n const maps ──────────────────────────────────────────────────────────

const eventMap = {
  "街角的利息": "The Interest from the Street Corner",
  "北美館開放網絡計畫 － 共域計畫之二： GM，開路：藝文生態系的在場證明":
    "TFAM Open Network – GM, KAIROS: Proof of Attendance in Art Ecosystem",
  "失聲祭": "Lacking Sound Festival",
};

const artistMap = {
  "林晏竹": "Lin Yen-Chu",
  "莊哲瑋 INFRAPUNK": "INFRAPUNK",
  "煮雪的人 Zhuxue Deren": "Zhuxue Deren",
  "沐子 Graphyni": "Graphyni",
  "張明曜 Chang Ming-Yao": "Chang Ming-Yao",
  "hemilylan": "hemilylan",
  "呂蔚": "Lu Wei",
  "失聲祭": "Lacking Sound Fest.",
  "開路": "KAIROS",
};

const organizerMap = {
  "開路 KAIROS": "KAIROS",
  "台北當代藝術館": "MoCA Taipei",
  "北美館開放網絡計畫共域之二": "TFAM Open Network Project",
  "失聲祭Lacking Sound Fest.": "Lacking Sound Festival",
};

// ── Directus helpers ─────────────────────────────────────────────────────────

async function getToken() {
  const res = await fetch(`${DIRECTUS_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  return data.data.access_token;
}

async function fetchAll(token, collection) {
  const res = await fetch(`${DIRECTUS_BASE}/items/${collection}?limit=-1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Fetch ${collection} failed: ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

async function patch(token, collection, id, body) {
  const res = await fetch(`${DIRECTUS_BASE}/items/${collection}/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PATCH ${collection}/${id} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  if (!DIRECTUS_BASE || !EMAIL || !PASSWORD) {
    console.error("Missing env vars: DIRECTUS, NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL, NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD");
    process.exit(1);
  }

  console.log(`Connecting to ${DIRECTUS_BASE} ...`);
  const token = await getToken();
  console.log("✅ Authenticated\n");

  // ── Events ──
  console.log("── Patching events ──");
  const events = await fetchAll(token, "events");
  let evPatched = 0;
  for (const ev of events) {
    const nameEn = eventMap[ev.name];
    if (nameEn && !ev.name_en) {
      await patch(token, "events", ev.id, { name_en: nameEn });
      console.log(`  ✓ events/${ev.id}  ${ev.name} → ${nameEn}`);
      evPatched++;
    } else if (ev.name_en) {
      console.log(`  – events/${ev.id}  already has name_en: ${ev.name_en}`);
    }
  }
  console.log(`  Patched ${evPatched} / ${events.length} events\n`);

  // ── Artists ──
  console.log("── Patching artists ──");
  const artists = await fetchAll(token, "artists");
  let artPatched = 0;
  for (const a of artists) {
    const nameEn = artistMap[a.name];
    if (nameEn && !a.name_en) {
      await patch(token, "artists", a.id, { name_en: nameEn });
      console.log(`  ✓ artists/${a.id}  ${a.name} → ${nameEn}`);
      artPatched++;
    } else if (a.name_en) {
      console.log(`  – artists/${a.id}  already has name_en: ${a.name_en}`);
    }
  }
  console.log(`  Patched ${artPatched} / ${artists.length} artists\n`);

  // ── Organizers ──
  console.log("── Patching organizers ──");
  const organizers = await fetchAll(token, "organizers");
  let orgPatched = 0;
  for (const o of organizers) {
    const nameEn = organizerMap[o.name];
    if (nameEn && !o.name_en) {
      await patch(token, "organizers", o.id, { name_en: nameEn });
      console.log(`  ✓ organizers/${o.id}  ${o.name} → ${nameEn}`);
      orgPatched++;
    } else if (o.name_en) {
      console.log(`  – organizers/${o.id}  already has name_en: ${o.name_en}`);
    }
  }
  console.log(`  Patched ${orgPatched} / ${organizers.length} organizers\n`);

  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
