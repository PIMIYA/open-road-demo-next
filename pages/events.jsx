// all event lists

import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { paginateAppend } from "@/lib/paginate";
/* Routing */
import { useRouter } from "next/router";
/* MUI */
import { Box } from "@mui/material";
/* Fetch data */
import { FetchDirectusData } from "@/lib/api";
import { fetchCities, fetchVenues } from "@/lib/map-api";
/* Components */
import TwoColumnLayout, {
  Main,
  Side,
} from "@/components/layouts/TwoColumnLayout";
import EventCardGrid from "@/components/EventCardGrid";
import SidePaper from "@/components/SidePaper";
import CustomSelect from "@/components/CustomSelect";
import { useT } from "@/lib/i18n/useT";

export default function Events({ events }) {
  const t = useT();
  // Filter only published events and add computed status (memoized to avoid infinite re-render)
  const eventsWithStatus = useMemo(() => {
    const published =
      events?.data?.filter((event) => event.status === "published") || [];

    const getEventStatus = (start_time, end_time) => {
      const now = new Date();
      const startDate = start_time ? new Date(start_time) : null;
      const endDate = end_time ? new Date(end_time) : null;

      if (!startDate) return "upcoming";

      if (now < startDate) {
        return "upcoming";
      } else if (endDate && now > endDate) {
        return "archived";
      } else {
        return "current";
      }
    };

    return published.map((event) => ({
      ...event,
      status: getEventStatus(event.start_time, event.end_time),
    }));
  }, [events]);

  const [statusValue, setStatusValue] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" or "oldest"
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const loaderRef = useRef(null);
  const observerRef = useRef(null);

  // Function to sort events by start_time
  const sortEvents = (events, order) => {
    return [...events].sort((a, b) => {
      const dateA = a.start_time ? new Date(a.start_time) : new Date(0);
      const dateB = b.start_time ? new Date(b.start_time) : new Date(0);

      if (order === "newest") {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });
  };

  // Function to apply filters and sorting
  const applyFiltersAndSort = () => {
    let filtered = eventsWithStatus;

    // Apply status filter
    if (statusValue) {
      filtered = filtered.filter((event) => event.status === statusValue);
    }

    // Apply sorting
    filtered = sortEvents(filtered, sortOrder);

    return filtered;
  };

  const handleSortChange = (newSortOrder) => {
    setSortOrder(newSortOrder);
    const filteredEvents = applyFiltersAndSort();
    changePage(1);
    setFilteredData(filteredEvents);
  };

  /* Pagination */
  const pageSize = 6;
  const changePage = (page) => {
    if (!hasMore && page != 1) return;
    setCurrentPage(page);
  };

  /* Router */
  const router = useRouter();
  const statusState = router.query.status ? router.query.status : "";

  // Custom hook to conditionally use useLayoutEffect on the client side
  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  // Initialize from router query only once
  useEffect(() => {
    if (!isInitialized && statusState) {
      setStatusValue(statusState);
      setIsInitialized(true);
    } else if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [statusState, isInitialized]);

  // Apply filters and sorting when dependencies change
  useEffect(() => {
    if (isInitialized) {
      const filteredEvents = applyFiltersAndSort();
      setFilteredData(filteredEvents);
    }
  }, [statusValue, sortOrder, eventsWithStatus, isInitialized]);

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
              value={statusValue}
              onChange={(e) => {
                setStatusValue(e.target.value);
              }}
            >
              <option value="">{t.events.status}</option>
              <option value="upcoming">{t.events.upcoming}</option>
              <option value="current">{t.events.current}</option>
              <option value="archived">{t.events.archived}</option>
            </CustomSelect>

            <CustomSelect
              style={{
                background: "transparent",
                padding: "4px",
                fontSize: 14,
                color: "var(--brand-primary)",
                width: "100%",
              }}
              value={sortOrder}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="newest">{t.events.newest}</option>
              <option value="oldest">{t.events.oldest}</option>
            </CustomSelect>
          </Box>
        </SidePaper>
      </Side>
      <Main>
        <Box>{filteredData.length == 0 ? t.common.noData : ""}</Box>
        <EventCardGrid
          data={paginateAppend(filteredData, currentPage, pageSize)}
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
      </Main>
    </TwoColumnLayout>
  );
}

export async function getStaticProps() {
  const events = await FetchDirectusData(`/events`);

  // Resolve venue_id → venue_name for display
  let venueMap = {};
  try {
    const cities = await fetchCities();
    const allVenues = (
      await Promise.all(cities.map((c) => fetchVenues(c.slug)))
    ).flat();
    venueMap = Object.fromEntries(allVenues.map((v) => [v.id, { name: v.name, name_en: v.name_en || null }]));
  } catch (err) {
    console.error("Failed to fetch venues for events page:", err);
  }

  const directusBaseUrl = "https://data.kairos-mint.art";

  // Get Directus token once for all cover images
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
    console.error("Failed to get Directus token for covers:", err);
  }

  const enrichedEvents = {
    ...events,
    data: (events?.data || []).map((event) => ({
      ...event,
      venue_name: venueMap[event.venue_id]?.name || null,
      venue_name_en: venueMap[event.venue_id]?.name_en || null,
      cover_url: event.cover && directusToken
        ? `${directusBaseUrl}/assets/${event.cover}?access_token=${directusToken}`
        : null,
    })),
  };

  return {
    props: {
      events: enrichedEvents,
    },
    revalidate: 1, // In seconds
  };
}
