import { useState, useEffect } from "react";
/* NEXT */
import Link from "next/link";
/* MUI */
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
/* MUI - card */
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
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

export default function PoolsCreationCardGrid({ pools }) {
  /*** orginze poolUid to poolURL for the fetch in api route ***/
  const mypool = pools.pools.map((pool) => {
    let result = {
      poolUid: pool.poolUid,
      poolid: pool.poolUid.split("-").pop(),
      contact: pool.poolUid.split("-").shift(),
      poolURL: pool.poolUid
        .split("-")
        .shift()
        .concat("/", pool.poolUid.split("-").pop()),
    };
    return result;
  });

  /*** testing single poolURL to do api route ***/
  const first_poolURL = mypool[0].poolURL;
  // console.log(first_poolURL);

  /*** testing fake array poolURL to do api route ***/
  const arraytest = [
    "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf/1",
    "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf/1",
  ];

  /*** array poolURL to do api route ***/
  const poolURLs = mypool.map((m) => {
    return m.poolURL;
  });

  // console.log(arraytest);
  // console.log(poolURLs);

  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(true);

  /*** API ROUTE : using POST to send poolURLs to api/walletCreations, and then get back all data by poolid after client side fetching ***/
  useEffect(() => {
    fetch("/api/walletCreations", {
      method: "POST",
      body: poolURLs,
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>No profile data</p>;
  // console.log(data);

  return (
    <>
      <Box pb={2} pt={0}>
        在akaDrop建立過的活動:
      </Box>

      <Box>
        <Grid container spacing={4} columns={{ xs: 4, sm: 8, md: 12 }}>
          {data &&
            data.data.map(({ id, coverUri, contract, name, createTime }) => (
              <Grid key={id} xs={4} sm={4} md={4}>
                <Item>
                  {/* <Link
                    href="/poolsCreation/[contract]/[id]"
                    as={`/poolsCreation/${contract}/${id}`}
                  > */}
                  <Link
                    href={{
                      pathname: "/poolsCreation/[contract]/[id]",
                      query: { contract: contract, id: id },
                    }}
                    as="/poolsCreation"
                  >
                    <Card sx={{ maxWidth: 380 }}>
                      <CardMedia
                        component="img"
                        alt="thumbnail"
                        height="140"
                        image={`https://assets.akaswap.com/ipfs/${coverUri.replace(
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
            ))}
        </Grid>
      </Box>
    </>
  );
}
