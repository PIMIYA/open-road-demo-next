// React
import { useState, useEffect, useRef, useMemo } from "react";
// Next
import { useRouter } from "next/router";
// MUI
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
// MUI Icons
import LocationOnIcon from "@mui/icons-material/LocationOn";

// MUI + Google Maps Places Autocomplete
import parse from "autosuggest-highlight/parse";
// Get the lat and lng from the address
import { getGeocode, getLatLng } from "use-places-autocomplete";
// Kairos
import { useConnection } from "@/packages/providers";
// Component
import { Sharer } from "@/components/sharer";
import { prepareFilesFromZIP } from "@/components/render-media/html/utils/html";
import { prepareDirectory } from "@/components/mint/prepareDirectory";
// List value of categories, tags, and licenses
import {
  categories,
  tags,
  licenses,
  VisuallyHiddenInput,
  theme,
  MIMETYPE,
} from "@/components/mint/const";

// MUI + Google Maps Places Autocomplete
const GOOGLE_MAPS_API_KEY = `${process.env.GoogleMapsAPIKey}`;
function loadScript(src, position, id) {
  if (!position) {
    return;
  }
  const script = document.createElement("script");
  script.setAttribute("async", "");
  script.setAttribute("id", id);
  script.src = src;
  position.appendChild(script);
}
const autocompleteService = { current: null };

