import { Avatar, Typography } from "@mui/material";
import { truncateAddress } from "@/lib/stringUtils";
import { useEffect, useState } from "react";
import { TZKT_API } from "@/lib/api";

export default function WalletProfile({ address, introduction }) {
  const [alias, setAlias] = useState(null);
  const [avatarText, setAvatarText] = useState(null);

  useEffect(() => {
    setAlias(truncateAddress(address));
    setAvatarText(address.substring(address.length - 4));

    async function getAlias() {
      const account = await TZKT_API(`/v1/accounts/${address}`);
      if (account && account.alias) {
        setAlias(account.alias);
        setAvatarText(account.alias.substring(0, 1));
      }
    }

    getAlias();
  }, [address]);

  return (
    <>
      <Avatar
        sx={{
          width: 56,
          height: 56,
          marginX: "auto",
          marginBottom: 1,
        }}
      >
        {avatarText}
      </Avatar>
      <Typography textAlign={"center"} noWrap>
        {alias}
      </Typography>
      <Typography textAlign={"center"} variant="smallest" color="#666">
        {address}
      </Typography>
      {introduction && (
        <Typography mt={2} mb={0} paragraph>
          {introduction}
        </Typography>
      )}
    </>
  );
}
