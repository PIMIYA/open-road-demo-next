import { useEffect, useState } from "react";

import Image from "next/image";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

import { MainnetURL } from "@/lib/api";
import { decrypt } from "@/lib/dummy";
import { getAkaswapAssetUrl } from "@/lib/stringUtils";

export default function Claim({ apiEndPoint }) {
  const [data, setData] = useState(null);
  const [isLogin, setIsLogin] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(apiEndPoint);
      try {
        const data = await response.json();
        data.tokenImageUrl = getAkaswapAssetUrl(data.displayUri);

        return setData(data);
      } catch (error) {
        return null;
      }
    };

    fetchData();
  }, []);

  if (!data) return null;

  function LoginActions() {
    return (
      <Button variant="contained" onClick={() => setIsLogin(true)}>
        Google button here
      </Button>
    );
  }

  function LoggedInActions() {
    return (
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={5}
      >
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setIsClaimed(true)}
        >
          Claim NFT
        </Button>
        <a onClick={() => setIsLogin(false)}>
          Sign out
        </a>
      </Stack>
    );
  }

  function ClaimedActions() {
    return (
      <Button
        variant="contained"
        color="secondary"
      >
        View Wallet
      </Button>
    );
  }

  return (
    <>
      <Container maxWidth="lg">
        <Box my={4} textAlign="center">
          <Box>
            <Typography variant="h5" gutterBottom>
              {data.name}
            </Typography>
            <Box>
              {data.description.split("\n").map((paragraph, index) => (
                <Typography key={index} variant="body1" paragraph>{paragraph}</Typography>
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              width: { xs: "100%", md: "500px" },
              height: { xs: "100vw", md: "500px" },
              margin: "auto",
              my: 5,
              position: "relative",
            }}
          >
            <Image
              priority={true}
              src={data.tokenImageUrl}
              fill
              style={{
                objectFit: "contain", // cover, contain, none
                objectPosition: "top",
              }}
              alt="Picture of the author"
            />
          </Box>
          {isLogin ? (isClaimed ? <ClaimedActions /> : <LoggedInActions />) : <LoginActions />}
        </Box>
      </Container>
    </>
  );
}

export async function getServerSideProps(context) {
  const { hash } = await context.query;
  const contract = decrypt(hash).split('/')[0];
  const tokenId = decrypt(hash).split('/')[1];

  return {
    props: {
      apiEndPoint: MainnetURL(`/fa2tokens/${contract}/${tokenId}`),
    },
  }
}
