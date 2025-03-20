const axios = require('axios');

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithExponentialBackoff(fn, retries = MAX_RETRIES, delay = INITIAL_DELAY) {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0 || error.response?.status !== 429) {
            throw error;
        }
        console.warn(`Retrying in ${delay}ms... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
    }
}


export function MainnetURL(path = "") {
    return `${process.env.MainnetURL}${path}`;
}
export function TestnetURL(path = "") {
    return `${process.env.TestnetURL}${path}`;
}
export function WalletRoleURL(path = "") {
    return `${process.env.WalletRoleURL}${path}`;
}
export function AKADROP_URL(path = "") {
    return `${process.env.AKADROP_URL}${path}`;
}
export function TZKT_URL(path = "") {
    return `${process.env.TZKT_URL}${path}`;
}
export function DIRECTUS_URL(path = "") {
    return `${process.env.DIRECTUS}${path}`;
}

/* MAINNET */
// Get fa2 token list minted on akaSwap
// Get fa2 token minted on akaSwap
export async function MainnetAPI(path) {
    const requestUrl = MainnetURL(path);
    const response = await fetch(requestUrl);
    try {
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

/* TESTNET */
// Get creations by address
// Get records of an account
export async function TestnetAPI(path) {
    const requestUrl = TestnetURL(path);
    const response = await fetch(requestUrl);
    try {
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

/* WALLET ROLE */
export async function WalletRoleAPI(path) {
    const requestUrl = WalletRoleURL(path);
    const response = await fetch(requestUrl);
    try {
        const data = await response.json();
        return [1, 2, 3];
    } catch (error) {
        return null;
    }
}

/* AkaDrop claims and pools */
export async function AkaDropAPI(path) {
    const requestUrl = AKADROP_URL(path);
    const response = await fetch(requestUrl);
    try {
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

/* TZKT token and tokens */
export async function TZKT_API(path) {
    const requestUrl = TZKT_URL(path);
    const response = await fetch(requestUrl);
    try {
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

/* Get Claimable token poolID */
export async function GetClaimablePoolID(contractAddress, targetContractAddress, targetTokenId) {
    try {
        const bigMapName = 'pools';
        // Check storage of contract
        const requestUrl_storage = TZKT_URL(`/v1/contracts/${contractAddress}/storage`);
        const storageResponse = await axios.get(requestUrl_storage);

        const storage = storageResponse.data;
        // Get big map id
        const bigMapId = storage[bigMapName];
        // console.log('bigMapId:', bigMapId);

        // Get big map values with a limit
        const requestUrl_bigMap = TZKT_URL(`/v1/bigmaps/${bigMapId}/keys?limit=1000&active=true`);
        const bigMapResponse = await retryWithExponentialBackoff(() => axios.get(requestUrl_bigMap));
        const bigMapValues = bigMapResponse.data;

        // Filter the big map values by the target contract address and token ID within the tokens array
        const filteredValues = bigMapValues.filter(entry =>
            entry.value.tokens.some(token =>
                token.key.fa2 === targetContractAddress && token.key.id === targetTokenId
            )
        );

        if (filteredValues.length === 0) {
            return null;
        }

        // Return the drop token data
        return filteredValues;

    } catch (error) {
        // console.error('Error in GetClaimablePoolID:', error);
        return null;
    }
}

export async function FetchDirectusData(path) {
    // const DIRECTUS_API = process.env.DIRECTUS

    // const response = await fetch(`${DIRECTUS_API + path}`);
    // try {
    //     const data = await response.json();
    //     return data;
    // } catch (error) {
    //     return null;
    // }
    const requestUrl = DIRECTUS_URL(path);
    const response = await fetch(requestUrl);
    try {
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

