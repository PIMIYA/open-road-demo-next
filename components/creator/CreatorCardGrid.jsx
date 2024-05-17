import { useState, useEffect, useMemo } from "react";

import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";

import { getRandomPlace, getRandomCreator, getRandomTags } from "@/lib/dummy";
import { getAkaswapAssetUrl, getContractFromUid, getIdFromUid, getUrlFromUid } from "@/lib/stringUtils";

export default function({ rawPools }) {

  const pools = rawPools.pools.map((pool) => {
    let result = {
      poolUid: pool.poolUid,
      poolid:  getIdFromUid(pool.poolUid),
      contact: getContractFromUid(pool.poolUid),
      poolURL: getUrlFromUid(pool.poolUid),
    };
    return result;
  });

  const poolURLs = useMemo(() => pools.map(m => m.poolURL), [rawPools]);

  const [cardData, setCardData] = useState(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/walletCreations", {
      method: "POST",
      body: poolURLs,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((res) => {

        let data = res.data;

        // TODO: remove dummy data after api ready
        if (data) {
          data = data.map((d) => {
            d.eventPlace = getRandomPlace();
            d.creator = getRandomCreator();
            d.date = d.createTime;
            d.tokenImageUrl = getAkaswapAssetUrl(d.coverUri);
            d.contract = getContractFromUid(d.tokens[0].uid);
            d.tokenId = getIdFromUid(d.tokens[0].uid);
            d.tags = getRandomTags();

            return d;
          });

          // sort cartData by date
          data.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });
        }

        setCardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [poolURLs]);

  if (!isLoading && !cardData) return <p>No profile data</p>;

  const columnSettings = {
    grid: {
      md: 8,
    },
  }

  return <GeneralTokenCardGrid data={cardData} columnSettings={columnSettings} />;
}
