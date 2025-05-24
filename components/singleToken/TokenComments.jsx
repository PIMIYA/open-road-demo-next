import Link from "next/link";
import {
  Avatar,
  Box,
  Container,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { truncateAddress } from "@/lib/stringUtils";

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  boxShadow: "none",
}));

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
    <Container maxWidth="lg">
      <Box py={6} minHeight={300}>
        {/* <Typography variant="h5" component="div" mb={4} textAlign="center">
          Comments
        </Typography> */}
        <Box
          sx={{
            columnCount: {
              sm: 2,
              md: 3,
              lg: 4,
            },
            columnGap: 1,
          }}
        >
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
                  key={address}
                  direction="row"
                  spacing={1}
                  sx={{
                    backgroundColor: "#fff",
                    marginBottom: 1,
                    borderRadius: 1,
                    padding: 1,
                  }}
                >
                  <Item>
                    <Avatar>
                      {(
                        ownerAliases[address] || truncateAddress(address)
                      ).slice(0, 2)}
                    </Avatar>
                  </Item>
                  <Item>
                    <Box sx={{ paddingLeft: 2 }}>
                      <Box>
                        <Typography noWrap>
                          {ownerAliases[address] || truncateAddress(address)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ opacity: 0.6 }}
                        dangerouslySetInnerHTML={{
                          __html: ownerComments[address],
                        }}
                      ></Box>
                    </Box>
                  </Item>
                </Stack>
              </Link>
            ) : null
          )}
        </Box>
      </Box>
    </Container>
  );
}
