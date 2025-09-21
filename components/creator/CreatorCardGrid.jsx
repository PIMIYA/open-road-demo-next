import { useState, useEffect, useMemo } from "react";

import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";

import { getRandomPlace, getRandomCreator, getRandomTags } from "@/lib/dummy";
import {
  getAkaswapAssetUrl,
  getContractFromUid,
  getIdFromUid,
  getUrlFromUid,
} from "@/lib/stringUtils";

export default function ({ rawPools, address }) {
  // console.log("rawPools", rawPools);
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
    fetch("/api/walletRecordsCreations", {
      method: "POST",
      body: [poolURLs, `.${address}`],
    })
      .then((res) => res.json())
      .then((data) => {
        setCardData(data);
        setLoading(false);
      });
  }, [poolURLs]);

  console.log("cardData", cardData);

  if ((!isLoading && !cardData) || cardData == null) return <p>No mint data</p>;

  const columnSettings = {
    grid: {
      md: 8,
    },
  };

  return (
    // <>ss</>
    <GeneralTokenCardGrid
      data={cardData.data}
      columnSettings={columnSettings}
    />
  );
}
