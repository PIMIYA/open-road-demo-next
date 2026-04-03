import { useEffect, useState } from "react";

import Image from "next/image";
import { Box, Button, Container, Divider, Stack, Typography } from "@mui/material";

import { MainnetURL } from "@/lib/api";
import { decrypt } from "@/lib/dummy";
import { getAkaswapAssetUrl } from "@/lib/stringUtils";
import { useT } from "@/lib/i18n/useT";

export default function Claim({ apiEndPoint }) {
  const t = useT();
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
      <Button variant="contained" size="large" fullWidth onClick={() => setIsLogin(true)}>
        {t.claim.signInGoogle}
      </Button>
    );
  }

  function LoggedInActions() {
    return (
      <Stack spacing={3} alignItems="center">
        <Button
          variant="contained"
          color="secondary"
          size="large"
          fullWidth
          onClick={() => setIsClaimed(true)}
        >
          {t.claim.claimNft}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setIsLogin(false)}>
          {t.claim.signOut}
        </Button>
      </Stack>
    );
  }

  function ClaimedActions() {
    return (
      <Button variant="outlined" size="large" fullWidth>
        {t.claim.viewWallet}
      </Button>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      {/* Title & description */}
      <Typography variant="h2" gutterBottom>
        {data.name}
      </Typography>
      <Divider sx={{ my: 3 }} />
      {data.description.split("\n").map((paragraph, index) => (
        <Typography key={index} variant="body1" paragraph>
          {paragraph}
        </Typography>
      ))}

      {/* NFT Image */}
      <Box
        sx={{
          width: { xs: "100%", md: 400 },
          height: { xs: "100vw", md: 400 },
          mx: "auto",
          my: 6,
          position: "relative",
          border: 1,
          borderColor: "divider",
        }}
      >
        <Image
          priority={true}
          src={data.tokenImageUrl}
          fill
          style={{ objectFit: "contain", objectPosition: "center" }}
          alt={data.name}
        />
      </Box>

      {/* Actions */}
      <Box sx={{ maxWidth: 320, mx: "auto" }}>
        {isLogin ? (isClaimed ? <ClaimedActions /> : <LoggedInActions />) : <LoginActions />}
      </Box>
    </Container>
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
