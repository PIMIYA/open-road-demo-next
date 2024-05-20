import React, { useState } from 'react'
import styles from './styles.module.scss'
// MUI
import { Box, Button, TextField } from "@mui/material";
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)({
    minWidth: 12,
    minHeight: 12,
    borderRadius: '50%',
    margin: 6,
    fontSize: 15,
});

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
            // share: JSON.stringify(100 - sum)
            share: 100 - sum
        }
        return array
    }

    const sharerRows = sharers.map((sharer, index) => {
        return (
            <div key={sharer.id} className={styles.shareRow}>

                {type === "RoyaltiesShare" &&
                    <>
                        <TextField
                            type="text"
                            variant="standard"
                            onChange={(e) => setSharerAddress(index, e.target.value)}
                            label="shareWith"
                            placeholder="Wallet Address"
                            value={index === 0 ? sharer.address : (sharer.address ? sharer.address : '')}
                            disabled={(index > 0 ? false : true)}
                        />
                        <TextField
                            type="number"
                            variant="standard"
                            inputProps={{ min: 0, max: 100 }}
                            onChange={(e) => setSharerShare(index, e.target.value)}
                            label="rate(%)"
                            placeholder='%'
                            value={sharer.share ? sharer.share : 0}
                        />
                    </>
                }

                <Box >
                    <StyledButton
                        variant="outlined"
                        onClick={(e) => { removeSharer(index) }}
                        disabled={((!useSwapByRoyalties && index > 0) ? false : true)}
                    >-</StyledButton>
                </Box>

            </div>
        )
    }
    )

    return (
        <div>
            {sharerRows}
            {/* <div className={styles.addRow}> */}

            <StyledButton
                variant="outlined"
                onClick={addSharer}
                disabled={useSwapByRoyalties || sharers.length > maxSharer ? true : false}
            >
                +
            </StyledButton>


            {/* </div> */}
        </div>
    )
}