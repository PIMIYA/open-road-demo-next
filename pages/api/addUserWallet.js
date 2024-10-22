const axios = require('axios');

//get env variables
const directus_url = process.env.DirectusURL;

async function getDirectusToken(email, password) {
    const url = `${directus_url}/auth/login`;
    const body = {
        email: email,
        password: password
    };

    try {
        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const { access_token } = response.data.data;
        // console.log('Directus token:', access_token);
        return access_token;
    } catch (error) {
        console.error('Error requesting Directus token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function checkWalletExist(directusToken, address) {
    const url = `${directus_url}/items/userWallets?filter[address]=${address}`;

    console.log('Check wallet exist URL:', url);
    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            }
        });

        console.log('Check wallet exist response:', response.data);

        if (!response.data.data || response.data.data.length === 0) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking wallet existence:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function getNFTDropByPoolID(directusToken, poolID) {

    const url = `${directus_url}/items/NFTdrops?filter[poolID]=${poolID}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            }
        });

        console.log('Get NFTDrop ID response:', response.data.data);

        if (!response.data.data) {
            return null;
        }

        return response.data.data[0];
    } catch (error) {
        console.error('Error getting NFTDrop ID:', error.response ? error.response.data : error.message);
        throw error;
    }
}


async function addUserWallet(directusToken, email, address, poolID) {
    const userWalletUrl = `${directus_url}/items/userWallets`;
    const nftDropUrl = `${directus_url}/items/NFTdrops`;

    // Get ID of NFTdrop by poolID
    const nftDropID = await getNFTDropByPoolID(directusToken, poolID);
    console.log(`${poolID} is NFTDrop ID:`, nftDropID.id);

    if (!nftDropID.id) {
        return null;
    }

    // Add user wallet to the database, include email and wallet address
    const userWalletBody = {
        email: email,
        address: address,
        NFTdrops: [{ NFTdrops_id: nftDropID.id }]
    };

    try {
        // Create user wallet entry
        const userWalletResponse = await axios.post(userWalletUrl, userWalletBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            }
        });

        const userWalletID = userWalletResponse.data.data.id;
        console.log('User wallet ID:', userWalletID);

        return userWalletResponse.data.data;

    } catch (error) {
        console.error('Error adding user wallet:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function updateUserWallet(directusToken, email, address, poolID) {
    const userWalletUrl = `${directus_url}/items/userWallets`;
    const nftDropUrl = `${directus_url}/items/NFTdrops`;

    const nftDropID = await getNFTDropByPoolID(directusToken, poolID);
    console.log(`${poolID} is NFTDrop ID:`, nftDropID.id);

    if (!nftDropID.id) {
        return null;
    }

    try {
        // Fetch existing user wallet
        const userWalletResponse = await axios.get(`${userWalletUrl}?filter[email][_eq]=${email}`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`
            }
        });

        const userWallet = userWalletResponse.data.data[0];
        console.log('Existing user wallet:', userWallet);

        if (!userWallet) {
            throw new Error('User wallet not found');
        }

        // Extract NFTdrop IDs from the user wallet
        const existingNFTdropIDs = userWallet.NFTdrops || [];
        console.log('Existing NFTdrop IDs from userWallet:', existingNFTdropIDs);

        // Check if the NFTdrop is already in the user wallet
        if (existingNFTdropIDs.includes(nftDropID.id)) {
            console.log('NFTdrop already in user wallet');
            return userWallet;
        }

        console.log(`Adding NFTdrop ${nftDropID.id} to user wallet`);

        // Update the user wallet to include the new NFTdrop
        const updatedUserWalletBody = {
            NFTdrops: [...existingNFTdropIDs, { NFTdrops_id: nftDropID.id }]
        };

        console.log('Updated user wallet body:', updatedUserWalletBody);

        const updatedUserWalletResponse = await axios.patch(`${userWalletUrl}/${userWallet.id}`, updatedUserWalletBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            }
        });

        console.log('Updated user wallet response:', updatedUserWalletResponse.data.data);

        // Fetch the updated NFTdrop to get the current userWallets
        const NFTdropWalletsResponse = await axios.get(`${nftDropUrl}/${nftDropID.id}`, {
            headers: {
                'Authorization': `Bearer ${directusToken}`
            }
        });

        console.log('NFTdropWalletsResponse:', NFTdropWalletsResponse.data.data);

        return updatedUserWalletResponse.data.data;

    } catch (error) {
        console.error('Error updating user wallet:', error.response ? error.response.data : error.message);
        throw error;
    }
}

export default async function handler(req, res) {
    const { email, address, poolID } = req.body;

    if (!email || !address) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    //get admin token 
    const directusToken = await getDirectusToken(process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_EMAIL, process.env.NEXT_PUBLIC_DIRECTUS_ADMIN_PASSWORD);

    if (!directusToken) {
        return res.status(500).json({ error: "Error getting Directus token" });
    }

    //check if the wallet address is already in the database in admin premission 
    const walletExist = await checkWalletExist(directusToken, address);

    console.log('Wallet exist:', walletExist);

    if (walletExist) {
        //update user wallet in the database
        const userWallet = await updateUserWallet(directusToken, email, address, poolID);

        if (!userWallet) {
            return res.status(500).json({ error: "Error updating user wallet" });
        }

        return res.status(200).json({ data: userWallet });
    }

    //add user wallet to the database
    const userWallet = await addUserWallet(directusToken, email, address, poolID);

    if (!userWallet) {
        return res.status(500).json({ error: "Error adding user wallet" });
    }

    console.log('User wallet added:', userWallet);

    return res.status(200).json({ data: userWallet });

}


