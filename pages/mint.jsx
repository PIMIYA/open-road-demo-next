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

import { fetchCities, fetchVenues } from "@/lib/map-api";  // used for event→venue resolution
import ButtonSpinner from "@/components/ButtonSpinner";
import { useT } from "@/lib/i18n/useT";

/* Kairos */
import { useConnection } from "@/packages/providers";

/* Components */
import { Sharer } from "@/components/sharer";

// List value of categories, tags, and licenses
import {
  licenses,
  VisuallyHiddenInput,
} from "@/components/mint/const";

import { FetchDirectusData } from "@/lib/api";
import { MAP_SERVER } from "@/lib/map-api";

const ACCEPT_EXTS =
  ".bmp,.gif,.jpg,.jpeg,.png,.svg,.webp," +
  ".mp4,.ogv,.mov,.webm," +
  ".glb,.gltf," +
  ".mp3,.oga," +
  ".pdf,.zip";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

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

export default function Mint({ organizers, artists, events }) {
  const t = useT();
  const router = useRouter();

  // Event selection → auto-resolves venue and city
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [resolvedVenue, setResolvedVenue] = useState(null); // { id, name, lat, lng }
  const [resolvedCity, setResolvedCity] = useState(null);   // { slug, ... }
  const [venueError, setVenueError] = useState(null);

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

  const titleRef = useRef();
  const titleEnRef = useRef();
  const descriptionRef = useRef();
  const descriptionEnRef = useRef();
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
  const [fileSizeError, setFileSizeError] = useState(null);
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

  // Auto-resolve venue and city when event changes
  useEffect(() => {
    if (!selectedEvent || !selectedEvent.venue_id) {
      setResolvedVenue(null);
      setResolvedCity(null);
      setVenueError(selectedEvent ? "此活動尚未設定場館" : null);
      return;
    }
    setVenueError(null);

    // Find venue across all cities
    (async () => {
      try {
        const allCities = await fetchCities();
        for (const city of allCities) {
          const venues = await fetchVenues(city.slug);
          const match = venues.find((v) => v.id === selectedEvent.venue_id);
          if (match) {
            setResolvedVenue(match);
            setResolvedCity(city);
            return;
          }
        }
        setVenueError("找不到此活動的場館資料");
      } catch (err) {
        console.error("Failed to resolve venue:", err);
        setVenueError("無法取得場館資料");
      }
    })();
  }, [selectedEvent]);

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

  if (isLoadingRole) return <p>{t.common.loading}</p>;
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
    if (f.size > MAX_FILE_SIZE) {
      setFileSizeError(t.mint.fileTooLarge || `File exceeds 100 MB limit (${(f.size / 1024 / 1024).toFixed(1)} MB)`);
      setFile(undefined);
      setFileKind(null);
      e.target.value = "";
      return;
    }
    setFileSizeError(null);
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
      data.append("title_en", titleEnRef.current.value || "");
      data.append("description", descriptionRef.current.value || "");
      data.append("description_en", descriptionEnRef.current.value || "");

      // Organizer: wallet address array
      const organizerAddresses = selectedOrganizer
        ? selectedOrganizer.map((o) => o.address).filter(Boolean)
        : [];
      data.append("organizer", JSON.stringify(organizerAddresses));

      // Artists: names for display metadata
      const resultArtists = (selectedArtists || []).map((a) => a.name);
      data.append("artists", JSON.stringify(resultArtists));

      // Creators: artists wallet addresses (required for on-chain)
      const artistAddresses = (selectedArtists || []).map((a) => a.address).filter(Boolean);
      data.append("creators", JSON.stringify(artistAddresses));

      data.append("category", selectedCategory?.label || "");

      const resultTags = (selectedTags || []).map((t) => t.label);
      data.append("tags", JSON.stringify(resultTags));

      // Location (auto-resolved from event)
      data.append("city_slug", resolvedCity?.slug || "");
      data.append("venue_id", resolvedVenue?.id || "");
      data.append(
        "geoLocation",
        resolvedVenue
          ? JSON.stringify([resolvedVenue.lat, resolvedVenue.lng])
          : ""
      );

      // Time (ISO string with timezone; backend converts to UTC)
      data.append("startTime", startTime ? startTime.toISOString() : "");
      data.append("endTime", endTime ? endTime.toISOString() : "");

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

        const contractCallDetails = {
          contractId,
          tokenQty: mintingTokenQty,
          creators: [createrAddress],  // recipient = 開路地址，token 送到開路
          tokens: metadataHashes,
        };

        try {
          const opHash = await callcontract(contractCallDetails);
          console.log("Operation successful with hash:", opHash);

          // Query TzKT for the token_id from the mint operation
          let tokenId = null;
          try {
            // Wait briefly for TzKT indexer to catch up after confirmation
            await new Promise((r) => setTimeout(r, 3000));
            const tzktRes = await fetch(
              `https://api.tzkt.io/v1/tokens/transfers?transactionId.null&sort.desc=id&limit=1&contract=${contractAddress}`
            );
            if (!tzktRes.ok) throw new Error(`TzKT ${tzktRes.status}`);
            // Fallback: query by operation hash
            const transfersRes = await fetch(
              `https://api.tzkt.io/v1/operations/${opHash}`
            );
            if (transfersRes.ok) {
              const ops = await transfersRes.json();
              // Find the internal operation that has a token transfer (diffs with token_id)
              for (const op of ops) {
                const diffs = op.diffs || [];
                for (const diff of diffs) {
                  if (
                    diff.content?.key != null &&
                    diff.path === "token_metadata"
                  ) {
                    tokenId = String(diff.content.key);
                    break;
                  }
                }
                if (tokenId) break;
              }
            }
            console.log("Resolved token_id from TzKT:", tokenId);
          } catch (tzktErr) {
            console.warn("Could not resolve token_id from TzKT:", tzktErr);
          }

          // Sync to kairos-map-server in background
          const syncPayload = {
            token_id: tokenId,
            title: titleRef.current.value || "",
            title_en: titleEnRef.current.value || "",
            description: descriptionRef.current.value || "",
            description_en: descriptionEnRef.current.value || "",
            event_id: selectedEvent?.id || "",
            city_slug: resolvedCity?.slug || "",
            venue_id: resolvedVenue?.id || "",
            geoLocation: resolvedVenue
              ? [resolvedVenue.lat, resolvedVenue.lng]
              : null,
            organizer: selectedOrganizer
              ? selectedOrganizer.map((o) => o.address).filter(Boolean)
              : [],
            startTime: startTime ? startTime.toISOString() : "",
            endTime: endTime ? endTime.toISOString() : "",
            category: selectedCategory?.label || "",
            tags: (selectedTags || []).map((t) => t.label),
            creators: (selectedArtists || []).map((a) => a.address).filter(Boolean),
            thumbnailUri: null, // will be resolved from on-chain metadata by nft-sync
          };

          fetch(`${MAP_SERVER}/api/nfts-sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(syncPayload),
          })
            .then((r) => r.json())
            .then((d) => console.log("Map sync OK:", d))
            .catch((e) => console.error("Map sync failed:", e));
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
              <TextField {...params} label={t.mint.event} />
            )}
          />
          <TextField
            inputRef={titleRef}
            id="title"
            label={t.mint.title}
            fullWidth
            required
          />
          <TextField
            inputRef={titleEnRef}
            id="title_en"
            label={t.mint.titleEn || "Title (English)"}
            fullWidth
          />
          <TextField
            id="description"
            inputRef={descriptionRef}
            label={t.mint.description}
            multiline
            minRows={4}
            maxRows={12}
            fullWidth
          />
          <TextField
            id="description_en"
            inputRef={descriptionEnRef}
            label={t.mint.descriptionEn || "Description (English)"}
            multiline
            minRows={4}
            maxRows={12}
            fullWidth
          />
          <Autocomplete
            multiple
            id="organizer"
            options={organizers.data.filter((o) => o.status === "published")}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            fullWidth
            onChange={(e, v) => setSelectedOrganizer(v)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.name}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label={t.mint.organizer} required />
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
              <TextField {...params} label={t.mint.artists} required />
            )}
          />
          <Autocomplete
            id="categoriy"
            options={t.mintCategories}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(o, v) => o.label === v.label}
            fullWidth
            onChange={(e, v) => setSelectedCategory(v)}
            renderInput={(params) => (
              <TextField {...params} label={t.mint.category} />
            )}
          />
          <Autocomplete
            multiple
            id="tag"
            options={t.mintTags}
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
              <TextField {...params} label={t.mint.tag} />
            )}
          />
          {/* Location: auto-resolved from event */}
          {venueError && (
            <Typography variant="body2" color="error">{venueError}</Typography>
          )}
          {resolvedVenue && resolvedCity && (
            <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {t.mint.venue || "Venue"}: {resolvedVenue.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>
                {resolvedCity.name_zh || resolvedCity.slug} · lat: {resolvedVenue.lat} lng: {resolvedVenue.lng}
              </Typography>
            </Box>
          )}

          {/* time */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction="row" spacing={4}>
              <DatePicker
                label={t.mint.startTime}
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
                label={t.mint.endTime}
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
              <TextField {...params} label={t.mint.license} />
            )}
          />

          {/* editions / royalty */}
          <Stack direction="row" spacing={4}>
            <TextField
              id="mintingTokenQty"
              label={t.mint.editions}
              type="number"
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 1 }}
              value={mintingTokenQty}
              onChange={(e) => setMintingTokenQty(Number(e.target.value))}
            />
            <TextField
              id="royalty"
              label={t.mint.royalty}
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
              label={t.mint.applyRoyalty}
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
            label={t.mint.walletAddress}
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
              {t.mint.uploadFile}
              <VisuallyHiddenInput
                type="file"
                accept={ACCEPT_EXTS}
                onChange={handleFileUpload}
              />
            </Button>

            {file && (
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.6 }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </Typography>
            )}
            {fileSizeError && (
              <Typography variant="body2" sx={{ mt: 1, color: "var(--brand-secondary)" }}>
                {fileSizeError}
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
                label={t.mint.zipIsHtml}
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
                  {t.mint.uploadDisplay}
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
                miningInProgress ||
                !file ||
                (!!file && !classifyFile(file).isImage && !display) ||
                !selectedEvent ||
                !selectedArtists?.length ||
                !selectedOrganizer?.length ||
                !!venueError
              }
            >
              {miningInProgress && <ButtonSpinner color="#fff" />}
              {miningInProgress ? t.mint.minting : t.mint.mintButton}
            </Button>
          </Box>
        </Stack>
      </Container>
    </>
  );
}

export async function getServerSideProps() {
  const [organizers, artists, eventsRes] = await Promise.all([
    FetchDirectusData(`/organizers`),
    FetchDirectusData(`/artists`),
    FetchDirectusData(`/events`),
  ]);
  const events = eventsRes?.data?.filter((e) => e.status === "published") || [];
  return { props: { organizers, artists, events } };
}
