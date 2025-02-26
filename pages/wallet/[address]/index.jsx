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
import { WalletRoleAPI } from "@/lib/api";
import { AkaDropAPI } from "@/lib/api";
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

export default function Wallet({ role, pools, claims, addressFromURL }) {
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
  /* Array poolURL to do API route */
  const poolTokenURLs = useMemo(() => mypools.map((m) => m.poolURL), [pools]);
  // console.log("poolTokenURLs", poolTokenURLs);

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
            d.cliamDate = new Date(d.timestamp).toLocaleDateString();
            d.claimTime = new Date(d.timestamp).toLocaleTimeString();
            return d;
          });
          // sort cartData by timestamp
          data.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
          });
        }
        setClaimData(data);
      });
  }, [claimTokenURLs]);
  console.log("claimData", claimData);

  /* API route: Client fetch CREATED TOKENS step 1 by using poolURL at AkaDrop API */
  useEffect(() => {
    fetch("/api/walletCreations", {
      method: "POST",
      body: poolTokenURLs,
    })
      .then((res) => res.json())
      .then((res) => {
        let data = res.data;
        // console.log("creator's tokens", data);
        if (data) {
          const data2 = data.map((d) => {
            let result = {
              tokens_uid: d.tokens.map((t) => {
                return t.uid;
              }),
            };
            return result;
          });

          const pools = data2.map((pool) => {
            let result = {
              poolURL: getUrlFromUid(pool.tokens_uid[0]),
            };
            return result;
          });
          const poolURLs = pools.map((m) => m.poolURL);
          setCreatedPoolURL(poolURLs);
        }
      });
  }, [poolTokenURLs]);
  // console.log("createdPoolURL", createdPoolURL);

  /* API route: Client fetch CREATED TOKENS step 2 by using tokenId at TZKT API */
  useEffect(() => {
    fetch("/api/walletRecordsCreations", {
      method: "POST",
      body: [createdPoolURL, `.${addressFromURL}`],
    })
      .then((res) => res.json())
      .then((data) => {
        setCreatedData(data.data);
      });
  }, [createdPoolURL]);
  console.log("createdData", createdData);

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

  console.log("filteredData", filteredData);

  /* Locations : get all locations from data */
  const locations = useMemo(() => {
    const data = value === 0 ? claimData : createdData;
    if (data) {
      const locations = [];
      data.forEach((c) => {
        if (!locations.includes(c.token.metadata.event_location)) {
          locations.push(c.token.metadata.event_location);
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
        ...new Set(data.map((item) => item.token.metadata.category)),
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
        const eventLocation = c.token.metadata.event_location || "";
        return (
          eventLocation.includes(locValue) &&
          c.token.metadata.category.includes(catValue)
        );
      });
      setFilteredData(filteredByCat);
    }
  };
  // console.log("filteredData", filteredData);

  return (
    <TwoColumnLayout>
      <Side sticky={true}>
        {
          <SidePaper>
            <WalletProfile address={addressFromURL} />
          </SidePaper>
        }

        <>
          <SidePaper>
            {/* <Tabs value={value} onChange={handleChange}>
              <Tab label="Claimed" disabled={claimData === null} />
              <Tab label="Created" disabled={createdData === null} />
            </Tabs> */}
            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleClaimed}
                sx={{ mr: 1 }}
              >
                Claimed
              </Button>

              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleCreated}
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
            <Box sx={{ display: filteredData ? "none" : "block" }}>
              No Token
            </Box>
            <Box sx={{ display: filteredData ? "block" : "none" }}>
              <WalletCanvas
                canvasData={filteredData}
                address={addressFromURL}
              />
            </Box>

            <Stack direction="row">
              <Box width={"100%"}>
                <WalletTimeline cardData={filteredData} />
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
  const [role, pools, claims] = await Promise.all([
    await WalletRoleAPI(`/${addressFromURL}`),
    await AkaDropAPI(`/${addressFromURL}/pools?offset=0&limit=0`),
    await AkaDropAPI(`/${addressFromURL}/claims?offset=0&limit=0`),
  ]);

  return {
    props: { role, pools, claims, addressFromURL },
    revalidate: 10,
  };
}
