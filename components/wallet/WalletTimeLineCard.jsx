import Link from 'next/link';
import Image from 'next/image';
import { Box, Stack, Typography } from '@mui/material';
import Tags from '@/components/Tags';

export default function WalletTimelineCard({ data, index }) {
  const tokenImageUrl = `https://assets.akaswap.com/ipfs/${data.displayUri.replace("ipfs://", "")}`;
  const { contract, tokenId } = data;

  return (
    <Box mb={10}>
      <Stack direction={'row'}>
        <Box width={200}>
          <Typography variant="body1">
            {data.cliamDate}
          </Typography>
          <Typography variant="body2">
            {data.eventPlace}
          </Typography>
        </Box>
        <Box width={'100%'}>
          <Box sx={{
            width: {
              md: '100%',
              lg: '30vw',
            },
            maxWidth: '400px',
          }}>
            <Link
              href={{
                pathname: `/claimsToken/[contract]/[tokenId]`,
                query: { contract, tokenId },
              }}
            >
              <Image
                priority={index==0}
                src={tokenImageUrl}
                width={400}
                height={400}
                style={{
                  width: '100%',
                  height: 'auto',
                }}
                alt="Token Image"
              />
            </Link>
          </Box>
          <Box mt={1} mb={2}>
            <Typography variant="h6">
              <Link
                href={{
                  pathname: `/claimsToken/[contract]/[tokenId]`,
                  query: { contract, tokenId },
                }}
              >
                {data.name}
              </Link>
            </Typography>
            <Typography variant="body1">
              {data.creator}
            </Typography>
          </Box>
          <Tags tags={data.tags} />
        </Box>
      </Stack>
    </Box>
  );
}
