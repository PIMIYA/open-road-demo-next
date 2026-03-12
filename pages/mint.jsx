import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Chip,
  Stack,
  TextField,
  Autocomplete,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Container,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { fetchCities, fetchVenues } from "@/lib/map-api";

/* Kairos */
import { useConnection } from "@/packages/providers";

/* Components */
import { Sharer } from "@/components/sharer";

// List value of categories, tags, and licenses
import {
  categories,
  tags,
  licenses,
  VisuallyHiddenInput,
} from "@/components/mint/const";

import { FetchDirectusData } from "@/lib/api";

const ACCEPT_EXTS =
  ".bmp,.gif,.jpg,.jpeg,.png,.svg,.webp," +
  ".mp4,.ogv,.mov,.webm," +
  ".glb,.gltf," +
  ".mp3,.oga," +
  ".pdf,.zip";

function classifyFile(file) {
  if (!file) return {};
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  const hasExt = (ext) => name.endsWith(ext);

  const isImage =
    type.startsWith("image/") ||
    [".bmp", ".gif", ".jpg", ".jpeg", ".png", ".svg", ".webp"].some(hasExt);

  const isVideo =
    type.startsWith("video/") || [".mp4", ".ogv", ".mov", ".webm"].some(hasExt);

  const isAudio = type.startsWith("audio/") || [".mp3", ".oga"].some(hasExt);

  const is3D = [".glb", ".gltf"].some(hasExt);

  const isPDF = type === "application/pdf" || hasExt(".pdf");

  const isZip = type === "application/zip" || hasExt(".zip");

  // 非圖片 → 一律需要縮圖（由後端產 thumbnail）
  const needsDisplay = !isImage;

  return { isImage, isVideo, isAudio, is3D, isPDF, isZip, needsDisplay };
}

/* ------------------------------------------------ */

