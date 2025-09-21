// all event lists

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { paginateAppend } from "@/lib/paginate";
/* Routing */
import { useRouter } from "next/router";
/* MUI */
import {
  Box,
  Autocomplete,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
/* Fetch data */
import { FetchDirectusData } from "@/lib/api";
/* Components */
import TwoColumnLayout, {
  Main,
  Side,
} from "@/components/layouts/TwoColumnLayout";
import EventCardGrid from "@/components/EventCardGrid";
import SidePaper from "@/components/SidePaper";

export default function Events({ events }) {
  // Filter only published events
  const publishedEvents =
    events?.data?.filter((event) => event.status === "published") || [];

  // Function to get event status based on start_time and end_time
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

  // Add status to each event
  const eventsWithStatus = publishedEvents.map((event) => ({
    ...event,
    status: getEventStatus(event.start_time, event.end_time),
  }));

  // get all statuses from events
  const statuses = ["upcoming", "current", "archived"];

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

  const handleFilter = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const filteredEvents = applyFiltersAndSort();
    changePage(1);
    setFilteredData(filteredEvents);
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
          <Box component="form">
            <Box mb={2}>
              <Autocomplete
                id="status"
                options={statuses}
                getOptionLabel={(option) => {
                  switch (option) {
                    case "upcoming":
                      return "即將舉行";
                    case "current":
                      return "進行中";
                    case "archived":
                      return "已結束";
                    default:
                      return option;
                  }
                }}
                isOptionEqualToValue={(option, value) => option === value}
                value={
                  statuses.find((status) => status === statusValue) || null
                }
                onChange={(event, newValue) => {
                  setStatusValue(newValue ? newValue : "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="活動狀態" variant="standard" />
                )}
              />
            </Box>
            <Box mb={2}>
              <FormControl fullWidth variant="standard">
                <InputLabel id="sort-label">排序方式</InputLabel>
                <Select
                  labelId="sort-label"
                  value={sortOrder}
                  onChange={(e) => handleSortChange(e.target.value)}
                  label="排序方式"
                >
                  <MenuItem value="newest">最新優先</MenuItem>
                  <MenuItem value="oldest">最舊優先</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          <Box mt={4}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleFilter}
            >
              Apply
            </Button>
          </Box>
        </SidePaper>
      </Side>
      <Main>
        <Box>{filteredData.length == 0 ? "no data" : ""}</Box>
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
            {hasMore ? "Loading..." : ""}
          </Box>
        )}
      </Main>
    </TwoColumnLayout>
  );
}

export async function getStaticProps() {
  const events = await FetchDirectusData(`/events`);

  return {
    props: {
      events: events,
    },
    revalidate: 1, // In seconds
  };
}
