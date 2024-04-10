import { useState } from "react";
import { useRouter } from "next/router";
import { useConnection } from "@/packages/providers";
import { useTheme } from "@mui/material/styles";

import Link from "next/link";
import Image from 'next/image';

import { Stack, Box, Button, IconButton, Menu, MenuItem, ListItemIcon } from "@mui/material";

import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';

import logo from "/public/logo.svg";

export default function() {
  const [anchorEl, setAnchorEl] = useState(null);
  const { address, connect, disconnect } = useConnection();
  const router = useRouter();
  const theme = useTheme();

  const gotohome = () => {
    router.push("/");
  };

  const connectBtn = (
    <Button variant="contained" color="secondary" startIcon={<LoginIcon />} onClick={connect} >connect</Button>
  );

  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (callback = null) => {
    setAnchorEl(null);

    if (callback && typeof callback === "function") {
      callback();
    }
  };

  const connectedMenu = (
    <div>
      <IconButton
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label="dashboard"
        onClick={handleClick}

        sx={{
          bgcolor: "secondary.main",
          color: "white",
          "&:hover": {
            bgcolor: "secondary.dark",
          }
        }}
      >
        <MenuIcon/>
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        sx={{
          a: {
            color: "main",
            textDecoration: "none",
          }
        }}
      >
        <MenuItem onClick={handleClose}>
          <Link
            href={{
              pathname: `/wallet/${address}`,
              // query: { address: address },
            }}
          // as="/my_wallet"
          >
            My Wallet
          </Link>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Link
            href={{
              pathname: "/mint",
            }}
            as="/mint"
          >
            Mint
          </Link>
        </MenuItem>
        <MenuItem onClick={() => handleClose(disconnect)}>
          <ListItemIcon >
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Disconnect
        </MenuItem>
      </Menu>
    </div>
  );

  return (
    <>
      <Box sx={{ height: "100px" }} /> {/* for padding */}
      <Stack
        direction="row"
        justifyContent="space-between"
        padding="2rem 1.5rem"
        alignItems="center"
        sx={{
          position: "fixed",
          top: '0px',
          width: "100%",
          zIndex: theme.zIndex.navBar,
        }}
      >
        <Box
          onClick={gotohome}
          sx={{
            cursor: "pointer",
            position: "relative",
            width: {
              xs: "100px",
              sm: "120px",
              md: "130px",
            },
            height: {
              xs: "50px",
              sm: "60px",
              md: "65px",
            },
            transition: "width .5s, height .5s",
          }}
        >
          <Image
            priority
            src={logo}
            alt="Kairos"
            layout="fill"
            onClick={gotohome}
            style={{
              objectFit: "contain",
            }}
          />
        </Box>
        {address ? connectedMenu  : connectBtn}
      </Stack>
    </>
  );
};
