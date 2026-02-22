import Link from "next/link";
import {
  Avatar,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { truncateAddress } from "@/lib/stringUtils";

export default function TokenComments({
  owners,
  ownerAddresses = [],
  ownerAliases = [],
  comments,
}) {
  /* map messsage in comments.data to ownerAddresses */
  const ownerComments = {};
  if (comments && Array.isArray(comments.data)) {
    comments.data.forEach((comment) => {
      const walletAddress = comment.walletAddress;
      if (ownerAddresses.includes(walletAddress)) {
        ownerComments[walletAddress] = comment.message;
      }
    });
  }
  // console.log("ownerComments", ownerComments);

  return (
    <Box>
        {ownerAddresses.map((address, index) =>
          ownerComments[address] ? (
            <Link
              key={index}
              href={{
                pathname: "/wallet/[address]",
                query: { address },
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  backgroundColor: "transparent",
                  marginBottom: 1,
                  borderRadius: 1,
                  padding: 1,
                }}
              >
                <Avatar>
                  {(
                    ownerAliases[address] || truncateAddress(address)
                  ).slice(0, 2)}
                </Avatar>
                <Box sx={{ paddingLeft: 2 }}>
                  <Typography noWrap>
                    {ownerAliases[address] || truncateAddress(address)}
                  </Typography>
                  <Box
                    sx={{ opacity: 0.6 }}
                    dangerouslySetInnerHTML={{
                      __html: ownerComments[address],
                    }}
                  />
                </Box>
              </Stack>
            </Link>
          ) : null
        )}
    </Box>
  );
}
