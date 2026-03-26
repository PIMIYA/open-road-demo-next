/*** Data, collectors and comments of a single token ***/

import { useEffect, useState } from "react";
/* Fetch data */
import {
  TZKT_API,
  MainnetAPI,
  GetClaimablePoolID,
  FetchDirectusData,
} from "@/lib/api";
import { fetchCities, fetchVenues } from "@/lib/map-api";
/* Components */
import { Box, Typography } from "@mui/material";
import SingleToken from "@/components/singleToken";
/* Routing */
import { useRouter } from "next/router";

import {
  getRandomCreator,
  getRandomObjectType,
  getRandomPeriod,
} from "@/lib/dummy";

const contractAddress = "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf";

export default function Id({ ownersData, data, data_from_pool, organizers, artists, events, venueNameMap, airdropTransfers }) {
  /* Hooks must be called unconditionally (before any early return) */
  const [comments, setComments] = useState(null);
  const tokenId = data?.[0]?.tokenId;

  useEffect(() => {
    if (!tokenId) return;
    fetch("/api/get-comments-byTokenID", {
      method: "POST",
      body: tokenId,
    })
      .then((res) => res.json())
      .then((res) => setComments(res.data));
  }, [tokenId]);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Box sx={{ px: 3, py: 10, textAlign: "center" }}>
        <Typography variant="overline" color="error.main">
          Unable to load token data. Please try again later.
        </Typography>
      </Box>
    );
  }

  // TODO: remove dummy data after api ready
  if (data) {
    data = data.map((d) => {
      d.eventPlace = d.metadata.event_location
        || (d.metadata.venue_id && venueNameMap?.[d.metadata.venue_id])
        || "";
      d.creator = d.metadata.organizer
        ? d.metadata.organizer
        : getRandomCreator();
      d.objectType = getRandomObjectType();
      d.eventDate = getRandomPeriod();
      d.start_time = d.metadata.start_time;
      d.end_time = d.metadata.end_time;
      if (data_from_pool) {
        d.poolId = data_from_pool[0].key;
        d.duration = data_from_pool[0].value.duration;
      } else {
        d.poolId = null;
        d.duration = null;
      }

      return d;
    });
  }
  /* add projectName and fill missing eventPlace from events */
  if (data && events) {
    data.forEach((item) => {
      const matchingProject = events.data.find(
        (project) =>
          project.status === "published" &&
          (
            // Match by event_id (id in Directus) first
            (item.metadata.event_id && project.id === item.metadata.event_id) ||
            // Fallback: match by location + start_time
            (project.location === item.metadata.event_location &&
              project.start_time &&
              new Date(
                new Date(project.start_time).getTime() - 8 * 60 * 60 * 1000
              ).toUTCString() === item.metadata.start_time)
          )
      );
      if (matchingProject) {
        item.metadata.projectName = matchingProject.name;
        item.metadata.projectId = matchingProject.id;
        // Fill missing eventPlace from event's venue
        if (!item.eventPlace && matchingProject.venue_id && venueNameMap?.[matchingProject.venue_id]) {
          item.eventPlace = venueNameMap[matchingProject.venue_id];
        }
      }
    });
  }

  return (
    <>
      {data.map((d, index) => {
        return (
          <div key={index}>
            <SingleToken
              data={d}
              ownersData={ownersData}
              organizers={organizers}
              artists={artists}
              comments={comments}
              airdropTransfers={airdropTransfers}
            />
          </div>
        );
      })}
    </>
  );
}

export async function getServerSideProps(params) {
  const [ownersData, data, data_from_pool, organizers, artists, events, airdropTransfers] =
    await Promise.all([
      MainnetAPI(
        `/fa2tokens/${params.params.contract}/${params.params.tokenId}`
      ),
      TZKT_API(
        `/v1/tokens?contract=${params.params.contract}&tokenId=${params.params.tokenId}`
      ),
      GetClaimablePoolID(
        contractAddress,
        params.params.contract,
        params.params.tokenId
      ),
      FetchDirectusData(`/organizers`),
      FetchDirectusData(`/artists`),
      FetchDirectusData(`/events`),
      TZKT_API(
        `/v1/tokens/transfers?token.contract=${params.params.contract}&token.tokenId=${params.params.tokenId}&from=${contractAddress}&limit=10000`
      ),
    ]);

  // Resolve venue name from venue_id for tokens missing event_location
  let venueNameMap = {};
  if (data && Array.isArray(data)) {
    const needsVenue = data.some(
      (d) => !d.metadata?.event_location
    );
    if (needsVenue) {
      try {
        const cities = await fetchCities();
        const allVenues = (
          await Promise.all(cities.map((c) => fetchVenues(c.slug)))
        ).flat();
        for (const v of allVenues) {
          venueNameMap[v.id] = v.name;
        }
      } catch (err) {
        console.error("Failed to fetch venues for claimsToken:", err);
      }
    }
  }

  return {
    props: { ownersData, data, data_from_pool, organizers, artists, events, venueNameMap, airdropTransfers: airdropTransfers || [] },
  };
}
