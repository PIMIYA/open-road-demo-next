import QRCode from 'qrcode'
import { useEffect, useState } from "react";

import Image from "next/image";
import { Box, Container, Typography } from "@mui/material";
import logo from "/public/logo.svg";

import { MainnetURL } from "@/lib/api";
import { decrypt } from "@/lib/dummy";

const qrcodeOpts = {
  errorCorrectionLevel: 'H',
  type: 'image/jpeg',
  quality: 1,
  margin: 2,
  scale: 10,
  color: {
    dark: "#000",
    light: "#fff"
  }
};

export default function ShowCase({ hash, apiEndPoint }) {
  const [data, setData] = useState(null);
  const [codeImage, setCodeImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(apiEndPoint);
      try {
        const data = await response.json();
        return setData(data);
      } catch (error) {
        return null;
      }
    };

    const genQRCode = async () => {
      const { protocol, host } = window.location;
      const shortenURL = `${protocol}//${host}/showcase/${hash}/claim`;

      QRCode.toDataURL(shortenURL, qrcodeOpts, (err, qrCode) => {
        if (err) {
          console.error(err)
          return
        }
        setCodeImage(qrCode);
      })
    };

    fetchData();
    genQRCode();

  }, []);

  if (!codeImage) return null;

  return (
    <Container
      maxWidth="md"
      align="center"
      sx={{
        my: 10,
      }}
    >
      <Box sx={{
        width: 150,
        mb: 10,
      }}>
        <Image
          src={logo}
          alt="Kairos"
          width='150'
          height='75'
          style={{
            width: '100%',
            height: 'auto',
          }}
        />
      </Box>
      <Box my={4}>
        <Typography variant="h5" gutterBottom>
          {data?.name}
        </Typography>
        <Box>
          {data?.description.split("\n").map((paragraph, index) => (
            <Typography key={index} variant="body1" paragraph>{paragraph}</Typography>
          ))}
        </Box>
      </Box>
      <Box
        mb={3}
        maxWidth={400}
      >
        <Image
          width={400}
          height={400}
          src={codeImage} alt="claim"
          style={{
            width: '100%',
            height: 'auto',
          }}
        />
      </Box>
      <Typography variant="body2">
        Copyright © 2024 kairos
      </Typography>
    </Container>
  )
}

export async function getServerSideProps(context) {
  const { hash } = await context.query;
  const contract = decrypt(hash).split('/')[0];
  const tokenId = decrypt(hash).split('/')[1];

  return {
    props: {
      hash,
      apiEndPoint: MainnetURL(`/fa2tokens/${contract}/${tokenId}`),
    },
  }
}

ShowCase.displayName = "ShowCase";
