// claim token lists by this wallet address.
// redirect from akadrop claim page.
import { useEffect, useMemo, useState } from "react";
/* Providers */
import { useConnection } from "@/packages/providers";
/* MUI */
import { Box, Stack, Autocomplete, TextField, Button } from "@mui/material";
/* Fetch data */
import { WalletRoleAPI } from "@/lib/api";
import { AkaDropAPI } from "@/lib/api";
/* Dummy for mockup */
import { getRandomText } from "@/lib/dummy";
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

const categories = [
  { label: "展覽" },
  { label: "表演" },
  { label: "課程" },
  { label: "導覽" },
  { label: "工作坊" },
  { label: "黑客松" },
  { label: "座談" },
  { label: "親子" },
  { label: "節祭／展會／市集" },
  { label: "分享會／同好會／見面會" },
];

export default function Wallet({ role, pools, claims, addressFromURL }) {
  /* Connected wallet */
  const { address, connect, disconnect } = useConnection();
  // TODO: get introduction from real data
  const introduction = getRandomText();
  /* Client fetch tokens' data */
  const [cardData, setCardData] = useState(null);
  const [isLoading, setLoading] = useState(true);
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

  /*** array poolURL to do api route ***/
  const claimTokenURLs = useMemo(
    () => myclaims.map((c) => c.tokenURL),
    [claims]
  );

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
            return d;
          });

          // sort cartData by cliamDate
          data.sort((a, b) => {
            return new Date(b.cliamDate) - new Date(a.cliamDate);
          });
        }

        setCardData(data);
        setLoading(false);
        setFilteredData(data);
      });
  }, [claimTokenURLs]);

  // Location Search Filter
  const handleFilter = (event) => {
    if (event === null) return;
    const value_loc = event.main || event.target.value || event.input;
    // console.log("value_loc", value_loc);
    if (!event || value_loc === undefined) {
      setFilteredData(cardData);
      return;
    } else {
      const filterdByCat = cardData.filter((c) =>
        c.token.metadata.event_location.includes(value_loc)
      );
      setFilteredData(filterdByCat);
    }
  };

  // Category Selection Filter
  const handleFilterC = (event) => {
    if (event === null) return;
    const value_cat = event.label || event;
    // console.log("value_cat", value_cat);
    if (!event) {
      setFilteredData(cardData);
      return;
    } else {
      const filterdByCat = cardData.filter((c) =>
        c.token.metadata.category.includes(value_cat)
      );
      setFilteredData(filterdByCat);
    }
  };
  // console.log("filteredData", filteredData);

  return (
    <TwoColumnLayout>
      <Side sticky={true}>
        {<SidePaper>
          <WalletProfile address={addressFromURL} />
        </SidePaper>}
        {cardData && cardData.length > 0 && (
          <SidePaper>
            <Box>
              <TextField
                id="Location"
                label="Location"
                variant="standard"
                onChange={handleFilter}
              />
            </Box>
            <Box component="form">
              <Box>
                <Autocomplete
                  id="category"
                  options={categories}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.label === value.label
                  }
                  onChange={(event, newValue) => {
                    // console.log("newValue", newValue);
                    handleFilterC(newValue);
                    if (newValue === null) {
                      setFilteredData(cardData);
                    }
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
            {/* <Box mt={4}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleFilterC}
              >
                Apply
              </Button>
            </Box> */}
          </SidePaper>
        )}
      </Side>
      <Main>
        {cardData && cardData.length === 0 ? (
          <>No Token</>
        ) : (
          <Box>
            <WalletCanvas canvasData={cardData} address={addressFromURL} />
            <Stack direction="row">
              <Box width={"100%"}>
                {/* timeline */}
                <WalletTimeline cardData={filteredData} />
                <Box>
                  {filteredData && filteredData.length == 0 ? "No Token" : ""}
                </Box>
              </Box>
              {/* TODO: analytics */}
            </Stack>
          </Box>
        )}
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
    await AkaDropAPI(`/${addressFromURL}/pools?offset=0&limit=10`),
    await AkaDropAPI(`/${addressFromURL}/claims?offset=0&limit=10`),
  ]);

  return {
    props: { role, pools, claims, addressFromURL },
    revalidate: 10,
  };
}
