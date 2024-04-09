import { useRouter } from "next/router";
import { useConnection } from "@/packages/providers";

import Link from "next/link";
import Image from 'next/image';

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import logo from "/public/logo.svg";
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

export default function() {
  const { address, connect, disconnect } = useConnection();
  const router = useRouter();

  const gotohome = () => {
    router.push("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        background: "none",
      }}
    >
      <Button disableRipple={true} onClick={gotohome}>
        <Image
          priority
          src={logo}
          alt="Kairos"
          onClick={gotohome}
        />
      </Button>
      <div>
        {address ? (
          <>
            <Box component="span">
              <Link
                href={{
                  pathname: "/mint",
                }}
                as="/mint"
              >
                <Button variant="text">
                  mint
                </Button>
              </Link>
            </Box>
            <Box component="span">
              <Link
                /* In order to fetch data every time load page, send address from URL  */
                href={{
                  pathname: `/creations`,
                  // query: { address: address }
                }}
              // as="/creations"
              >
                <Button variant="text">
                  creations
                </Button>
              </Link>
            </Box>
            <Box component="span">
              <Link
                href={{
                  pathname: `/wallet/${address}`,
                  // query: { address: address },
                }}
              // as="/my_wallet"
              >
                <Button variant="text">
                  my wallet
                </Button>
              </Link>
            </Box>
            <Box component="span">
              <Button
                variant="outlined"
                onClick={disconnect}
                startIcon={<LogoutIcon />}
              >
                disconnect
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Button variant="contained" color="secondary" startIcon={<LoginIcon />} onClick={connect} >
              connect
            </Button>
          </>
        )}
      </div>
    </Box>
  );
};
