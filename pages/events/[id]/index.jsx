/*** Listing tokens from a specific project ***/

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { paginateAppend } from "@/lib/paginate";
/* MUI */
import { Box, Container, Typography } from "@mui/material";
/* Components */
import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";
import TwoColumnLayout, {
  Main,
  Side,
} from "@/components/layouts/TwoColumnLayout";
import SidePaper from "@/components/SidePaper";
import CustomSelect from "@/components/CustomSelect";
/* Fetch data */
import { FetchDirectusData } from "@/lib/api";
import { fetchCities, fetchVenues, fetchEventNfts } from "@/lib/map-api";
import { formatDateRange } from "@/lib/stringUtils";
import { useT } from "@/lib/i18n/useT";

export default function Project({ event, organizers, artists, tokens }) {
  const t = useT();
  // format event.start_time to GMT timezone, and subtract 8 hours
  const formattedStartTime = event.start_time
    ? new Date(
        new Date(event.start_time).getTime() - 8 * 60 * 60 * 1000
      ).toUTCString()
    : "";
  const formattedEndTime = event.end_time
    ? new Date(
        new Date(event.end_time).getTime() - 8 * 60 * 60 * 1000
      ).toUTCString()
    : "";

  /* Mapping tags to new value */
  if (tokens) {
    // sort data by tokenId
    tokens.sort((a, b) => b.tokenId - a.tokenId);
    // if data's category is "座談", change it to "座談會"
    tokens.forEach((item) => {
      if (item.metadata.category === "座談") {
        item.metadata.category = "研討會 / 論壇 / 座談";
      }
    });
    // if data's tags, each include "視覺", then combine and change it to one "視覺藝術"
    tokens.forEach((item) => {
      if (item.metadata.tags.some((tag) => tag.includes("視覺"))) {
        item.metadata.tags = ["視覺藝術"];
      } else if (item.metadata.tags.some((tag) => tag.includes("舞蹈"))) {
        item.metadata.tags = ["舞蹈"];
      } else if (item.metadata.tags.some((tag) => tag.includes("音樂"))) {
        item.metadata.tags = ["音樂"];
      } else if (item.metadata.tags.some((tag) => tag.includes("設計"))) {
        item.metadata.tags = ["設計"];
      } else if (item.metadata.tags.some((tag) => tag.includes("科技"))) {
        item.metadata.tags = ["元宇宙"];
      } else if (item.metadata.tags.some((tag) => tag.includes("書籍"))) {
        item.metadata.tags = ["出版"];
      } else if (item.metadata.tags.some((tag) => tag.includes("科學"))) {
        item.metadata.tags = ["科學"];
      }
    });
  }

  // get all categories from data
  const categories = tokens
    ? [...new Set(tokens.map((item) => item.metadata.category))]
    : [];

  // get all tags from data without duplicates
  const tags = tokens
    ? tokens
        .map((item) => item.metadata.tags)
        .flat()
        .filter((item, index, self) => self.indexOf(item) === index)
    : [];

  // Combine artists and organizers for the single-select filter
  const allCreators = [
    ...(artists?.data || []).map(artist => artist.name),
    ...(organizers?.data || []).map(organizer => organizer.name),
  ].filter((name, index, self) => self.indexOf(name) === index);

  const [catValue, setCatValue] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [creatorValue, setCreatorValue] = useState("");
  const [filteredData, setFilteredData] = useState(tokens || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loaderRef = useRef(null);
  const observerRef = useRef(null);

  // Auto-filter when any filter value changes
  useEffect(() => {
    const filtered = (tokens || []).filter(
      (c) =>
        (!catValue || c.metadata.category.includes(catValue)) &&
        (!tagValue || c.metadata.tags.some((tag) => tag.includes(tagValue))) &&
        (!creatorValue || (c.metadata.organizer && (
          Array.isArray(c.metadata.organizer)
            ? c.metadata.organizer.includes(creatorValue)
            : c.metadata.organizer.includes(creatorValue)
        )))
    );
    setCurrentPage(1);
    setFilteredData(filtered);
  }, [catValue, tagValue, creatorValue]);

  /* Pagination */
  const pageSize = 6;
  const changePage = (page) => {
    if (!hasMore && page != 1) return;
    setCurrentPage(page);
  };

  // Custom hook to conditionally use useLayoutEffect on the client side
  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          changePage(currentPage + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) {
      observerRef.current.observe(loaderRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, currentPage]);

  useEffect(() => {
    setHasMore(currentPage * pageSize < filteredData.length);
  }, [currentPage, filteredData]);

  return (
    <TwoColumnLayout>
      <Side sticky>
        <SidePaper>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <CustomSelect
              style={{
                background: "transparent",
                padding: "4px",
                fontSize: 14,
                color: "var(--brand-primary)",
                width: "100%",
              }}
              value={catValue}
              onChange={(e) => setCatValue(e.target.value)}
            >
              <option value="">{t.events.categoryLabel}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{t.categoryMap?.[cat] || cat}</option>
              ))}
            </CustomSelect>

            <CustomSelect
              style={{
                background: "transparent",
                padding: "4px",
                fontSize: 14,
                color: "var(--brand-primary)",
                width: "100%",
              }}
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
            >
              <option value="">{t.events.tagLabel}</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>{t.tagMap?.[tag] || tag}</option>
              ))}
            </CustomSelect>

            <CustomSelect
              style={{
                background: "transparent",
                padding: "4px",
                fontSize: 14,
                color: "var(--brand-primary)",
                width: "100%",
              }}
              value={creatorValue}
              onChange={(e) => setCreatorValue(e.target.value)}
            >
              <option value="">{t.events.creatorOrganizer}</option>
              {allCreators.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </CustomSelect>
          </Box>
        </SidePaper>
      </Side>
      <Main>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Banner 3:1 aspect ratio */}
        {event.banner_url && (
          <Box sx={{ width: "100%", mb: 3, paddingTop: "33.33%", position: "relative", overflow: "hidden", borderRadius: "8px" }}>
            <img
              src={event.banner_url}
              alt={event.name || t.events.eventCover}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Box>
        )}

        <Box sx={{ mb: 6, maxWidth: "70ch" }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}>
              {t.mint.event}
            </Typography>
            <Typography variant="h2">
              {event.name}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}>
              {t.wallet.location}
            </Typography>
            <Typography variant="body1">
              {event.venue_name || t.events.locationTbd}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}>
              {t.nft.time}
            </Typography>
            <Typography variant="body1">
              {event.start_time
                ? formatDateRange(formattedStartTime, formattedEndTime)
                : t.events.tbd}
            </Typography>
          </Box>

          {event.description && (
            <Box
              dangerouslySetInnerHTML={{ __html: event.description }}
              sx={{
                mt: 4,
                fontSize: "0.875rem",
                lineHeight: 1.8,
                "& p": { margin: 0, mb: 1 },
                "& *": { fontSize: "inherit", color: "inherit" },
              }}
            />
          )}
        </Box>
        <Box>{filteredData.length == 0 ? t.common.noData : ""}</Box>
        <GeneralTokenCardGrid
          data={paginateAppend(filteredData, currentPage, pageSize)}
          organizers={organizers}
          artists={artists}
        />
        {filteredData.length > 0 && (
          <Box
            ref={loaderRef}
            sx={{
              display: "flex",
              justifyContent: "center",
              pt: 4,
              color: "text.secondary",
            }}
          >
            {hasMore ? t.common.loading : ""}
          </Box>
        )}
        </Box>
      </Main>
    </TwoColumnLayout>
  );
}

