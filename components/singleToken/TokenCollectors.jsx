import Link from "next/link";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { truncateAddress } from "@/lib/stringUtils";

export default function TokenCollectors({
  owners,
  ownerAddresses = [],
  ownerAliases = [],
}) {
  return (
    <Box
      sx={{
        columnCount: 2,
        columnGap: 1,
      }}
    >
      {ownerAddresses.map((address, index) => (
        <Link
          key={index}
          href={{
            pathname: "/wallet/[address]",
            query: { address },
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mx="auto"
            spacing={2}
            sx={{
              bgcolor: "transparent",
              paddingX: 2,
              paddingY: 1,
              marginBottom: 1,
              borderRadius: 1,
              breakInside: "avoid",
            }}
          >
            <Avatar src={`https://services.tzkt.io/v1/avatars/${address}`}>
              {(ownerAliases[address] || truncateAddress(address)).slice(0, 2)}
            </Avatar>
            <Box width="60%">
              <Typography noWrap>
                {ownerAliases[address] || truncateAddress(address)}
              </Typography>
            </Box>
            <Box sx={{ opacity: 0.2 }}>
              {owners[address]}
            </Box>
          </Stack>
        </Link>
      ))}
    </Box>
  );
}
