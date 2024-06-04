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
export default function WalletTimeline({ cardData }) {
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
      {cardData &&
        cardData.map((card, index) => (
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
