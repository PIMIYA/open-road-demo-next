export function MainnetURL(path = "") {
    return `${process.env.MainnetURL}${path}`;
}
export function TestnetURL(path = "") {
    return `${process.env.TestnetURL}${path}`;
}
export function WalletRoleURL(path = "") {
    return `${process.env.WalletRoleURL}${path}`;
}
export function AkaDropURL(path = "") {
    return `${process.env.AkaDropURL}${path}`;
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
        return data;
    } catch (error) {
        return null;
    }
}

/* AkaDrop claims and pools */
export async function AkaDropAPI(path) {
    const requestUrl = AkaDropURL(path);
    const response = await fetch(requestUrl);
    try {
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}