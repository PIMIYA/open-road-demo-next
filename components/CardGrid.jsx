/* MUI */
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
/* MUI - card */
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
/* NEXT */
import Link from "next/link";

/* Style Grid Item */
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

export default function CardGrid({ data }) {
  return (
    <>
      <Grid container spacing={4} columns={{ xs: 4, sm: 8, md: 12 }}>
        {data &&
          data.tokens.map(
            ({
              tokenId,
              name,
              amount,
              creators,
              thumbnailUri,
              tags,
              contract,
            }) => (
              <Grid key={tokenId} xs={4} sm={4} md={4}>
                <Item>
                  <Link
                    href="/tokens/[contract]/[tokenId]"
                    as={`/tokens/${contract}/${tokenId}`}
                  >
                    <Card sx={{ maxWidth: 380 }}>
                      <CardMedia
                        component="img"
                        alt="thumbnail"
                        height="140"
                        image={`https://assets.akaswap.com/ipfs/${thumbnailUri.replace(
                          "ipfs://",
                          ""
                        )}`}
                      />
                      <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                          {name}
                        </Typography>
                        <Typography
                          gutterBottom
                          variant="body2"
                          color="text.secondary"
                        >
                          Edition of {amount}
                        </Typography>
                        <Typography
                          gutterBottom
                          fontSize="12px"
                          color="text.secondary"
                        >
                          {creators &&
                            creators.map((creator, index) => (
                              <Box key={index} component="span">
                                by {creator}
                              </Box>
                            ))}
                        </Typography>
                        <Typography fontSize="12px" color="text.secondary">
                          {tags.length > 0 ? "tags:" : ""}
                          <Box component="span">
                            {tags &&
                              tags.map((tag, index) => (
                                <Box key={index} component="span" ml={1}>
                                  {tag}
                                </Box>
                              ))}
                          </Box>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Link>
                </Item>
              </Grid>
            )
          )}
      </Grid>
    </>
  );
}
