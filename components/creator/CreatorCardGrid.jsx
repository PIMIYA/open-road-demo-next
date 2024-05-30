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
        return res.json();
      })
      .then((res) => {
        let data = res.data;
        // console.log("creator's tokens", data);
        // TODO: remove dummy data after api ready
        // if (data) {
        //   data = data.map((d) => {
        //     d.eventPlace = d.metadata.event_location
        //       ? d.metadata.event_location
        //       : getRandomPlace();
        //     d.creator = d.metadata.organizer
        //       ? d.metadata.organizer
        //       : getRandomCreator();
        //     // d.date = d.createTime; //還沒有create time
        //     d.tokenImageUrl = getAkaswapAssetUrl(d.metadata.displayUri);
        //     d.contract = getContractFromUid(d.contract.address);
        //     d.tokenId = getIdFromUid(d.tokenId);
        //     d.tags = d.metadata.tags;
        //     d.name = d.metadata.name;
        //     d.start_time = d.metadata.start_time;
        //     d.end_time = d.metadata.end_time;

        //     return d;
        //   });

        //   // sort cartData by date
        //   // data.sort((a, b) => {
        //   //   return new Date(b.date) - new Date(a.date);
        //   // });
        // }

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
  };

  return (
    <GeneralTokenCardGrid data={cardData} columnSettings={columnSettings} />
  );
}
