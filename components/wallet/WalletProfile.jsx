import { Avatar, Typography } from '@mui/material';
import { truncateAddress } from '@/lib/stringUtils';

export default function WalletProfile({ address, introduction }) {

  return (
    <>
      <Avatar sx={{
        width: 56,
        height: 56,
        marginX: 'auto',
        marginBottom: 1,
      }}>
        {address.substring(address.length - 4)}
      </Avatar>
      <Typography
        textAlign={'center'}
        noWrap
      >
        {truncateAddress(address)}
      </Typography>
      {introduction && (
        <Typography
          mt={2}
          mb={0}
          paragraph
        >
          {introduction}
        </Typography>
      )}
    </>
  );
}
