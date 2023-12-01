export function getStrapiURL(path = "") {
    return `${process.env.AKASWAP_API_URL}${path}`;
}

export async function fetchAPI(path) {
    // const response = await fetch(`https://api.akaswap.com/v2/fa2tokens?limit=10`);
    const requestUrl = getStrapiURL(path);
    const response = await fetch(requestUrl);
    try {
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}