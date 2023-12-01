/* MUI */
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Stack from "@mui/material/Stack";

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

export default function CardGrid({data}) {
    return (
            <Box pt={2} >
                <Stack direction={{xs: "column", md: "row"}} spacing={4}>
                    <Item sx={{
                        width: { xs: "100%", md: "50%" },
                        height: { xs: "auto", md: "50vh" },
                    }}>
                        <Box p={2}>
                            <Box>{data.name}</Box>
                            <Box>Edition of {data.amount}</Box>
                            <Box>
                                {data.creators && data.creators.map(( creator, index ) => (
                                <Box key={index} component="span">
                                    by {creator}
                                </Box>
                                ))}
                            </Box>
                            {data.tags.length > 0 ? "tags:" : ""}
                            <Box component="span">
                                {data.tags && data.tags.map(( tag, index ) => (
                                <Box key={index} component="span" ml={1}>
                                    {tag}
                                </Box>
                                ))}
                            </Box>
                        </Box>
                    </Item>
                    <Item sx={{
                        width: { xs: "100%", md: "50%" },
                        height: { xs: "auto", md: "50vh" },
                    }}>
                        <Box p={2}>
                            <Box>DESCRIPTION</Box>
                            <Box>Edition of {data.description}</Box>
                        </Box>
                    </Item>
                </Stack>
            </Box>
    )
}