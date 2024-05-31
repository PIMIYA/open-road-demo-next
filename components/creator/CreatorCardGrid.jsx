import { useState, useEffect, useMemo } from "react";

import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";

import { getRandomPlace, getRandomCreator, getRandomTags } from "@/lib/dummy";
import {
  getAkaswapAssetUrl,
  getContractFromUid,
  getIdFromUid,
  getUrlFromUid,
} from "@/lib/stringUtils";

export default function ({ rawPools }) {
  const pools = rawPools.map((pool) => {
    let result = {
      poolURL: getUrlFromUid(pool.tokens_uid[0]),
    };
    return result;
  });

  const poolURLs = useMemo(() => pools.map((m) => m.poolURL), [rawPools]);
  // console.log("poolURLs", poolURLs);

  const [cardData, setCardData] = useState(null);
  const [isLoading, setLoading] = useState(true);

  // Fetch data of creator's tokens from tzkt api
  useEffect(() => {
    fetch("/api/walletRecords", {
      method: "POST",
      body: poolURLs,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        // console.log(res);
        return res.json();
      })
      .then((res) => {
        let data = res.data;
        setCardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [poolURLs]);

  if ((!isLoading && !cardData) || cardData == null) return <p>No mint data</p>;

  const columnSettings = {
    grid: {
      md: 8,
    },
  };

  return (
    <GeneralTokenCardGrid data={cardData} columnSettings={columnSettings} />
  );
}
