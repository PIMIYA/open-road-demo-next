/*** Listing tokens in user's wallet, including claimed and created ***/
/*** Redirect from akadrop claim page ***/

/* React */
import { useEffect, useMemo, useState } from "react";
/* Providers */
import { useConnection } from "@/packages/providers";
/* MUI */
import {
  Box,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
/* Fetch data */
import { WalletRoleAPI, AkaDropAPI, FetchDirectusData } from "@/lib/api";
import { fetchCities, fetchVenues } from "@/lib/map-api";
/* Sub Components */
import TwoColumnLayout, {
  Side,
  Main,
} from "@/components/layouts/TwoColumnLayout";
import {
  getContractFromUid,
  getIdFromUid,
  getUrlFromUid,
} from "@/lib/stringUtils";
import WalletProfile from "@/components/wallet/WalletProfile";
import WalletTimeline from "@/components/wallet/WalletTimeline";
import WalletCanvas from "@/components/wallet/WalletCanvas";
import CustomSelect from "@/components/CustomSelect";

import { useRouter } from "next/router";
import { useT } from "@/lib/i18n/useT";

// Normalize English tags/categories back to canonical Chinese keys
// so all data uses a single key regardless of mint-time language
const TAG_NORMALIZE = {
  "Visual Arts": "視覺藝術", "visual arts": "視覺藝術",
  "New Media": "新媒體", "new media": "新媒體",
  "Rap": "說唱", "rap": "說唱",
  "Theater": "戲劇", "theater": "戲劇", "Theatre": "戲劇",
  "Dance": "舞蹈", "dance": "舞蹈",
  "Music": "音樂", "music": "音樂",
  "Design": "設計", "design": "設計",
  "Architecture": "建築", "architecture": "建築",
  "Metaverse": "元宇宙", "metaverse": "元宇宙",
  "Publishing": "出版", "publishing": "出版",
  "Film": "電影", "film": "電影",
  "Humanities": "人文", "humanities": "人文",
  "Science": "科學", "science": "科學",
};
const CAT_NORMALIZE = {
  "Exhibition": "展覽", "exhibition": "展覽",
  "Performance": "表演", "performance": "表演",
  "Course": "課程", "course": "課程",
  "Guided Tour": "導覽", "guided tour": "導覽",
  "Workshop": "工作坊", "workshop": "工作坊",
  "Hackathon": "黑客松", "hackathon": "黑客松",
  "Seminar / Forum / Talk": "研討會 / 論壇 / 座談",
  "Festival / Fair / Market": "節祭／展會／市集",
  "Meetup / Fan Meeting": "分享會／同好會／見面會",
  "座談": "研討會 / 論壇 / 座談",
};

function normalizeTag(tag) {
  if (!tag) return tag;
  // English → Chinese canonical
  if (TAG_NORMALIZE[tag]) return TAG_NORMALIZE[tag];
  // Legacy Chinese compound tags
  if (tag.includes("視覺")) return "視覺藝術";
  if (tag.includes("舞蹈")) return "舞蹈";
  if (tag.includes("音樂")) return "音樂";
  if (tag.includes("設計")) return "設計";
  if (tag.includes("科技")) return "元宇宙";
  if (tag.includes("書籍")) return "出版";
  if (tag.includes("科學")) return "科學";
  return tag;
}

function normalizeCategory(cat) {
  if (!cat) return cat;
  return CAT_NORMALIZE[cat] || cat;
}

/** Normalize tags and category on NFT metadata in-place */
function normalizeNftData(data) {
  if (!data) return data;
  data.forEach((item) => {
    if (item.metadata.category) {
      item.metadata.category = normalizeCategory(item.metadata.category);
    }
    if (Array.isArray(item.metadata.tags)) {
      item.metadata.tags = [...new Set(item.metadata.tags.map(normalizeTag).filter(Boolean))];
    }
  });
  return data;
}

export default function Wallet({
  role,
  pools,
  claims,
  addressFromURL,
  events,
  organizers,
  artists,
  walletInfo,
  venueNameMap = {},
}) {
  const router = useRouter();
  const t = useT();
  /* Connected wallet */
  const { address, connect, disconnect } = useConnection();

  /* Client fetch claimed tokens' data */
  const [claimData, setClaimData] = useState(null);
  /* Client fetch created tokens' poolURL */
  const [createdPoolURL, setCreatedPoolURL] = useState(null);
  /* Client fetch created tokens' data */
  const [createdData, setCreatedData] = useState(null);
  /* Filter tokens' data */
  const [filteredData, setFilteredData] = useState(null);
  /* Client fetch comments */
  const [comments, setComments] = useState(null);

  const myclaims = claims.claims.map((claim) => {
    let result = {
      poolUid: claim.poolUid,
      poolid: getIdFromUid(claim.poolUid),
      contact: getContractFromUid(claim.poolUid),
      poolURL: getUrlFromUid(claim.poolUid),
      tokenURL: getUrlFromUid(claim.tokenUid),
    };
    return result;
  });

  const mypools = pools.pools.map((pool) => {
    let result = {
      poolUid: pool.poolUid,
      poolid: getIdFromUid(pool.poolUid),
      contact: getContractFromUid(pool.poolUid),
      poolURL: getUrlFromUid(pool.poolUid),
    };
    return result;
  });

  /* Array tokenURL to do API route */
  const claimTokenURLs = useMemo(
    () => myclaims.map((c) => c.tokenURL),
    [claims]
  );

  const poolTokenURLs = useMemo(() => mypools.map((m) => m.poolURL), [pools]);

  /* API route: Client fetch CLAIMED TOKENS by using tokenId at TZKT API */
  useEffect(() => {
    fetch("/api/walletRecords", {
      method: "POST",
      body: [claimTokenURLs, `.${addressFromURL}`],
    })
      .then((res) => res.json())
      .then((res) => {
        let data = res.data;
        // console.log("claim's tokens", data);
        if (data) {
          data = data.map((d) => {
            d.cliamDate = new Date(d.metadata.date).toLocaleDateString();
            d.claimTime = new Date(d.metadata.date).toLocaleTimeString();
            return d;
          });
          // sort cartData by timestamp
          data.sort((a, b) => {
            return new Date(b.metadata.date) - new Date(a.metadata.date);
          });
          normalizeNftData(data);
          // add projectName to data
          if (data && events) {
            data.forEach((item) => {
              const meta = item.metadata;
              const matchingProject = events.data.find(
                (project) =>
                  project.status === "published" && (
                    // Match by event_id first (new NFTs)
                    (meta.event_id && project.id === meta.event_id) ||
                    // Legacy fallback: match by location + start_time
                    (project.location === meta.event_location &&
                      project.start_time &&
                      new Date(
                        new Date(project.start_time).getTime() - 8 * 60 * 60 * 1000
                      ).toUTCString() === meta.start_time)
                  )
              );
              if (matchingProject) {
                meta.projectName = matchingProject.name;
                meta.projectId = matchingProject.id;
              }
            });
          }
        }
        setClaimData(data);
      });
  }, [claimTokenURLs]);
  // console.log("claimData", claimData);

  /* API route: Client fetch CREATED TOKENS by using metadata at TZKT API */
  useEffect(() => {
    fetch("/api/walletRecordsCreations", {
      method: "POST",
      body: addressFromURL,
    })
      .then((res) => res.json())
      .then((res) => {
        let data = res.data;
        // console.log("claim's tokens", data);
        if (data) {
          data = data.map((d) => {
            d.cliamDate = new Date(d.metadata.date).toLocaleDateString();
            d.claimTime = new Date(d.metadata.date).toLocaleTimeString();
            return d;
          });
          // sort cartData by timestamp
          data.sort((a, b) => {
            return new Date(b.metadata.date) - new Date(a.metadata.date);
          });
          normalizeNftData(data);
          // add projectName to data
          if (data && events) {
            data.forEach((item) => {
              const meta = item.metadata;
              const matchingProject = events.data.find(
                (project) =>
                  project.status === "published" && (
                    // Match by event_id first (new NFTs)
                    (meta.event_id && project.id === meta.event_id) ||
                    // Legacy fallback: match by location + start_time
                    (project.location === meta.event_location &&
                      project.start_time &&
                      new Date(
                        new Date(project.start_time).getTime() - 8 * 60 * 60 * 1000
                      ).toUTCString() === meta.start_time)
                  )
              );
              if (matchingProject) {
                meta.projectName = matchingProject.name;
                meta.projectId = matchingProject.id;
              }
            });
          }
        }
        setCreatedData(data);
      });
  }, [createdPoolURL]);
  // console.log("createdData", createdData);

  /* Tab: Claimed and Created */
  const [value, setValue] = useState(0);
  const [tabInitialized, setTabInitialized] = useState(false);

  const handleClaimed = () => {
    setValue(0);
    setFilteredData(claimData);
  };
  const handleCreated = () => {
    setValue(1);
    setFilteredData(createdData);
  };

  // Auto-select the initial tab only once when data first arrives
  useEffect(() => {
    if (tabInitialized) return;
    // Wait until at least one dataset has loaded (non-null)
    if (claimData === null && createdData === null) return;

    if (claimData && claimData.length > 0) {
      setValue(0);
      setTabInitialized(true);
    } else if (createdData && createdData.length > 0) {
      setValue(1);
      setTabInitialized(true);
    }
  }, [claimData, createdData, tabInitialized]);

  // console.log("filteredData", filteredData);

  // Build event lookup map from Directus events
  const eventById = useMemo(() => {
    const map = {};
    (events?.data || []).forEach((ev) => {
      if (ev.id) map[ev.id] = ev;
    });
    return map;
  }, [events]);

  // Resolve a card's location to venue name:
  // New NFTs: event_id → event.venue_id → venueNameMap
  // Or: metadata.venue_id → venueNameMap
  // Legacy NFTs: event_location (raw string)
  const resolveLocation = (card) => {
    const meta = card.metadata;

    // Try venue_id directly from NFT metadata
    if (meta.venue_id && venueNameMap[meta.venue_id]) {
      return venueNameMap[meta.venue_id];
    }

    // Try event_id → event.venue_id → venue name
    if (meta.event_id && eventById[meta.event_id]) {
      const ev = eventById[meta.event_id];
      if (ev.venue_id && venueNameMap[ev.venue_id]) {
        return venueNameMap[ev.venue_id];
      }
    }

    // Legacy fallback: event_location string
    return meta.event_location || "";
  };

  /* Locations : merge event_location (legacy) and event_id (new) */
  const locations = useMemo(() => {
    const data = value === 0 ? claimData : createdData;
    if (!data) return [];
    const locs = new Set();
    data.forEach((c) => {
      const loc = resolveLocation(c);
      if (loc) locs.add(loc);
    });
    return [...locs].sort();
  }, [value, claimData, createdData, eventById, venueNameMap]);
  // console.log("locations", locations);

  /* Categories : get all categories from data (filter out empty values) */
  const categories = useMemo(() => {
    const data = value === 0 ? claimData : createdData;
    if (!data) return [];
    return [...new Set(data.map((item) => item.metadata.category).filter(Boolean))];
  }, [value, claimData, createdData]);

  /* Events : unique event names from data */
  const eventOptions = useMemo(() => {
    const data = value === 0 ? claimData : createdData;
    if (!data) return [];
    return [...new Set(data.map((item) => item.metadata.projectName).filter(Boolean))].sort();
  }, [value, claimData, createdData]);

  /* Creators : unique creator names from data, resolved via artists */
  const artistNameMap = useMemo(() => {
    const map = new Map();
    for (const a of (artists?.data || [])) {
      if (a.address && a.name) map.set(a.address, a.name);
    }
    return map;
  }, [artists]);

  const creatorOptions = useMemo(() => {
    const data = value === 0 ? claimData : createdData;
    if (!data) return [];
    const names = new Set();
    data.forEach((item) => {
      for (const addr of (item.metadata.creators || [])) {
        const name = artistNameMap.get(addr) || addr;
        names.add(name);
      }
    });
    return [...names].sort();
  }, [value, claimData, createdData, artistNameMap]);

  /* Selection Filter */
  const [catValue, setCatValue] = useState("");
  const [locValue, setLocValue] = useState("");
  const [eventValue, setEventValue] = useState("");
  const [creatorValue, setCreatorValue] = useState("");

  // Auto-filter when any filter value changes
  useEffect(() => {
    const dataToFilter = value === 0 ? claimData : createdData;
    if (!dataToFilter) return;
    const filtered = dataToFilter.filter((c) => {
      const loc = resolveLocation(c);
      if (locValue && !loc.includes(locValue)) return false;
      if (catValue && !(c.metadata.category || "").includes(catValue)) return false;
      if (eventValue && (c.metadata.projectName || "") !== eventValue) return false;
      if (creatorValue) {
        const creatorNames = (c.metadata.creators || []).map((addr) => artistNameMap.get(addr) || addr);
        if (!creatorNames.includes(creatorValue)) return false;
      }
      return true;
    });
    setFilteredData(filtered);
  }, [catValue, locValue, eventValue, creatorValue, value, claimData, createdData, eventById, venueNameMap, artistNameMap]);

  /* API route: Client fetch Comments by WALLET ADDRESS at KairosDrop NFT Comments API */
  useEffect(() => {
    fetch("/api/get-comments", {
      method: "POST",
      body: addressFromURL,
    })
      .then((res) => res.json())
      .then((res) => {
        let data = res.data;
        setComments(data);
      });
  }, [addressFromURL]);
  // console.log("comments", comments);

  /* console log filtered data */
  // console.log("filteredData", filteredData);
  if (router.isFallback) {
    return <div>{t.common.loading}</div>;
  }

  return (
    <Box sx={{ padding: "2rem 1.5rem" }}>
      {/* Top Section: WalletProfile */}
      <Box sx={{ mb: 4}}>
        {addressFromURL && (
          <WalletProfile address={addressFromURL} walletInfo={walletInfo} />
        )}
      </Box>

      {/* Middle Section: Tabs + Filter Controls */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={value}
          onChange={(_, newValue) => {
            if (newValue === 0) handleClaimed();
            else handleCreated();
          }}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 400,
              fontSize: '0.875rem',
              minWidth: 'auto',
              px: 2,
            },
            '& .Mui-selected': {
              fontWeight: 500,
            },
          }}
        >
          <Tab
            label={t.wallet.claimed}
            disabled={claimData === null || claimData.length === 0}
          />
          <Tab
            label={t.wallet.created}
            disabled={createdData === null || createdData.length === 0}
          />
        </Tabs>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>
          <CustomSelect
            style={{
              background: 'transparent',
              padding: '4px',
              fontSize: 14,
              color: 'var(--brand-primary)',
              width: '100%',
            }}
            value={locValue}
            onChange={(e) => setLocValue(e.target.value)}
          >
            <option value="">{t.wallet.location}</option>
            {locations && locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </CustomSelect>

          <CustomSelect
            style={{
              background: 'transparent',
              padding: '4px',
              fontSize: 14,
              color: 'var(--brand-primary)',
              width: '100%',
            }}
            value={catValue}
            onChange={(e) => setCatValue(e.target.value)}
          >
            <option value="">{t.wallet.category}</option>
            {categories && categories.map((cat) => (
              <option key={cat} value={cat}>{t.categoryMap?.[cat] || cat}</option>
            ))}
          </CustomSelect>

          <CustomSelect
            style={{
              background: 'transparent',
              padding: '4px',
              fontSize: 14,
              color: 'var(--brand-primary)',
              width: '100%',
            }}
            value={eventValue}
            onChange={(e) => setEventValue(e.target.value)}
          >
            <option value="">{t.wallet.event}</option>
            {eventOptions.map((ev) => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </CustomSelect>

          <CustomSelect
            style={{
              background: 'transparent',
              padding: '4px',
              fontSize: 14,
              color: 'var(--brand-primary)',
              width: '100%',
            }}
            value={creatorValue}
            onChange={(e) => setCreatorValue(e.target.value)}
          >
            <option value="">{t.wallet.creator}</option>
            {creatorOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </CustomSelect>
        </Box>
      </Box>

      {/* Bottom Section: Main Content */}
      <Box>
        <Box
          sx={{
            display: filteredData && filteredData.length > 0 ? "none" : "block",
          }}
        >
          {t.wallet.noToken}
        </Box>
        <Box
          sx={{
            display: filteredData && filteredData.length > 0 ? "block" : "none",
          }}
        >
          {filteredData && filteredData.length > 0 && (
            <WalletCanvas canvasData={filteredData} address={addressFromURL} />
          )}
        </Box>

        <Stack direction="row">
          <Box width={"100%"}>
            <WalletTimeline
              cardData={filteredData}
              comments={comments}
              addressFromURL={addressFromURL}
              myWalletAddress={address}
              organizers={organizers}
              artists={artists}
              commentTokenId={router.query.comment || ""}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export async function getStaticPaths() {
  return {
    paths: [
      {
        params: {
          address: "tz28X7QEXciMxDA1QF8jLp21FuqpqiHrRVZq",
        },
      },
    ],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const addressFromURL = await params.address;

  /* Check if the address is valid */
  try {
    const res = await fetch(
      `https://api.tzkt.io/v1/accounts?address=${addressFromURL}`
    );
    const address_checker = await res.json();
    if (address_checker.code == 400) {
      return {
        notFound: true,
      };
    }
  } catch (error) {
    console.error("Address validation failed:", error.message);
    return { notFound: true };
  }

  /* Fetch data */
  const [
    role,
    pools,
    claims,
    events,
    organizers,
    artists,
    walletData,
    userWalletsData,
  ] = await Promise.all([
    WalletRoleAPI(`/${addressFromURL}`),
    AkaDropAPI(`/${addressFromURL}/pools?offset=0&limit=0`),
    AkaDropAPI(`/${addressFromURL}/claims?offset=0&limit=0`),
    FetchDirectusData(`/events`),
    FetchDirectusData(`/organizers`),
    FetchDirectusData(`/artists`),
    FetchDirectusData(`/Wallet?filter[address][_eq]=${addressFromURL}`),
    FetchDirectusData(
      `/userWallets?filter[address][_eq]=${addressFromURL}`
    ),
  ]);

  // 合併兩個 collections 的資料
  let walletInfo = null;

  // 檢查 wallet collection 是否有資料
  if (walletData?.data?.length > 0) walletInfo = walletData.data[0];
  // 如果 wallet 沒有資料，檢查 userWallets collection
  else if (userWalletsData?.data?.length > 0)
    walletInfo = userWalletsData.data[0];

  // Build venue name map (venue_id → venue name) from PostGIS server
  let venueNameMap = {};
  try {
    const cities = await fetchCities();
    const allVenues = (await Promise.all(cities.map((c) => fetchVenues(c.slug)))).flat();
    for (const v of allVenues) {
      venueNameMap[v.id] = v.name;
    }
  } catch (err) {
    console.error("Failed to fetch venues for wallet page:", err);
  }

  return {
    props: {
      role,
      pools,
      claims,
      addressFromURL,
      events,
      organizers,
      artists,
      walletInfo,
      venueNameMap,
    },
    revalidate: 10,
  };
}
