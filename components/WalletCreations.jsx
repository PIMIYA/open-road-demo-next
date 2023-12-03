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

export default function WalletCreations({ creations }) {
  return (
    <>
      <Box pb={2}>Creations of the address: </Box>
      <Grid container spacing={4} columns={{ xs: 4, sm: 8, md: 12 }}>
        {creations &&
          creations.tokens.map(
            ({
              contract,
              tokenId,
              amount,
              name,
              tags,
              mimeType,
              thumbnailUri,
            }) => (
              <Grid key={tokenId} xs={4} sm={4} md={4}>
                <GridItem>
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
                        color="text.secondary"
                      >
                        contract: {contract}
                      </Typography>
                      <Typography
                        gutterBottom
                        variant="body2"
                        color="text.secondary"
                      >
                        name: {name}
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
                        {tags}
                      </Typography>
                      <Typography
                        gutterBottom
                        variant="body2"
                        color="text.secondary"
                      >
                        edition: {amount}
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

/* <>               
{creations &&
    creations.tokens.map(({ idx, contract, tokenId, amount, name, tag, mimeType }) => (
        <Box key={tokenId} >
            <Stack direction={{xs: "column", md: "row"}} spacing={4}>
                <Item sx={{
                    width: { xs: "100%", md: "50%" },
                    height: { xs: "auto", md: "auto" },
                }}>
                    <Box p={2}>
                        <Box pb={2}>creations of the address</Box>
                        <Box>contract: {contract}</Box>
                        <Box>tokenId: {tokenId}</Box>
                        <Box>name: {name}</Box>
                        <Box>amount: {amount}</Box>
                        <Box>tag: {tag}</Box>
                        <Box>mimeTypes: {mimeType}</Box>
                    </Box>
                </Item>
            </Stack>
        </Box>
))}
</> */