export default function Mint() {
  const router = useRouter();

  // State variables for places autocomplete
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const loaded = useRef(false);
  // State variables for lat and lng
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  // Google autocomplete service
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
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 400),
    []
  );

  // State variables for form
  let pinningMetadata = false;
  let mintingToken = false;
  const serverUrl = process.env.SERVER_URL;
  const contractAddress = "KT1Aq4wWmVanpQhq4TTfjZXB5AjFpx15iQMM";
  const contractId = 92340; // 正式版kairosNFTs = 92340 測試版blackpeople = 91040
  const { address, callcontract } = useConnection();
  const createrAddress = "tz1XBEMJfYoMoMMZafjYv3Q5V9u3QKv1xuBR"; // address, address will be used in the future, now it is a fixed value
  const titleRef = useRef();
  const organizerRef = useRef();
  const descriptionRef = useRef();
  const walletRef = useRef();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [mintingTokenQty, setMintingTokenQty] = useState(1);
  const [royaltyPercentage, setRoyaltyPercentage] = useState(10);
  const [walletAddress, setWalletAddress] = useState(``);
  const [file, setFile] = useState();
  const [thumb, setThumb] = useState();
  const [miningInProgress, setMiningInProgress] = useState(false);
  const [startTime, setStartTime] = useState();
  const [endTime, setEndTime] = useState();
  // royalties share
  const [useRoyaltiesShare, setUseRoyaltiesShare] = useState();
  const [royaltiesSharers, setRoyaltiesSharer] = useState([
    {
      id: 0,
      address: walletAddress,
      share: 100,
    },
  ]);
  // API ROUTE : Fetch wallet role
  const [roleData, setRoleData] = useState(null);
  const [isLoadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    if (!address) {
      return;
    }
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
    if (!autocompleteService.current) {
      return undefined;
    }
    if (inputValue === "") {
      setOptions(value ? [value] : []);
      return undefined;
    }
    fetchPlacePredictions({ input: inputValue }, (results) => {
      if (active) {
        let newOptions = [];
        if (value) {
          newOptions = [value];
        }
        if (results) {
          newOptions = [...newOptions, ...results];
        }
        setOptions(newOptions);
      }
    });
    return () => {
      active = false;
    };
  }, [value, inputValue, fetchPlacePredictions, address]);

  // Fetch wallet role
  if (isLoadingRole) return <p>Loading...</p>;
  if (!roleData) return <p>No role data</p>;
  // console.log(roleData.data.length);
  // Redirect to cannotMint page if the wallet role is not allowed to mint or not connected to wallet
  if (roleData.data.length == 0 || !address) {
    router.push("/cannotMint");
  }

  // function handleFileChange(event) {
  //   console.log("file", file);
  //   setFile(event.target.files[0]);
  // }

  const Buffer = require("buffer").Buffer;
  const handleFileUpload = async (props) => {
    const mimeType = props.target.files[0].type;
    const myFile = props.target.files[0];
    let nftCid;
    if ([MIMETYPE.ZIP, MIMETYPE.ZIP1, MIMETYPE.ZIP2].includes(mimeType)) {
      // console.log("zip file");
      const buffer = Buffer.from(await myFile.arrayBuffer());
      const files = await prepareFilesFromZIP(buffer);
      files.type = "application/x-directory";
      files.name = myFile.name;
      // console.log("files", files);
      // nftCid = await prepareDirectory({ files });
      // console.log("nftCid", nftCid);
      setFile(files);
    } else {
      // console.log("not zip file");
      // console.log("file", myFile);
      setFile(myFile);
    }
  };

  function handleThumbChange(event) {
    // console.log("thumb", thumb);
    setThumb(event.target.files[0]);
  }

  const upload = async (event) => {
    event.preventDefault();
    // Check if the Google Maps Places library is loaded
    if (!autocompleteService.current) {
      console.error("Google Maps Places library is not loaded yet");
      return;
    }
    try {
      pinningMetadata = true;
      // Create a new FormData instance
      const data = new FormData();

      // Append each form field to the FormData instance
      data.append("organizer", organizerRef.current.value);
      data.append("title", titleRef.current.value);
      data.append("description", descriptionRef.current.value);
      data.append("category", selectedCategory.label);

      //solve ugly data tags
      const transformedData = selectedTags.reduce((acc, { main, sub }) => {
        const mainFormatted =
          main.charAt(0).toUpperCase() + main.slice(1).toLowerCase();
        const subFormatted =
          sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
        acc[mainFormatted] = acc[mainFormatted]
          ? [...acc[mainFormatted], subFormatted]
          : [subFormatted];
        return acc;
      }, {});
      const beautyResult = Object.keys(transformedData).map((key) => ({
        [key]: transformedData[key],
      }));

      //tags to list of strings
      let result = [];

      beautyResult.forEach((obj) => {
        for (let key in obj) {
          obj[key].forEach((value) => {
            result.push(`${key}:${value}`);
          });
        }
      });

      data.append("tags", JSON.stringify(result));

      // Append the location name to the FormData instance
      data.append("eventPlace", inputValue);

      // Append the lat and lng to the FormData instance
      const geolocation = [lat, lng];
      data.append("geoLocation", JSON.stringify(geolocation));

      // Append the start time to the FormData instance
      data.append("startTime", startTime);
      data.append("endTime", endTime);

      // Append the creator address to the FormData instance
      data.append("creator", createrAddress);

      // Append the minter address to the FormData instance
      data.append("minter", contractAddress);

      // Append the minting tool to the FormData instance
      data.append("mintingTool", serverUrl);

      // Append the copyright to the FormData instance,
      data.append("rights", selectedLicense.label);

      // Append the royalties to the FormData instance
      const beautyShares = Object.fromEntries(
        royaltiesSharers.map((sharer) => [
          sharer.address,
          royaltyPercentage * sharer.share,
        ])
      );
      // console.log(beautyShares);
      // royalties share
      const royalties = {
        decimals: 4,
        shares: beautyShares,
      };
      // royalty not share
      const royalty = {
        decimals: 4,
        shares: { [address]: royaltyPercentage * 100 },
      };

      if (useRoyaltiesShare) {
        data.append("royalties", JSON.stringify(royalties));
      } else {
        data.append("royalties", JSON.stringify(royalty));
      }

      // file
      if (file) {
        data.append("image", file);
      }

      if (thumb) {
        data.append("thumbnail", thumb);
      }

      console.log(data);

      // Make a POST request to the server
      const response = await fetch(`${serverUrl}/mint`, {
        method: "POST",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: data,
      });

      // Parse the JSON response
      if (response) {
        const data = await response.json();
        // console.log(data);
        if (
          data.status === true &&
          data.msg.metadataHash &&
          data.msg.imageHash
        ) {
          pinningMetadata = false;
          mintingToken = true;

          // Minting token
          console.log("Minting token...");

          const metadataHash = `ipfs://${data.msg.metadataHash}`;

          //quick test mint-factory
          //Editions
          const metadataHashes = [metadataHash];

          const creators = [createrAddress, address];

          const contractCallDetails = {
            contractId: contractId,
            tokenQty: mintingTokenQty,
            creators: creators,
            tokens: metadataHashes,
          };

          // console.log(mintingTokenQty);

          try {
            setMiningInProgress(true);
            const opHash = await callcontract(contractCallDetails);
            console.log("Operation successful with hash:", opHash);
          } catch (error) {
            console.error("Error calling contract function:", error);
          }
        } else {
          throw "No IPFS hash";
        }
      } else {
        throw "No response";
      }
    } catch (error) {
      console.log(error);
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
              inputRef={organizerRef}
              id="organizer"
              label="Organizer"
              variant="standard"
              sx={{ width: 300 }}
            />
          </Box>
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
              // disablePortal
              id="categoriy"
              options={categories}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) =>
                option.label === value.label
              }
              sx={{ width: 300 }}
              onChange={(event, newValue) => {
                setSelectedCategory(newValue);
              }}
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
              groupBy={(option) => option.main}
              getOptionLabel={(option) => option.sub}
              sx={{ width: 300 }}
              onChange={(event, newValue) => {
                setSelectedTags(newValue);
              }}
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
                // if there is an input value, get the lat and lng
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
                  matches.map((match) => [
                    match.offset,
                    match.offset + match.length,
                  ])
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
          {/* // If the user selects a location, display the lat and lng */}
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
          <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="start time"
                sx={{ width: 300 }}
                value={startTime ?? null}
                onChange={(newValue) => setStartTime(newValue)}
              />
            </LocalizationProvider>
          </Box>
          <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="end time"
                sx={{ width: 300 }}
                value={endTime ?? null}
                onChange={(newValue) => setEndTime(newValue)}
              />
            </LocalizationProvider>
          </Box>
          <Box>
            <Autocomplete
              // disablePortal
              id="license"
              options={licenses}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) =>
                option.label === value.label
              }
              sx={{ width: 300 }}
              onChange={(event, newValue) => {
                setSelectedLicense(newValue);
              }}
              renderInput={(params) => (
                <TextField {...params} label="License" variant="standard" />
              )}
            />
          </Box>
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
              onChange={(event) =>
                setMintingTokenQty(Number(event.target.value))
              }
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
              onChange={(event) =>
                setRoyaltyPercentage(Number(event.target.value))
              }
            />
          </Box>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(e) => {
                    if (e.target.checked) {
                      let array = [
                        {
                          id: 0,
                          address: walletAddress,
                          share: 100,
                        },
                      ];
                      setRoyaltiesSharer(array);
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
          <Box>
            <ThemeProvider theme={theme}>
              <Button
                id="myfile"
                component="label"
                variant="outlined"
                tabIndex={-1}
              >
                Upload file
                <VisuallyHiddenInput type="file" onChange={handleFileUpload} />
              </Button>
            </ThemeProvider>
            <Box>
              {file ? (
                <Box sx={{ width: 300 }}>
                  <Box component="span">{file.name}</Box>
                </Box>
              ) : null}
            </Box>
            <Box>
              {(file && file.type.startsWith("image/")) || !file ? (
                <></>
              ) : (
                <Box>
                  <ThemeProvider theme={theme}>
                    <Button
                      id="thumbnail"
                      component="label"
                      role={undefined}
                      variant="outlined"
                      tabIndex={-1}
                    >
                      Upload thumbnail
                      <VisuallyHiddenInput
                        type="file"
                        onChange={handleThumbChange}
                      />
                    </Button>
                  </ThemeProvider>
                  <Box>
                    {thumb ? (
                      <Box sx={{ width: 300 }}>
                        <Box component="span">{thumb.name}</Box>
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
          <Box pt={6}>
            <ThemeProvider theme={theme}>
              <Button variant="contained" color="primary" onClick={upload}>
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
