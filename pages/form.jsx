// MUI + Google Maps Places Autocomplete
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Autocomplete from "@mui/material/Autocomplete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import parse from "autosuggest-highlight/parse";
import { debounce } from "@mui/material/utils";
import { useState, useEffect, useRef, useMemo } from "react";
// MUI
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Container from "@mui/material/Container";
// Get the lat and lng from the address
import { getGeocode, getLatLng } from "use-places-autocomplete";

// Kairos
import { useConnection } from "@/packages/providers";

// Custom styles for the file upload button and hide the input
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const theme = createTheme({
  palette: {
    primary: {
      main: "rgba(0,0,0,0.87)",
    },
  },
});

// MUI + Google Maps Places Autocomplete
const GOOGLE_MAPS_API_KEY = `${process.env.GoogleMapsAPIKey}`;
console.log(GOOGLE_MAPS_API_KEY);

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

export default function Form() {
  // Ref for the Google Maps Places Autocomplete service
  const autocompleteService = useRef(null);
  // State variables for places autocomplete
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const loaded = useRef(false);
  // State variables for lat and lng
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [placePrediction, setPlacePrediction] = useState(null);


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
        console.log("Request:", request);
        console.log("Autocomplete Service:", autocompleteService.current);
        if (
          autocompleteService.current &&
          typeof autocompleteService.current.getPlacePredictions === "function"
        ) {
          autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              // Store the first prediction in state
              setPlacePrediction(predictions[0]);
            }
            callback(predictions, status);
          });
        }
      }, 400),
    []
  );

  let pinningMetadata = false;
  let mintingToken = false;
  const serverUrl = "http://localhost:3030";
  const contractAddress = "KT1Aq4wWmVanpQhq4TTfjZXB5AjFpx15iQMM";
  const contractId = 91040; //正式版kairos = 91087
  const { address, callcontract } = useConnection();

  const userAddress = address;

  const titleRef = useRef();
  const descriptionRef = useRef();
  const fileRef = useRef();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [license, setLicense] = useState("All rights reserved");
  const [mintingTokenQty, setMintingTokenQty] = useState(1);
  const [royaltyPercentage, setRoyaltyPercentage] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");

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
      data.append("title", titleRef.current.value);
      data.append("description", descriptionRef.current.value);
      data.append("category", selectedCategory.label);

      //solve ugly data tags
      const transformedData = tags.reduce((acc, { main, sub }) => {
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
      data.append("tags", JSON.stringify(beautyResult));

      // Append the lat and lng to the FormData instance
      const geolocation = [lat, lng];
      data.append("geolocation", geolocation);

      // Append the creator address to the FormData instance
      data.append("creator", userAddress);

      // Append the minter address to the FormData instance
      data.append("minter", contractAddress);

      // Append the minting tool to the FormData instance
      const mintingTool = "https://kairos-mint.art/mint";
      data.append("mintingTool", mintingTool);

      // Append the copyright to the FormData instance,
      // No license/All rights reserved
      // CC0 public (Public Domain)
      // CC BY (Attribution)
      // CC BY-SA (Attribution-ShareAlike)
      const right = "All rights reserved";
      data.append("right", right);

      // Append the royalties to the FormData instance
      const royalties = {
        decimals: 4,
        shares: { [userAddress]: 1000 },
      };
      // {
      //   "decimals": 4,
      //   "shares": {
      //   "tz1VcC6FbCHbiPRLGM1ahVPZwzRvmoUvuSRL": 1000,
      //   "tz1VcC6FbCHbiPRLGM1ahVPZwzRvmoUvuSRL": 1000
      // }
      // {"tz1VcC6FbCHbiPRLGM1ahVPZwzRvmoUvuSRL": 1000} 1000 = 10%
      // decimals: 4
      data.append("royalties", royalties);

      // Append the rights to the FormData instance
      const rights = "All rights reserved";
      data.append("rights", rights);

      // Append the file to the FormData instance
      if (fileRef.current.files[0]) {
        data.append("image", fileRef.current.files[0]);
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

      // // Parse the JSON response
      if (response) {
        const data = await response.json();
        console.log(data);
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

          const creators = [userAddress];

          const contractCallDetails = {
            contractId: contractId,
            tokenQty: mintingTokenQty,
            creators: creators,
            tokens: metadataHashes,
          };

          console.log(mintingTokenQty); 

          try {
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
      pinningMetadata = false;
      mintingToken = false;
    }
  };


  useEffect(() => {
    let active = true;

    if (window.google && window.google.maps && window.google.maps.places) {
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
  }, [value, inputValue, fetchPlacePredictions]);

  return (
    <>
      <Container maxWidth="lg">
        <Box
          component="form"
          sx={{
            "& > :not(style)": { m: 1, width: "25ch" },
          }}
          noValidate
          autoComplete="off"
        >
          <Box>
            <TextField
              inputRef={titleRef}
              id="title"
              label="Title"
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
              disablePortal
              id="categoriy"
              options={categories}
              getOptionLabel={(option) => option.label}
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
              // disablePortal
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
                typeof option === "string" ? option : option.description
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
          <Box pt={3}>
            <select
              id="license"
              name="license"
              value={license}
              onChange={(event) => setLicense(event.target.value)}
            >
              <option value="All rights reserved">All rights reserved</option>
              <option value="CC0 public (Public Domain)">
                CC0 public (Public Domain)
              </option>
              <option value="CC BY (Attribution)">CC BY (Attribution)</option>
              <option value="CC BY-SA (Attribution-ShareAlike)">
                CC BY-SA (Attribution-ShareAlike)
              </option>
            </select>
          </Box>
          <Box pt={3}>
            <TextField
              id="mintingTokenQty"
              label="Editions"
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              inputProps={{
                min: 1,
              }}
              value={mintingTokenQty}
              onChange={(event) =>
                setMintingTokenQty(Number(event.target.value))
              }
            />
          </Box>
          <Box pt={3}>
            <input
              type="range"
              label="royaltyPercentage"
              id="royaltyPercentage"
              name="royaltyPercentage"
              min="0"
              max="100"
              value={royaltyPercentage}
              onChange={(event) =>
                setRoyaltyPercentage(Number(event.target.value ** 100))
              }
            />
            <input
              type="text"
              label="walletAddress"
              id="walletAddress"
              name="walletAddress"
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
            />
          </Box>
          <Box pt={3}>
            <ThemeProvider theme={theme}>
              <Button
                id="thumbnail"
                component="label"
                role={undefined}
                variant="outlined"
                tabIndex={-1}
                color="primary"
              >
                Upload file
                <VisuallyHiddenInput type="file" ref={fileRef} />
              </Button>
            </ThemeProvider>
          </Box>
          <Box pt={3}>
            <Button variant="contained" color="primary" onClick={upload}>
              Mint
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
}

const categories = [
  { label: "Performance" },
  { label: "Exhibition" },
  { label: "Concert" },
  { label: "Festival" },
  { label: "Other" },
];

const tags = [
  { main: "Visual", sub: "Painting" },
  { main: "Visual", sub: "Installation" },
  { main: "Visual", sub: "Sculpture" },
  { main: "Visual", sub: "Photography" },
  { main: "Performance", sub: "Circus" },
  { main: "Performance", sub: "Musical" },
  { main: "Design", sub: "Interactive" },
  { main: "Design", sub: "Graphic" },
];