export async function getStaticPaths() {
  const data = await FetchDirectusData(`/events`);
  const paths = data.data.map((d) => ({
    params: { id: d.id.toString() },
  }));

  return {
    paths,
    fallback: "blocking",
  };
}

const TARGET_CONTRACT = "KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW";

/**
 * Transform kairos server NFT shape → GeneralTokenCardGrid expected shape.
 * Maps nfts.json fields to the { tokenId, contract, metadata } structure.
 */
const toCardData = (nft, eventName) => ({
  tokenId: nft.token_id,
  contract: { address: TARGET_CONTRACT },
  metadata: {
    name: nft.name,
    name_en: nft.name_en || null,
    description: nft.description,
    description_en: nft.description_en || null,
    category: nft.category,
    tags: nft.tags || [],
    organizer: nft.organizer || null,
    thumbnailUri: nft.thumbnailUri,
    creators: nft.creators || [],
    event_location: null,
    start_time: nft.start_time,
    end_time: nft.end_time,
    event_id: nft.event_id,
    projectName: eventName || null,
    projectId: nft.event_id,
  },
});

export async function getStaticProps({ params }) {
  // --- Parallel: Directus event + kairos server NFTs + organizers + artists ---
  const [event, eventWithNfts, organizers, artists] = await Promise.all([
    FetchDirectusData(`/events/${params.id}`),
    fetchEventNfts(params.id),
    FetchDirectusData(`/organizers`),
    FetchDirectusData(`/artists`),
  ]);

  // --- Venue name from kairos server ---
  let venueName = null;
  if (event.data.venue_id) {
    try {
      const cities = await fetchCities();
      const allVenues = (
        await Promise.all(cities.map((c) => fetchVenues(c.slug)))
      ).flat();
      const venue = allVenues.find((v) => v.id === event.data.venue_id);
      venueName = venue?.name || null;
    } catch (err) {
      console.error("Failed to fetch venue name:", err);
    }
  }

  // --- Transform NFTs to card format ---
  const serverNfts = eventWithNfts?.nfts || [];
  const eventName = event.data.name || eventWithNfts?.name || null;
  const tokens = serverNfts.map((nft) => toCardData(nft, eventName));

  // --- Resolve banner URL ---
  const directusBaseUrl = "https://data.kairos-mint.art";
  let directusToken = "";
  try {
    const loginRes = await fetch(`${directusBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL,
        password: process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD,
      }),
    });
    const loginData = await loginRes.json();
    directusToken = loginData?.data?.access_token || "";
  } catch (err) {
    console.error("Failed to get Directus token for banner:", err);
  }

  const bannerFileId = event.data.banner || null;
  const banner_url = bannerFileId && directusToken
    ? `${directusBaseUrl}/assets/${bannerFileId}?access_token=${directusToken}`
    : null;

  return {
    props: {
      event: { ...event.data, venue_name: venueName, banner_url },
      tokens,
      organizers,
      artists,
    },
    revalidate: 10,
  };
}
