import { useState, useEffect, useMemo } from "react";
import { AkaDropAPI } from "@/lib/api";

import { Box, Container, Stack, Typography } from "@mui/material";
import CreatorCardGrid from "@/components/creator/CreatorCardGrid";
import { getRandomText } from "@/lib/dummy";

import TwoColumnLayout, {
  Side,
  Main,
} from "@/components/layouts/TwoColumnLayout";
import SidePaper from "@/components/SidePaper";
import Filter from "@/components/Filter";

export default function ({ address, pools }) {
  // TODO: get introduction from real data
  const creatorName = "The Creator Name";
  const description = getRandomText();

  // ian
  /*** orginze poolURL for the fetch in api route ***/
  const mypool = pools.pools.map((pool) => {
    let result = {
      poolUid: pool.poolUid,
      poolURL: pool.poolUid
        .split("-")
        .shift()
        .concat("/", pool.poolUid.split("-").pop()),
    };
    return result;
  });

  const poolURLs = useMemo(() => mypool.map((m) => m.poolURL), [pools]);
  const [dropInfo, setDropInfo] = useState(null);
  const [isLoading, setLoading] = useState(true);

  /*** API ROUTE : using POST to send poolURLs to api/walletCreations, and then get back all data by poolid after client side fetching ***/
  useEffect(() => {
    fetch("/api/walletCreations", {
      method: "POST",
      body: poolURLs,
    })
      .then((res) => res.json())
      .then((data) => {
        setDropInfo(data);
        setLoading(false);
      });
  }, [poolURLs]);

  if (isLoading) return <p>Loading...</p>;
  if (!dropInfo) return <p>No drop info</p>;
  // console.log(data.data[0].id);

  /*** orginze tokens_uid for the fetch in api route ***/
  const mytoken = dropInfo.data.map((d) => {
    let result = {
      tokens_uid: d.tokens.map((t) => {
        return t.uid;
      }),
    };
    return result;
  });

  return (
    <TwoColumnLayout>
      <Side>
        {pools.count > 1 && (
          <SidePaper>
            <Filter />
          </SidePaper>
        )}
      </Side>
      <Main>
        {/* TODO: generative image */}
        {/* <Box
            width={'100%'}
            height={400}
            bgcolor={'white'}
            padding={2}
            mb={4}
          >
            generative image
          </Box> */}
        <Box mb={10}>
          <Typography variant="h5">{creatorName}</Typography>
          <Typography variant="body1">{description}</Typography>
        </Box>

        <CreatorCardGrid rawPools={mytoken} />
      </Main>
    </TwoColumnLayout>
  );
}

export async function getServerSideProps(context) {
  const query = await context.query;
  const address = query.address;

  let [pools] = await Promise.all([
    await AkaDropAPI(`/${address}/pools?offset=0&limit=10`),
  ]);

  return {
    props: { address, pools },
  };
}
