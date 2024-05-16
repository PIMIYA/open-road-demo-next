/**
 * ! Deprecated !
 */

/* MUI */
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import styles from "@/styles/CardContent.module.css";

import Image from "next/image";

/* stack Item setting */
const Item = styled(Paper)(({ theme }) => ({
  //...theme.typography.body2,
  // paddingLeft: theme.spacing(0),
  // paddingRight: theme.spacing(0),
  textAlign: "left",
  // color:"rgb(0,0,0,0.87)",
  // background: "red",
  boxShadow: "none",
}));

export default function SelectedTokenCardContent({ data }) {
  return (
    <Box pt={6}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
        <Item
          sx={{
            width: { xs: "100%", md: "50%" },
            height: { xs: "100%", md: "auto" },
          }}
        >
          <Box
            p={4}
            sx={{
              backgroundColor: "none",
              width: { xs: "80%", md: "80%" },
              height: { xs: "calc(100vw - 0px)", md: "80%" },
              position: "relative",
            }}
          >
            <Image
              src={`https://assets.akaswap.com/ipfs/${data.thumbnailUri.replace(
                "ipfs://",
                ""
              )}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
              style={{
                objectFit: "cover", // cover, contain, none
              }}
              alt="Picture of the author"
            />
          </Box>
        </Item>
        <Item
          sx={{
            width: { xs: "100%", md: "50%" },
            height: { xs: "auto", md: "auto" },
          }}
        >
          <Box p={0}>
            <Typography gutterBottom variant="h5" component="div" pb={2}>
              {data.name}
            </Typography>
            <Box className={styles.p}>
              <Box className={styles.fw700}>Description:</Box>
              <Box>{data.description}</Box>
            </Box>
            <Box
              className={styles.p}
              sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {data.tags.length > 0 ? (
                <Box component="span" className={styles.fw700}>
                  Tags:
                </Box>
              ) : (
                ""
              )}

              <Box component="span">
                {data.tags &&
                  data.tags.map((tag, index) => (
                    <Box key={index} component="span" ml={1}>
                      {tag}
                    </Box>
                  ))}
              </Box>
            </Box>
            <Box
              className={styles.p}
              sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {data.creators.length > 0 ? (
                <Box component="span" className={styles.fw700}>
                  Creator:
                </Box>
              ) : (
                ""
              )}
              <Box component="span">
                {data.creators &&
                  data.creators.map((creator, index) => (
                    <Box key={index} component="span" ml={1}>
                      {creator}
                    </Box>
                  ))}
              </Box>
            </Box>
            <Box className={styles.p}>
              <Box component="span" className={styles.fw700}>
                Edition:
              </Box>
              <Box component="span" ml={1}>
                xxx
              </Box>
            </Box>
            <Box className={styles.p}>
              <Box component="span" className={styles.fw700}>
                License:
              </Box>
              <Box component="span" ml={1}>
                xxx
              </Box>
            </Box>
            <Box className={styles.p}>
              <Box component="span" className={styles.fw700}>
                Collection:
              </Box>
              <Box component="span" ml={1}>
                xxx
              </Box>
            </Box>
          </Box>
        </Item>
      </Stack>
    </Box>
  );
}
