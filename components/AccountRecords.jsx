/* MUI */
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Unstable_Grid2";
/* MUI - card */
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

/* stack Item setting */
const Item = styled(Paper)(({ theme }) => ({
  //...theme.typography.body2,
  // paddingLeft: theme.spacing(0),
  // paddingRight: theme.spacing(0),
  textAlign: "left",
  // color:"rgb(0,0,0,0.87)",
  // background: "red",
  boxShadow: "none",
}));

/* Style Grid Item */
const GridItem = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

export default function AccountRecords({ records }) {
  return (
    <>
      <Box pb={2}>Records of an account: </Box>
      <Grid container spacing={4} columns={{ xs: 4, sm: 8, md: 12 }}>
        {records &&
          records.records.map(
            ({
              contract,
              tokenId,
              tokenName,
              amount,
              type,
              timestamp,
              tokenThumbnailUri,
            }) => (
              <Grid key={timestamp} xs={4} sm={4} md={4}>
                <GridItem>
                  <Card sx={{ maxWidth: 380 }}>
                    <CardMedia
                      component="img"
                      alt="token Thumbnail"
                      height="140"
                      image={`https://assets.akaswap.com/ipfs/${tokenThumbnailUri.replace(
                        "ipfs://",
                        ""
                      )}`}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="body2" component="div">
                        timestamp: {timestamp}
                      </Typography>
                      <Typography
                        gutterBottom
                        variant="body2"
                        color="text.secondary"
                      >
                        contract: {contract}
                      </Typography>
                      <Typography
                        gutterBottom
                        variant="body2"
                        color="text.secondary"
                      >
                        tokenName: {tokenName}
                      </Typography>
                      <Typography
                        gutterBottom
                        variant="body2"
                        color="text.secondary"
                      >
                        tokenId: {tokenId}
                      </Typography>
                      <Typography
                        gutterBottom
                        variant="body2"
                        color="text.secondary"
                      >
                        type: {type}
                      </Typography>
                      <Typography
                        gutterBottom
                        variant="body2"
                        color="text.secondary"
                      >
                        amount: {amount}
                      </Typography>
                    </CardContent>
                  </Card>
                </GridItem>
              </Grid>
            )
          )}
      </Grid>
    </>
  );
}
