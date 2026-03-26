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

export default function Wallet({
  role,
  pools,
  claims,
  addressFromURL,
  events,
  organizers,
  artists,
  walletInfo,
}) {
  const router = useRouter();
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
          // if data's category is "座談", change it to "座談會"
          data.forEach((item) => {
            if (item.metadata.category === "座談") {
              item.metadata.category = "研討會 / 論壇 / 座談";
            }
          });
          // if data's tags, each include "視覺", then combine and change it to one "視覺藝術"
          data.forEach((item) => {
            if (item.metadata.tags.some((tag) => tag.includes("視覺"))) {
              item.metadata.tags = ["視覺藝術"];
            } else if (item.metadata.tags.some((tag) => tag.includes("舞蹈"))) {
              item.metadata.tags = ["舞蹈"];
            } else if (item.metadata.tags.some((tag) => tag.includes("音樂"))) {
              item.metadata.tags = ["音樂"];
            } else if (item.metadata.tags.some((tag) => tag.includes("設計"))) {
              item.metadata.tags = ["設計"];
            } else if (item.metadata.tags.some((tag) => tag.includes("科技"))) {
              item.metadata.tags = ["元宇宙"];
            } else if (item.metadata.tags.some((tag) => tag.includes("書籍"))) {
              item.metadata.tags = ["出版"];
            } else if (item.metadata.tags.some((tag) => tag.includes("科學"))) {
              item.metadata.tags = ["科學"];
            }
          });
          // add projectName to data"
          if (data && events) {
            data.forEach((item) => {
              const matchingProject = events.data.find(
                (project) =>
                  project.status === "published" &&
                  project.location === item.metadata.event_location &&
                  project.start_time &&
                  new Date(
                    new Date(project.start_time).getTime() - 8 * 60 * 60 * 1000
                  ).toUTCString() === item.metadata.start_time
              );
              if (matchingProject) {
                item.metadata.projectName = matchingProject.name;
                item.metadata.projectId = matchingProject.id;
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
          // if data's category is "座談", change it to "座談會"
          data.forEach((item) => {
            if (item.metadata.category === "座談") {
              item.metadata.category = "研討會 / 論壇 / 座談";
            }
          });
          // if data's tags, each include "視覺", then combine and change it to one "視覺藝術"
          data.forEach((item) => {
            if (item.metadata.tags.some((tag) => tag.includes("視覺"))) {
              item.metadata.tags = ["視覺藝術"];
            } else if (item.metadata.tags.some((tag) => tag.includes("舞蹈"))) {
              item.metadata.tags = ["舞蹈"];
            } else if (item.metadata.tags.some((tag) => tag.includes("音樂"))) {
              item.metadata.tags = ["音樂"];
            } else if (item.metadata.tags.some((tag) => tag.includes("設計"))) {
              item.metadata.tags = ["設計"];
            } else if (item.metadata.tags.some((tag) => tag.includes("科技"))) {
              item.metadata.tags = ["元宇宙"];
            } else if (item.metadata.tags.some((tag) => tag.includes("書籍"))) {
              item.metadata.tags = ["出版"];
            } else if (item.metadata.tags.some((tag) => tag.includes("科學"))) {
              item.metadata.tags = ["科學"];
            }
          });
          // add projectName to data
          if (data && events) {
            data.forEach((item) => {
              const matchingProject = events.data.find(
                (project) =>
                  project.status === "published" &&
                  project.location === item.metadata.event_location &&
                  project.start_time &&
                  new Date(
                    new Date(project.start_time).getTime() - 8 * 60 * 60 * 1000
                  ).toUTCString() === item.metadata.start_time
              );
              if (matchingProject) {
                item.metadata.projectName = matchingProject.name;
                item.metadata.projectId = matchingProject.id;
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

  /* Locations : get all locations from data */
  const locations = useMemo(() => {
    const data = value === 0 ? claimData : createdData;
    // if data && createdData is not null
    if (data) {
      const locations = [];
      data.forEach((c) => {
        if (!locations.includes(c.metadata.event_location)) {
          locations.push(c.metadata.event_location);
        }
      });
      return locations;
    }
  }, [value, claimData, createdData]);
  // console.log("locations", locations);

  /* Categories : get all categories from data */
  const categories = useMemo(() => {
    const data = value === 0 ? claimData : createdData;
    if (data) {
      const categories = [
        ...new Set(data.map((item) => item.metadata.category)),
      ];
      return categories;
    }
  }, [value, claimData, createdData]);
  // console.log("categories", categories);

  /* Selection Filter */
  const [catValue, setCatValue] = useState("");
  const [locValue, setLocValue] = useState("");

  // Auto-filter when any filter value changes
  useEffect(() => {
    const dataToFilter = value === 0 ? claimData : createdData;
    if (!dataToFilter) return;
    const filtered = dataToFilter.filter((c) => {
      const eventLocation = c.metadata.event_location || "";
      return (
        (!locValue || eventLocation.includes(locValue)) &&
        (!catValue || c.metadata.category.includes(catValue))
      );
    });
    setFilteredData(filtered);
  }, [catValue, locValue, value, claimData, createdData]);

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
    return <div>Loading...</div>;
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
            label="Claimed"
            disabled={claimData === null || claimData.length === 0}
          />
          <Tab
            label="Created"
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
            <option value="">Location</option>
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
            <option value="">Category</option>
            {categories && categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
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
          No Token
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
    },
    revalidate: 10,
  };
}
