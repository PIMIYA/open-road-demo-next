import React, { useState } from 'react'
import { Box, Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

export const Sharer = ({ id = 1, type, useSwapByRoyalties = false, sharers, maxSharer, handleSetSharer, handleUseSwapByRoyalties = () => null }) => {

    const [sharerId, setSharerId] = useState(id)

    const addSharer = () => {
        if (sharers.length < maxSharer + 1) {
            let array = sharers
            setSharerId(sharerId + 1)
            array.push({
                id: sharerId,
                address: null,
                share: null
            })
            handleSetSharer(array)
        }
        return
    }
    const removeSharer = (index) => {
        if (index > 0) {
            let array = sharers.slice(0, sharers.length)
            array.splice(index, 1)
            array = updateOwner(array)
            handleSetSharer(array)
        }
        return
    }
    const setSharerAddress = (index, address) => {
        if (index > 0) {
            let array = sharers.slice(0, sharers.length)
            array[index].address = address
            handleSetSharer(array)
            handleUseSwapByRoyalties(false)
        }
        return
    }
    const setSharerShare = (index, share) => {
        let array = sharers.slice(0, sharers.length)
        array[index].share = Number(share)
        if (index > 0) {
            array = updateOwner(array)
            handleUseSwapByRoyalties(false)
        }
        handleSetSharer(array)
        return
    }
    const updateOwner = (array) => {
        let sum = 0
        for (let i = 1; i < array.length; i++) {
            sum += Number(array[i].share)
        }
        setSharerId(sharerId + 1)
        array[0] = {
            id: sharerId,
            address: sharers[0].address ? sharers[0].address : "owner",
            share: 100 - sum
        }
        return array
    }

    if (type !== "RoyaltiesShare") return null;

    return (
        <Stack spacing={3}>
            {sharers.map((sharer, index) => (
                <Box
                    key={sharer.id}
                    sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        p: 3,
                    }}
                >
                    {/* Row label */}
                    <Typography variant="caption" sx={{ opacity: 0.6, mb: 2, display: "block" }}>
                        {index === 0 ? "Owner" : `Sharer ${index}`}
                    </Typography>

                    <Stack spacing={3}>
                        {/* Wallet address — full width */}
                        <TextField
                            type="text"
                            fullWidth
                            onChange={(e) => setSharerAddress(index, e.target.value)}
                            label="Wallet address"
                            placeholder="tz1..."
                            value={index === 0 ? sharer.address : (sharer.address ? sharer.address : '')}
                            disabled={index === 0}
                        />

                        {/* Rate + remove on same line */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <TextField
                                type="number"
                                inputProps={{ min: 0, max: 100 }}
                                onChange={(e) => setSharerShare(index, e.target.value)}
                                label="Rate (%)"
                                placeholder="%"
                                value={sharer.share ? sharer.share : 0}
                                disabled={index === 0}
                                sx={{ width: 120 }}
                            />
                            {index > 0 && (
                                <IconButton
                                    size="small"
                                    onClick={() => removeSharer(index)}
                                    disabled={useSwapByRoyalties}
                                    sx={{ opacity: 0.6, "@media (hover: hover)": { "&:hover": { opacity: 1 } } }}
                                >
                                    <RemoveCircleOutlineIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Stack>
                    </Stack>
                </Box>
            ))}

            <Button
                variant="outlined"
                size="small"
                onClick={addSharer}
                disabled={useSwapByRoyalties || sharers.length > maxSharer}
            >
                + Add sharer
            </Button>
        </Stack>
    )
}
