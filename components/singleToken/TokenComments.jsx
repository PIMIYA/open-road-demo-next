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
  const commentList = comments && Array.isArray(comments.data) ? comments.data : [];

  return (
    <Box>
        {commentList.map((comment, index) => {
          const address = comment.walletAddress;
          const alias = ownerAliases?.[address];
          const displayName = alias || (address ? truncateAddress(address) : "Anonymous");
          return (
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
                  {displayName.slice(0, 2)}
                </Avatar>
                <Box sx={{ paddingLeft: 2 }}>
                  <Typography noWrap>
                    {displayName}
                  </Typography>
                  <Box
                    sx={{ opacity: 0.6 }}
                    dangerouslySetInnerHTML={{
                      __html: comment.message,
                    }}
                  />
                </Box>
              </Stack>
            </Link>
          );
        })}
    </Box>
  );
}
