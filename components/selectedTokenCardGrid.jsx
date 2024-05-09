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
  textAlign: "center",
  boxShadow: "none",
}));

export default function SelectedTokenCardGrid({ data }) {
  return (
    <>
      <Grid container spacing={4} columns={{ xs: 4, sm: 8, md: 12 }}>
        {data &&
          data.map(
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
                    href="/event/[contract]/[tokenId]"
                    as={`/event/${contract}/${tokenId}`}
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
                        <Typography
                          gutterBottom
                          variant="body2"
                          component="div"
                        >
                          {name}
                        </Typography>
                        <Typography
                          gutterBottom
                          variant="body2"
                          color="text.secondary"
                        >
                          Edition of {amount}
                        </Typography>
                        <Box sx={{ fontSize: "12px", color: "text.secondary" }}>
                          {/* <Box>
                              {creators &&
                                creators.map((creator, index) => (
                                  <Box key={index} ml={0}>
                                    {creator}
                                  </Box>
                                ))}
                            </Box> */}
                          <Box
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {creators[0]}
                          </Box>
                        </Box>
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
