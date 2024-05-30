import { useEffect, useMemo, useState } from "react";
import WalletTimelineCard from "./WalletTimelineCard";

import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";

import {
  getContractFromUid,
  getIdFromUid,
  getUrlFromUid,
} from "@/lib/stringUtils";
import { getRandomDate, getRandomPlace, getRandomCreator } from "@/lib/dummy";

// TODO: infinite scroll
// TODO: skeleton loading
export default function WalletTimeline({ rawClaims }) {
  const [cardData, setCardData] = useState([null, null, null]);
  const [isLoading, setLoading] = useState(true);

  const claims = rawClaims.claims.map((claim) => {
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
    () => claims.map((c) => c.tokenURL),
    [rawClaims]
  ); // useMemo to avoid re-render
  // console.log(claimTokenURLs);

  // Fetch data of claim's tokens from tzkt api
  useEffect(() => {
    fetch("/api/walletRecords", {
      method: "POST",
      body: claimTokenURLs,
    })
      .then((res) => res.json())
      .then((res) => {
        let data = res.data;
        // console.log("claim's tokens", data);

        if (data) {
          // TODO: remove dummy data after api ready
          data = data.map((d) => {
            // d.cliamDate = getRandomDate(); // 還不知道要去哪裡得到akadrop claim的時間
            d.eventPlace = d.metadata.event_location;
            d.creator = d.metadata.organizer;
            return d;
          });

          // sort cartData by cliamDate
          data.sort((a, b) => {
            return new Date(b.cliamDate) - new Date(a.cliamDate);
          });
        }

        setCardData(data);
        setLoading(false);
      });
  }, [claimTokenURLs]);

  if (!isLoading && !cardData) return <p>No profile data</p>;

  return (
    <Timeline
      sx={{
        mt: 0,
        padding: 0,
        "> li::before": {
          flex: 0,
        },
      }}
    >
      {cardData.map((card, index) => (
        <TimelineItem key={index}>
          <TimelineSeparator>
            <TimelineDot color="secondary" />
            {index !== cardData.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <WalletTimelineCard data={card} key={index} />
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
