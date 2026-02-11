import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
  Slider,
  LinearProgress,
  Divider,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { brandColors, borderOpacity } from '@/styles/theme';

export default function DemoPage() {
  const [selectValue, setSelectValue] = useState('option1');
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('radio1');
  const [switchChecked, setSwitchChecked] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <Box sx={{ minHeight: '100vh', py: 12 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 16, textAlign: 'center' }}>
          <Typography variant="h1" sx={{ mb: 4 }}>
            Design System
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.6, maxWidth: 600, mx: 'auto' }}>
            Wire-style MUI components implementing the Kairos design language.
            All components use square corners, uppercase labels, and the brand color palette.
          </Typography>
        </Box>

        {/* Color Palette Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Color Palette
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 4 }}>
            {Object.entries(brandColors).map(([name, color]) => (
              <Box
                key={name}
                sx={{
                  border: `1px solid ${brandColors.primary}${borderOpacity.light}`,
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    height: 80,
                    backgroundColor: color,
                    mb: 3,
                    border: `1px solid ${brandColors.primary}${borderOpacity.light}`,
                  }}
                />
                <Typography variant="overline" sx={{ display: 'block' }}>
                  {name.toUpperCase()}
                </Typography>
                <Typography variant="mono" sx={{ opacity: 0.6 }}>
                  {color}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Typography Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Typography
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Stack spacing={4}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 1, display: 'block' }}>H1 - 32PX</Typography>
              <Typography variant="h1">Heading One</Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 1, display: 'block' }}>H2 - 24PX</Typography>
              <Typography variant="h2">Heading Two</Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 1, display: 'block' }}>H3 - 18PX</Typography>
              <Typography variant="h3">Heading Three</Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 1, display: 'block' }}>H4 - 14PX</Typography>
              <Typography variant="h4">Heading Four</Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 1, display: 'block' }}>BODY1 - 14PX</Typography>
              <Typography variant="body1">
                Body text for primary content. Uses light weight (300) for readability.
              </Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 1, display: 'block' }}>BODY2 - 13PX</Typography>
              <Typography variant="body2">
                Secondary body text for supporting content.
              </Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 1, display: 'block' }}>CAPTION - 10PX</Typography>
              <Typography variant="caption">Caption text for annotations</Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 1, display: 'block' }}>OVERLINE - 10PX</Typography>
              <Typography variant="overline">Overline label text</Typography>
            </Box>
          </Stack>
        </Box>

        {/* Buttons Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Buttons
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Stack spacing: 6>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>CONTAINED</Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Button variant="contained" size="small">Small</Button>
                <Button variant="contained">Default</Button>
                <Button variant="contained" size="large">Large</Button>
                <Button variant="contained" size="extraLarge">Extra Large</Button>
              </Stack>
            </Box>

            <Box sx={{ mt: 6 }}>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>OUTLINED</Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" size="small">Small</Button>
                <Button variant="outlined">Default</Button>
                <Button variant="outlined" size="large">Large</Button>
                <Button variant="outlined" size="extraLarge">Extra Large</Button>
              </Stack>
            </Box>

            <Box sx={{ mt: 6 }}>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>TEXT</Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Button variant="text" size="small">Small</Button>
                <Button variant="text">Default</Button>
                <Button variant="text" size="large">Large</Button>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Input Fields Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Input Fields
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 6 }}>
            <TextField label="Text Field" placeholder="Enter text..." />
            <TextField label="With Value" defaultValue="Sample text" />
            <TextField label="Disabled" disabled defaultValue="Disabled input" />
            <TextField label="Multiline" multiline rows={3} placeholder="Enter multiple lines..." />
          </Box>
        </Box>

        {/* Dropdown Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Dropdown Select
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Select Option</InputLabel>
              <Select
                value={selectValue}
                label="Select Option"
                onChange={(e) => setSelectValue(e.target.value)}
              >
                <MenuItem value="option1">Option One</MenuItem>
                <MenuItem value="option2">Option Two</MenuItem>
                <MenuItem value="option3">Option Three</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Tags/Chips Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Tags / Chips
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Box>
            <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>OUTLINED</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 6 }}>
              <Chip label="Tag One" variant="outlined" />
              <Chip label="Tag Two" variant="outlined" />
              <Chip label="Tag Three" variant="outlined" />
              <Chip label="Deletable" variant="outlined" onDelete={() => {}} />
            </Stack>

            <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>FILLED</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Chip label="Tag One" />
              <Chip label="Tag Two" />
              <Chip label="Tag Three" />
              <Chip label="Deletable" onDelete={() => {}} />
            </Stack>
          </Box>
        </Box>

        {/* Cards Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Cards
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 3 }}>Card Title</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Card content with wire-style borders. Square corners and subtle
                  hover effects maintain the minimal aesthetic.
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="overline" sx={{ opacity: 0.6, mb: 2, display: 'block' }}>Category</Typography>
                <Typography variant="h4" sx={{ mb: 3 }}>Another Card</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 4 }}>
                  Cards can include various content types and maintain
                  consistent spacing throughout.
                </Typography>
                <Button variant="outlined" size="small">Action</Button>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Accordion Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Accordion
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h5">Accordion Item One</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Accordion content area. Wire-style accordions use minimal borders
                  and transparent backgrounds.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h5">Accordion Item Two</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Another accordion panel with consistent styling and spacing.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h5">Accordion Item Three</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Third accordion panel demonstrating the collapsible pattern.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        {/* Selection Controls Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Selection Controls
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>CHECKBOX</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checkboxChecked}
                    onChange={(e) => setCheckboxChecked(e.target.checked)}
                  />
                }
                label="Checkbox option"
              />
            </Box>

            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>RADIO</Typography>
              <RadioGroup
                value={radioValue}
                onChange={(e) => setRadioValue(e.target.value)}
              >
                <FormControlLabel value="radio1" control={<Radio />} label="Option One" />
                <FormControlLabel value="radio2" control={<Radio />} label="Option Two" />
              </RadioGroup>
            </Box>

            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>SWITCH</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={switchChecked}
                    onChange={(e) => setSwitchChecked(e.target.checked)}
                  />
                }
                label="Toggle switch"
              />
            </Box>
          </Box>
        </Box>

        {/* Progress & Sliders Section */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Progress & Sliders
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Stack spacing={8}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>LINEAR PROGRESS</Typography>
              <LinearProgress variant="determinate" value={65} />
            </Box>

            <Box>
              <Typography variant="overline" sx={{ opacity: 0.6, mb: 3, display: 'block' }}>SLIDER</Typography>
              <Slider
                value={sliderValue}
                onChange={(_, value) => setSliderValue(value as number)}
                valueLabelDisplay="auto"
              />
            </Box>
          </Stack>
        </Box>

        {/* Border Opacity Reference */}
        <Box sx={{ mb: 16 }}>
          <Typography variant="h3" sx={{ mb: 6 }}>
            Border Opacity Levels
          </Typography>
          <Divider sx={{ mb: 6 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            <Box sx={{ border: `1px solid ${brandColors.primary}${borderOpacity.light}`, p: 4, textAlign: 'center' }}>
              <Typography variant="overline">Light (20%)</Typography>
              <Typography variant="mono" sx={{ display: 'block', mt: 2, opacity: 0.6 }}>
                {borderOpacity.light}
              </Typography>
            </Box>
            <Box sx={{ border: `1px solid ${brandColors.primary}${borderOpacity.medium}`, p: 4, textAlign: 'center' }}>
              <Typography variant="overline">Medium (40%)</Typography>
              <Typography variant="mono" sx={{ display: 'block', mt: 2, opacity: 0.6 }}>
                {borderOpacity.medium}
              </Typography>
            </Box>
            <Box sx={{ border: `1px solid ${brandColors.primary}${borderOpacity.heavy}`, p: 4, textAlign: 'center' }}>
              <Typography variant="overline">Heavy (60%)</Typography>
              <Typography variant="mono" sx={{ display: 'block', mt: 2, opacity: 0.6 }}>
                {borderOpacity.heavy}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', pt: 8 }}>
          <Divider sx={{ mb: 8 }} />
          <Typography variant="caption" sx={{ opacity: 0.5 }}>
            Kairos Design System - Wire-Style Components
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
