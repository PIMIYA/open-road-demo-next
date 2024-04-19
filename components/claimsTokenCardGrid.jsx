import { useState, useEffect, useMemo } from "react";
/* NEXT */
import Link from "next/link";
/* MUI */
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Unstable_Grid2";
/* MUI - card */
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";

/* stack Item setting */
const Item = styled(Paper)(({ theme }) => ({
  textAlign: "center",
  boxShadow: "none",
}));

export default function ClaimsTokenCardGrid({ claims }) {
  const myclaim = claims.claims.map((claim) => {
    let result = {
      poolUid: claim.poolUid,
      poolid: claim.poolUid.split("-").pop(),
      contact: claim.poolUid.split("-").shift(),
      poolURL: claim.poolUid
        .split("-")
        .shift()
        .concat("/", claim.poolUid.split("-").pop()),
      tokenURL: claim.tokenUid
        .split("-")
        .shift()
        .concat("/", claim.tokenUid.split("-").pop()),
    };
    return result;
  });

  /*** array poolURL to do api route ***/
  // const claimURLs = myclaim.map((m) => {
  //   return m.poolURL;
  // });

  // useMemo to avoid re-render
  const claimTokenURLs = useMemo(() => {
    return myclaim.map(c => c.tokenURL)
  }, [claims]);

  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(true);

  /*** API ROUTE : using POST to send poolURLs to api/walletRecords, and then get back all data by poolid after client side fetching ***/
  useEffect(() => {
    fetch("/api/walletRecords", {
      method: "POST",
      body: claimTokenURLs,
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, [claimTokenURLs]);

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>No profile data</p>;
  // console.log(data);

  return (
    <>
      <Box pb={2} pt={0}>
        透過akaDrop得到的token:
      </Box>
      <Box>
        <Grid container spacing={4} columns={{ xs: 4, sm: 8, md: 12 }}>
          {data &&
            data.data.map(
              ({ id, thumbnailUri, contract, name, createTime, tokenId }) => (
                <Grid key={tokenId} xs={4} sm={4} md={4}>
                  <Item>
                    {/* <Link
                      href="/claimsToken/[contract]/[tokenId]"
                      as={`/claimsToken/${contract}/${tokenId}`}
                    > */}
                    <Link
                      href={{
                        pathname: `/claimsToken/[contract]/[tokenId]`,
                        query: { contract: contract, tokenId: tokenId },
                      }}
                      as="/claimsToken"
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
                            {contract}
                          </Typography>
                          <Typography gutterBottom variant="body2" color="div">
                            {name}
                          </Typography>
                          <Typography
                            gutterBottom
                            variant="body2"
                            color="text.secondary"
                          >
                            {createTime}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Link>
                  </Item>
                </Grid>
              )
            )}
        </Grid>
      </Box>
    </>
  );
}
