import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useConnection } from "@/packages/providers";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext } from "@/contexts/GlobalContext";

import Link from "next/link";
import Image from "next/image";

import {
  Stack,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from "@mui/material";

import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";

import logo from "/public/logo.svg";

// TODO: only creator role have 'Mint' and 'My Creator Page' in the menu
// TODO: remove 'My Wallet (temp)' after wallet page ready

export default function NavBar() {
  const { isLanded } = useGlobalContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const { address, connect, disconnect } = useConnection();

  const [roleData, setRoleData] = useState(null);
  const [isLoadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    if (!address) {
      return;
    }

    console.log("fetching wallet roles");

    fetch("/api/walletRoles", {
      method: "POST",
      body: address,
    })
      .then((res) => res.json())
      .then((data) => {
        setRoleData(data);
        setLoadingRole(false);
      });
  }, [address]);

  // console.log("roleData", roleData);

  // if (isLoadingRole) return <p>Loading...</p>;
  // if (!roleData) return <p>No role data</p>;
  // console.log(roleData);

  const router = useRouter();
  const theme = useTheme();

  const gotohome = () => {
    router.push("/");
  };

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

  // Common menu items for both logged in and logged out states
  const commonMenuItems = (
    <>
      <MenuItem onClick={handleClose}>
        <Link href="/">Home</Link>
      </MenuItem>
      <MenuItem onClick={handleClose}>
        <Link href="/events">Events</Link>
      </MenuItem>
      <MenuItem onClick={handleClose}>
        <Link href="/faq">FAQ</Link>
      </MenuItem>
      <MenuItem onClick={handleClose}>
        <Link href="/privacy_policy">Privacy Policy</Link>
      </MenuItem>
      <MenuItem onClick={handleClose}>
        <Link href="/terms_of_service">Terms of Service</Link>
      </MenuItem>
    </>
  );

  // Menu component that always shows MenuIcon
  const menuComponent = (
    <div>
      <IconButton
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        aria-label="dashboard"
        onClick={handleClick}
        sx={{
          bgcolor: "secondary.main",
          color: "white",
          "&:hover": {
            bgcolor: "secondary.dark",
          },
        }}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        sx={{
          a: {
            color: "main",
            textDecoration: "none",
            display: "block",
            width: "100%",
          },
        }}
      >
        {commonMenuItems}

        {address && (
          <>
            <Divider />
            <MenuItem onClick={handleClose}>
              <Link
                href={{
                  pathname: `/wallet/${address}`,
                }}
              >
                My Wallet
              </Link>
            </MenuItem>
            {roleData && roleData.data && roleData.data.length === 0 ? null : (
              <Divider />
            )}
            <MenuItem
              onClick={handleClose}
              sx={{
                display: `${
                  roleData && roleData.data && roleData.data.length === 0
                    ? "none"
                    : "block"
                }`,
              }}
            >
              {roleData &&
              roleData.data &&
              roleData.data.length === 0 ? null : (
                <>
                  <Link
                    href={{
                      pathname: "/mint",
                    }}
                    as="/mint"
                  >
                    Mint
                  </Link>
                </>
              )}
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleClose(disconnect)}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Disconnect
            </MenuItem>
          </>
        )}
      </Menu>
    </div>
  );

  return (
    <>
      <Box sx={{ height: "130px" }} /> {/* for padding */}
      <Stack
        direction="row"
        justifyContent="space-between"
        padding="2rem 1.5rem"
        alignItems="center"
        sx={{
          position: "fixed",
          top: isLanded ? 0 : "-100px",
          width: "100%",
          zIndex: theme.zIndex.navBar,
          transition: "top .5s",
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
            src={logo}
            alt="Kairos"
            onClick={gotohome}
            width="100"
            height="100"
            style={{
              width: "100%",
              height: "auto",
            }}
            fetchpriority="high"
          />
        </Box>
        <Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Connect Wallet Button - 只在未登入時顯示 */}
            {router.pathname !== "/claim" && !address && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<LoginIcon />}
                onClick={connect}
                sx={{
                  minWidth: "auto",
                  px: 2,
                }}
              >
                Connect
              </Button>
            )}
            {router.pathname !== "/claim" && menuComponent}
          </Stack>
        </Box>
      </Stack>
    </>
  );
}
