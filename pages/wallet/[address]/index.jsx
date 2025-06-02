// claim token lists by this wallet address.
// redirect from akadrop claim page.
import { useEffect, useMemo, useState } from "react";
/* Providers */
import { useConnection } from "@/packages/providers";
/* MUI */
import {
  Box,
  Stack,
  Autocomplete,
  TextField,
  Button,
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
import SidePaper from "@/components/SidePaper";
import Filter from "@/components/Filter";

import { useRouter } from "next/router";

export default function Wallet({
  role,
  pools,
  claims,
  addressFromURL,
  projects,
  organizers,
  artists,
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
          if (data && projects) {
            data.forEach((item) => {
              const matchingProject = projects.data.find(
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
          if (data && projects) {
            data.forEach((item) => {
              const matchingProject = projects.data.find(
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

  /* Tab: Claimed and Ctreated */
  const [value, setValue] = useState(0);
  // const handleChange = useMemo(
  //   () => (event, newValue) => {
  //     setValue(newValue);
  //     setFilteredData(newValue === 0 ? claimData : createdData);
  //   },
  //   [claimData, createdData]
  // );
  const handleClaimed = async () => {
    setValue(0);
    setFilteredData(await claimData);
  };
  const handleCreated = async () => {
    setValue(1);
    setFilteredData(await createdData);
  };

  useEffect(() => {
    setTimeout(() => {
      if (claimData === null) {
        handleCreated();
      } else {
        handleClaimed();
      }
    }, 3000); //miliseconds
  }, [createdData, claimData]);

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
  const handleFilter = (event) => {
    if (event === null) return;
    if (!event) {
      setFilteredData(value === 0 ? claimData : createdData);
      return;
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      const dataToFilter = value === 0 ? claimData : createdData;
      {
        /* 因為一開始metadata沒有event_location */
      }
      const filteredByCat = dataToFilter.filter((c) => {
        const eventLocation = c.metadata.event_location || "";
        return (
          eventLocation.includes(locValue) &&
          c.metadata.category.includes(catValue)
        );
      });
      setFilteredData(filteredByCat);
    }
  };

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
    <TwoColumnLayout>
      <Side sticky={true}>
        {
          <SidePaper>
            {addressFromURL && <WalletProfile address={addressFromURL} />}
          </SidePaper>
        }

        <>
          <SidePaper>
            <Box sx={{ textAlign: "center" }}>
              <Button
                variant={value === 0 ? "contained" : "outlined"}
                size="small"
                onClick={handleClaimed}
                disabled={claimData === null || claimData.length === 0}
                sx={{ mr: 1 }}
              >
                Claimed
              </Button>

              <Button
                variant={value === 1 ? "contained" : "outlined"}
                size="small"
                onClick={handleCreated}
                disabled={createdData === null || createdData.length === 0}
                sx={{ ml: 1 }}
              >
                Created
              </Button>
            </Box>
          </SidePaper>
          <SidePaper>
            <Box component="form">
              <Box>
                <Autocomplete
                  id="location"
                  options={locations}
                  getOptionLabel={(option) => option}
                  isOptionEqualToValue={(option, value) => option === value}
                  onChange={(event, newValue) => {
                    setLocValue(newValue ? newValue : "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Location"
                      variant="standard"
                    />
                  )}
                />
              </Box>
              <Box>
                <Autocomplete
                  id="category"
                  options={categories}
                  getOptionLabel={(option) => option}
                  isOptionEqualToValue={(option, value) => option === value}
                  onChange={(event, newValue) => {
                    setCatValue(newValue ? newValue : "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      variant="standard"
                    />
                  )}
                />
              </Box>
            </Box>
            <Box mt={4}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleFilter}
              >
                Apply
              </Button>
            </Box>
          </SidePaper>
        </>
      </Side>
      <Main>
        <>
          <Box>
            <Box
              sx={{
                display:
                  filteredData && filteredData.length > 0 ? "none" : "block",
              }}
            >
              No Token
            </Box>
            <Box
              sx={{
                display:
                  filteredData && filteredData.length > 0 ? "block" : "none",
              }}
            >
              {filteredData && filteredData.length > 0 && (
                <WalletCanvas
                  canvasData={filteredData}
                  address={addressFromURL}
                />
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
        </>
      </Main>
    </TwoColumnLayout>
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
  const res = await fetch(
    `https://api.tzkt.io/v1/accounts?address=${addressFromURL}`
  );
  const address_checker = await res.json();
  if (address_checker.code == 400) {
    return {
      notFound: true,
    };
  }

  /* Fetch data */
  const [role, pools, claims, projects, organizers, artists] =
    await Promise.all([
      await WalletRoleAPI(`/${addressFromURL}`),
      await AkaDropAPI(`/${addressFromURL}/pools?offset=0&limit=0`),
      await AkaDropAPI(`/${addressFromURL}/claims?offset=0&limit=0`),
      await FetchDirectusData(`/projects`),
      await FetchDirectusData(`/organizers`),
      await FetchDirectusData(`/artists`),
    ]);

  return {
    props: {
      role: role,
      pools: pools,
      claims: claims,
      addressFromURL: addressFromURL,
      projects: projects,
      organizers: organizers,
      artists: artists,
    },
    revalidate: 10,
  };
}