export default function Mint({ organizers, artists, cities, events }) {
  const router = useRouter();

  // Event selection
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Location: city → venue progressive disclosure
  const [selectedCity, setSelectedCity] = useState(null);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);

  // Form states
  let pinningMetadata = false;
  let mintingToken = false;

  // const serverUrl =
  //   process.env.NODE_ENV === "production"
  //     ? process.env.SERVER_URL
  //     : "http://localhost:3030";
  const serverUrl = process.env.SERVER_URL;

  const contractAddress = "KT1Aq4wWmVanpQhq4TTfjZXB5AjFpx15iQMM";
  const contractId = 92340; // 正式92340 測試91040

  const { address, callcontract } = useConnection();
  const createrAddress = "tz1XBEMJfYoMoMMZafjYv3Q5V9u3QKv1xuBR";

  const titleRef = useRef();
  const descriptionRef = useRef();
  const walletRef = useRef();

  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [mintingTokenQty, setMintingTokenQty] = useState(1);
  const [royaltyPercentage, setRoyaltyPercentage] = useState(10);
  const [walletAddress, setWalletAddress] = useState(``);

  const [file, setFile] = useState(undefined);
  const [display, setDisplay] = useState(undefined);
  const [fileKind, setFileKind] = useState(null);
  const [isXDirectory, setIsXDirectory] = useState(true); // ZIP 預設視為 x-directory

  const [miningInProgress, setMiningInProgress] = useState(false);
  const [startTime, setStartTime] = useState();
  const [endTime, setEndTime] = useState();

  // royalties share
  const [useRoyaltiesShare, setUseRoyaltiesShare] = useState();
  const [royaltiesSharers, setRoyaltiesSharer] = useState([
    { id: 0, address: walletAddress, share: 100 },
  ]);

  // Wallet role
  const [roleData, setRoleData] = useState(null);
  const [isLoadingRole, setLoadingRole] = useState(true);

  // Fetch venues when city changes
  useEffect(() => {
    if (!selectedCity) {
      setVenues([]);
      setSelectedVenue(null);
      return;
    }
    fetchVenues(selectedCity.slug)
      .then(setVenues)
      .catch((err) => console.error("Failed to load venues:", err));
  }, [selectedCity]);

  useEffect(() => {
    if (!address) return;

    // Auto import wallet address to input field
    setWalletAddress(address);

    // Fetch wallet role
    fetch("/api/walletRoles", {
      method: "POST",
      body: address,
    })
      .then((res) => res.json())
      .then((data) => {
        setRoleData(data);
        setLoadingRole(false);
      });
  }, [address]);

  if (isLoadingRole) return <p>Loading...</p>;
  if (!roleData) return <p>No role data</p>;
  if (roleData.data.length === 0 || !address) {
    router.push("/cannotMint");
  }

  /**
   * 檔案上傳：不在前端解 ZIP
   * 由後端解壓、處理檔案內容、驗證、pinFromFS
   */
  const handleFileUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const kind = classifyFile(f);
    setFile(f);
    setFileKind(kind);
    if (kind.isZip) setIsXDirectory(true);
  };

  const handleDisplayChange = (e) => {
    const t = e.target.files?.[0];
    if (!t) return;
    setDisplay(t);
  };
  /* ------------------------------------------------ */

  const upload = async (event) => {
    event.preventDefault();

    if (!file) {
      console.error("No primary file selected");
      return;
    }

    const kind = fileKind ?? classifyFile(file);
    if (kind && !kind.isImage && !display) {
      console.error("Display required for non-image types");
      return;
    }

    try {
      setMiningInProgress(true);
      pinningMetadata = true;
      const data = new FormData();

      // Event
      data.append("event_id", selectedEvent?.id || "");

      // Base metadata
      data.append("title", titleRef.current.value || "");
      data.append("description", descriptionRef.current.value || "");
      data.append("organizer", selectedOrganizer?.name || "");

      const resultArtists = (selectedArtists || []).map((a) => a.name);
      data.append("artists", JSON.stringify(resultArtists));
      data.append("category", selectedCategory?.label || "");

      const resultTags = (selectedTags || []).map((t) => t.label);
      data.append("tags", JSON.stringify(resultTags));

      // Location
      data.append("city_slug", selectedCity?.slug || "");
      data.append("venue_id", selectedVenue?.id || "");
      data.append(
        "geoLocation",
        selectedVenue
          ? JSON.stringify([selectedVenue.lat, selectedVenue.lng])
          : ""
      );

      // Time (ISO string with timezone; backend converts to UTC)
      data.append("startTime", startTime ? startTime.toISOString() : "");
      data.append("endTime", endTime ? endTime.toISOString() : "");

      data.append("creator", createrAddress);
      data.append("minter", contractAddress);
      data.append("mintingTool", serverUrl);
      data.append("rights", selectedLicense?.label || "");

      // Royalties
      const beautyShares = Object.fromEntries(
        (royaltiesSharers || []).map((s) => [
          s.address,
          royaltyPercentage * s.share,
        ])
      );
      const royaltiesShare = { decimals: 4, shares: beautyShares };
      const royaltySimple = {
        decimals: 4,
        shares: { [address]: royaltyPercentage * 100 },
      };
      if (useRoyaltiesShare) {
        data.append("royalties", JSON.stringify(royaltiesShare));
      } else {
        data.append("royalties", JSON.stringify(royaltySimple));
      }

      // Files
      data.append("image", file);
      if (display) data.append("display", display);

      // ZIP → 是否要求後端走 x-directory 流程（仍由後端驗證 index.html 等）
      if (kind?.isZip) data.append("xdir", isXDirectory ? "1" : "0");

      const response = await fetch(`${serverUrl}/mint`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Mint failed: ${response.status} ${text}`);
      }

      const payload = await response.json();

      if (
        payload?.status === true &&
        payload?.msg?.metadataHash &&
        payload?.msg?.imageHash
      ) {
        console.log("===== IPFS 上傳成功 =====");
        console.log("Metadata Hash:", payload.msg.metadataHash);
        console.log("Image Hash:", payload.msg.imageHash);

        pinningMetadata = false;
        mintingToken = true;

        const metadataHash = `ipfs://${payload.msg.metadataHash}`;
        const metadataHashes = [metadataHash];
        const creators = [createrAddress, address];

        const contractCallDetails = {
          contractId,
          tokenQty: mintingTokenQty,
          creators,
          tokens: metadataHashes,
        };

        try {
          const opHash = await callcontract(contractCallDetails);
          console.log("Operation successful with hash:", opHash);
        } catch (err) {
          console.error("Error calling contract function:", err);
        }
      } else {
        throw new Error("No IPFS hash in response");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setMiningInProgress(false);
      pinningMetadata = false;
      mintingToken = false;
    }
  };

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack
          component="form"
          spacing={5}
          noValidate
          autoComplete="off"
        >
          <Autocomplete
            id="event"
            options={events}
            getOptionLabel={(o) => o.name || ""}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            fullWidth
            value={selectedEvent}
            onChange={(e, v) => setSelectedEvent(v)}
            renderInput={(params) => (
              <TextField {...params} label="Event" />
            )}
          />
          <TextField
            inputRef={titleRef}
            id="title"
            label="Title"
            fullWidth
          />
          <TextField
            id="description"
            inputRef={descriptionRef}
            label="Description"
            multiline
            maxRows={4}
            fullWidth
          />
          <Autocomplete
            id="organizer"
            options={organizers.data.filter((o) => o.status === "published")}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(o, v) => o.name === v.name}
            fullWidth
            onChange={(e, v) => setSelectedOrganizer(v)}
            renderInput={(params) => (
              <TextField {...params} label="Organizer" />
            )}
          />
          <Autocomplete
            multiple
            id="artist"
            options={artists.data.filter((o) => o.status === "published")}
            getOptionLabel={(o) => o.name}
            fullWidth
            onChange={(e, v) => setSelectedArtists(v)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.name}
                  {...getTagProps({ index })}
                  key={option.name}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Artists" />
            )}
          />
          <Autocomplete
            id="categoriy"
            options={categories}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(o, v) => o.label === v.label}
            fullWidth
            onChange={(e, v) => setSelectedCategory(v)}
            renderInput={(params) => (
              <TextField {...params} label="Category" />
            )}
          />
          <Autocomplete
            multiple
            id="tag"
            options={tags}
            getOptionLabel={(o) => o.label}
            fullWidth
            onChange={(e, v) => setSelectedTags(v)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.label}
                  {...getTagProps({ index })}
                  key={option.label}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Tag" />
            )}
          />
          {/* Location: city → venue progressive disclosure */}
          <Autocomplete
            id="city"
            options={cities}
            getOptionLabel={(o) =>
              o.name_zh ? `${o.name_zh} (${o.name_en})` : o.slug
            }
            isOptionEqualToValue={(o, v) => o.slug === v.slug}
            fullWidth
            value={selectedCity}
            onChange={(e, v) => {
              setSelectedCity(v);
              setSelectedVenue(null);
            }}
            renderInput={(params) => (
              <TextField {...params} label="City" />
            )}
          />
          <Autocomplete
            id="venue"
            options={venues}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            fullWidth
            value={selectedVenue}
            disabled={!selectedCity}
            noOptionsText={selectedCity ? "No venues" : "Select a city first"}
            onChange={(e, v) => setSelectedVenue(v)}
            renderInput={(params) => (
              <TextField {...params} label="Venue" />
            )}
          />

          {/* lat/lng from selected venue */}
          {selectedVenue ? (
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                lat: {selectedVenue.lat} &nbsp; lng: {selectedVenue.lng}
              </Typography>
            </Box>
          ) : null}

          {/* time */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction="row" spacing={4}>
              <DatePicker
                label="Start time"
                slotProps={{
                  textField: { fullWidth: true },
                  popper: {
                    sx: {
                      "& .MuiPaper-root": {
                        backgroundColor: "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(8px)",
                      },
                    },
                  },
                }}
                value={startTime ?? null}
                onChange={(v) => setStartTime(v)}
              />
              <DatePicker
                label="End time"
                slotProps={{
                  textField: { fullWidth: true },
                  popper: {
                    sx: {
                      "& .MuiPaper-root": {
                        backgroundColor: "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(8px)",
                      },
                    },
                  },
                }}
                value={endTime ?? null}
                onChange={(v) => setEndTime(v)}
              />
            </Stack>
          </LocalizationProvider>

          {/* license */}
          <Autocomplete
            id="license"
            options={licenses}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(o, v) => o.label === v.label}
            fullWidth
            onChange={(e, v) => setSelectedLicense(v)}
            renderInput={(params) => (
              <TextField {...params} label="License" />
            )}
          />

          {/* editions / royalty */}
          <Stack direction="row" spacing={4}>
            <TextField
              id="mintingTokenQty"
              label="Editions"
              type="number"
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 1 }}
              value={mintingTokenQty}
              onChange={(e) => setMintingTokenQty(Number(e.target.value))}
            />
            <TextField
              id="royalty"
              label="Royalty (10-25%)"
              type="number"
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 10, max: 25 }}
              value={royaltyPercentage}
              onChange={(e) => setRoyaltyPercentage(Number(e.target.value))}
            />
          </Stack>

          {/* royalty sharing */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(e) => {
                    if (e.target.checked) {
                      const arr = [
                        { id: 0, address: walletAddress, share: 100 },
                      ];
                      setRoyaltiesSharer(arr);
                    }
                    setUseRoyaltiesShare(e.target.checked);
                  }}
                  value={useRoyaltiesShare}
                />
              }
              label="Apply royalty sharing"
            />
          </Box>
          {useRoyaltiesShare && (
            <Sharer
              type="RoyaltiesShare"
              sharers={royaltiesSharers}
              maxSharer="10"
              handleSetSharer={setRoyaltiesSharer}
            />
          )}

          {/* wallet */}
          <TextField
            inputRef={walletRef}
            id="walletAddress"
            label="Wallet Address"
            fullWidth
            value={address}
          />

          {/* file + display + x-directory */}
          <Box>
            <Button
              id="myfile"
              component="label"
              variant="outlined"
              tabIndex={-1}
            >
              Upload file
              <VisuallyHiddenInput
                type="file"
                accept={ACCEPT_EXTS}
                onChange={handleFileUpload}
              />
            </Button>

            {file && (
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.6 }}>
                {file.name}
              </Typography>
            )}

            {/* ZIP → 顯示 x-directory 切換 */}
            {fileKind?.isZip && (
              <FormControlLabel
                sx={{ mt: 2, display: "block" }}
                control={
                  <Checkbox
                    checked={isXDirectory}
                    onChange={(e) => setIsXDirectory(e.target.checked)}
                  />
                }
                label="This ZIP is an HTML site (x-directory)"
              />
            )}

            {/* 非圖片 → 要求縮圖 */}
            {file && !fileKind?.isImage && (
              <Box mt={3}>
                <Button
                  id="display"
                  component="label"
                  variant="outlined"
                  tabIndex={-1}
                >
                  Upload display
                  <VisuallyHiddenInput
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={handleDisplayChange}
                  />
                </Button>
                {display && (
                  <Typography variant="body2" sx={{ mt: 2, opacity: 0.6 }}>
                    {display.name}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* submit */}
          <Box pt={4}>
            <Button
              variant="contained"
              size="large"
              onClick={upload}
              disabled={
                !file || (!!file && !classifyFile(file).isImage && !display)
              }
            >
              Mint
            </Button>
            {miningInProgress && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Mining in progress...
              </Typography>
            )}
          </Box>
        </Stack>
      </Container>
    </>
  );
}

export async function getServerSideProps() {
  const [organizers, artists, cities, eventsRes] = await Promise.all([
    FetchDirectusData(`/organizers`),
    FetchDirectusData(`/artists`),
    fetchCities().catch(() => []),
    FetchDirectusData(`/events`),
  ]);
  const events = eventsRes?.data?.filter((e) => e.status === "published") || [];
  return { props: { organizers, artists, cities, events } };
}
