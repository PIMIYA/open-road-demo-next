// page for minting new tokens

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
  // State variables for places autocomplete
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const loaded = useRef(false);
  // State variables for lat and lng
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

  const fetch = useMemo(
    () =>
      debounce((request, callback) => {
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 400),
    []
  );

  useEffect(() => {
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

    fetch({ input: inputValue }, (results) => {
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
  }, [value, inputValue, fetch]);

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
              id="title"
              label="Title"
              variant="standard"
              sx={{ width: 300 }}
            />
          </Box>
          <Box>
            <TextField
              id="description"
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
                <VisuallyHiddenInput type="file" />
              </Button>
            </ThemeProvider>
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
