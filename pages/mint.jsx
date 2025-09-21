import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Box,
  TextField,
  Autocomplete,
  Grid,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Container,
} from "@mui/material";
import { debounce } from "@mui/material/utils";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import LocationOnIcon from "@mui/icons-material/LocationOn";

/* MUI + Google Maps Places Autocomplete */
import parse from "autosuggest-highlight/parse";
import { getGeocode, getLatLng } from "use-places-autocomplete";

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
  theme,
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

const GOOGLE_MAPS_API_KEY = `${process.env.GoogleMapsAPIKey}`;
function loadScript(src, position, id) {
  if (!position) return;
  const script = document.createElement("script");
  script.setAttribute("async", "");
  script.setAttribute("id", id);
  script.src = src;
  position.appendChild(script);
}
const autocompleteService = { current: null };

export default function Mint({ organizers, artists }) {
  const router = useRouter();

  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const loaded = useRef(false);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  if (typeof window !== "undefined" && !loaded.current) {
    if (!document.querySelector("#google-maps")) {
      loadScript(
        `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`,
        document.querySelector("head"),
        "google-maps"
      );
    }
    loaded.current = true;
  }

  const fetchPlacePredictions = useMemo(
    () =>
      debounce((request, callback) => {
        if (!autocompleteService.current) return;
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 400),
    []
  );

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

    // Google autocomplete service
    let active = true;
    if (!autocompleteService.current && window.google) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
    }
    if (!autocompleteService.current) return;

    if (inputValue === "") {
      setOptions(value ? [value] : []);
      return;
    }
    fetchPlacePredictions({ input: inputValue }, (results) => {
      if (!active) return;
      let newOptions = [];
      if (value) newOptions = [value];
      if (results) newOptions = [...newOptions, ...results];
      setOptions(newOptions);
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetchPlacePredictions, address]);

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

    if (!autocompleteService.current) {
      console.error("Google Maps Places library is not loaded yet");
      return;
    }
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
      pinningMetadata = true;
      const data = new FormData();

      // Base metadata
      data.append("title", titleRef.current.value || "");
      data.append("description", descriptionRef.current.value || "");
      data.append("organizer", selectedOrganizer?.name || "");

      const resultArtists = (selectedArtists || []).map((a) => a.name);
      data.append("artists", JSON.stringify(resultArtists));
      data.append("category", selectedCategory?.label || "");

      const resultTags = (selectedTags || []).map((t) => t.label);
      data.append("tags", JSON.stringify(resultTags));

      data.append("eventPlace", inputValue || "");
      data.append("geoLocation", JSON.stringify([lat, lng]));
      data.append("startTime", startTime || "");
      data.append("endTime", endTime || "");

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
          setMiningInProgress(true);
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
      <Container maxWidth="lg">
        <Box
          component="form"
          sx={{ "& > :not(style)": { m: 1, width: "25ch" } }}
          noValidate
          autoComplete="off"
        >
          <Box>
            <TextField
              inputRef={titleRef}
              id="title"
              label="Event name"
              variant="standard"
              sx={{ width: 300 }}
            />
          </Box>
          <Box>
            <TextField
              id="description"
              inputRef={descriptionRef}
              label="Description"
              multiline
              maxRows={4}
              variant="standard"
              sx={{ width: 300 }}
            />
          </Box>
          <Box>
            <Autocomplete
              id="organizer"
              options={organizers.data.filter((o) => o.status === "published")}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(o, v) => o.name === v.name}
              sx={{ width: 300 }}
              onChange={(e, v) => setSelectedOrganizer(v)}
              renderInput={(params) => (
                <TextField {...params} label="Organizer" variant="standard" />
              )}
            />
          </Box>
          <Box>
            <Autocomplete
              multiple
              id="artist"
              options={artists.data.filter((o) => o.status === "published")}
              getOptionLabel={(o) => o.name}
              sx={{ width: 300 }}
              onChange={(e, v) => setSelectedArtists(v)}
              renderInput={(params) => (
                <TextField {...params} label="Artists" variant="standard" />
              )}
            />
          </Box>
          <Box>
            <Autocomplete
              id="categoriy"
              options={categories}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(o, v) => o.label === v.label}
              sx={{ width: 300 }}
              onChange={(e, v) => setSelectedCategory(v)}
              renderInput={(params) => (
                <TextField {...params} label="Category" variant="standard" />
              )}
            />
          </Box>
          <Box>
            <Autocomplete
              multiple
              id="tag"
              options={tags}
              getOptionLabel={(o) => o.label}
              sx={{ width: 300 }}
              onChange={(e, v) => setSelectedTags(v)}
              renderInput={(params) => (
                <TextField {...params} label="Tag" variant="standard" />
              )}
            />
          </Box>
          <Box>
            <Autocomplete
              id="google-place-geocode"
              sx={{ width: 300 }}
              getOptionLabel={(option) =>
                typeof option === "string"
                  ? option
                  : option.structured_formatting.main_text
              }
              filterOptions={(x) => x}
              options={options}
              autoComplete
              includeInputInList
              filterSelectedOptions
              value={value}
              noOptionsText="No locations"
              onChange={(event, newValue) => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue);
                if (newValue) {
                  getGeocode({ address: newValue.description }).then(
                    (results) => {
                      const { lat, lng } = getLatLng(results[0]);
                      setLat(lat);
                      setLng(lng);
                    }
                  );
                } else if (newValue === null) {
                  setLat(null);
                  setLng(null);
                }
              }}
              onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add a location"
                  fullWidth
                  variant="standard"
                />
              )}
              renderOption={(props, option) => {
                const matches =
                  option.structured_formatting.main_text_matched_substrings ||
                  [];
                const parts = parse(
                  option.structured_formatting.main_text,
                  matches.map((m) => [m.offset, m.offset + m.length])
                );
                return (
                  <li {...props}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ display: "flex", width: 44 }}>
                        <LocationOnIcon sx={{ color: "text.secondary" }} />
                      </Grid>
                      <Grid
                        item
                        sx={{
                          width: "calc(100% - 44px)",
                          wordWrap: "break-word",
                        }}
                      >
                        {parts.map((part, index) => (
                          <Box
                            key={index}
                            component="span"
                            sx={{
                              fontWeight: part.highlight ? "bold" : "regular",
                            }}
                          >
                            {part.text}
                          </Box>
                        ))}
                        <Typography variant="body2" color="text.secondary">
                          {option.structured_formatting.secondary_text}
                        </Typography>
                      </Grid>
                    </Grid>
                  </li>
                );
              }}
            />
          </Box>

          {/* lat/lng */}
          <Box>
            {lat ? (
              <Box sx={{ width: 300 }}>
                <Box component="span">lat:{lat}</Box>
                <Box component="span" pl={1}>
                  lng:{lng}
                </Box>
              </Box>
            ) : null}
          </Box>

          {/* time */}
          <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="start time"
                sx={{ width: 300 }}
                value={startTime ?? null}
                onChange={(v) => setStartTime(v)}
              />
            </LocalizationProvider>
          </Box>
          <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="end time"
                sx={{ width: 300 }}
                value={endTime ?? null}
                onChange={(v) => setEndTime(v)}
              />
            </LocalizationProvider>
          </Box>

          {/* license */}
          <Box>
            <Autocomplete
              id="license"
              options={licenses}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(o, v) => o.label === v.label}
              sx={{ width: 300 }}
              onChange={(e, v) => setSelectedLicense(v)}
              renderInput={(params) => (
                <TextField {...params} label="License" variant="standard" />
              )}
            />
          </Box>

          {/* editions / royalty */}
          <Box>
            <TextField
              id="mintingTokenQty"
              label="Editions"
              type="number"
              sx={{ width: 300 }}
              InputLabelProps={{ shrink: true }}
              variant="standard"
              inputProps={{ min: 1 }}
              value={mintingTokenQty}
              onChange={(e) => setMintingTokenQty(Number(e.target.value))}
            />
          </Box>
          <Box>
            <TextField
              id="royalty"
              label="Royalty(10-25%)"
              type="number"
              sx={{ width: 300 }}
              InputLabelProps={{ shrink: true }}
              variant="standard"
              inputProps={{ min: 10, max: 25 }}
              value={royaltyPercentage}
              onChange={(e) => setRoyaltyPercentage(Number(e.target.value))}
            />
          </Box>

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
          <Box>
            <Box>
              <TextField
                inputRef={walletRef}
                id="walletAddress"
                label="walletAddress"
                variant="standard"
                sx={{ width: 300 }}
                value={address}
              />
            </Box>
          </Box>

          {/* file + display + x-directory */}
          <Box>
            <ThemeProvider theme={theme}>
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
            </ThemeProvider>

            <Box>
              {file ? (
                <Box sx={{ width: 300 }}>
                  <Box component="span">{file.name}</Box>
                </Box>
              ) : null}
            </Box>

            {/* ZIP → 顯示 x-directory 切換 */}
            {fileKind?.isZip && (
              <FormControlLabel
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
              <Box mt={1}>
                <ThemeProvider theme={theme}>
                  <Button
                    id="display"
                    component="label"
                    role={undefined}
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
                </ThemeProvider>
                <Box>
                  {display ? (
                    <Box sx={{ width: 300 }}>
                      <Box component="span">{display.name}</Box>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            )}
          </Box>

          {/* submit */}
          <Box pt={6}>
            <ThemeProvider theme={theme}>
              <Button
                variant="contained"
                color="primary"
                onClick={upload}
                disabled={
                  !file || (!!file && !classifyFile(file).isImage && !display)
                }
              >
                Mint
              </Button>
              <div>
                {miningInProgress ? <p>Mining in progress...</p> : null}
              </div>
            </ThemeProvider>
          </Box>
        </Box>
      </Container>
    </>
  );
}

export async function getServerSideProps() {
  const [organizers, artists] = await Promise.all([
    await FetchDirectusData(`/organizers`),
    await FetchDirectusData(`/artists`),
  ]);
  return { props: { organizers, artists } };
}
