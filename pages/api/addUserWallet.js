const axios = require('axios');

async function getDirectusToken(email, password) {
    const url = 'http://localhost:8055/auth/login';
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
    const url = `http://localhost:8055/items/userWallets?filter[walletAddress]=${address}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            }
        });

        // console.log('Check wallet exist response:', response.data);

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
    const url = `http://localhost:8055/items/NFTdrops?filter[poolID]=${poolID}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            }
        });

        // console.log('Get NFTDrop ID response:', response.data.data);

        if (!response.data.data) {
            return null;
        }

        return response.data.data[0].id;
    } catch (error) {
        console.error('Error getting NFTDrop ID:', error.response ? error.response.data : error.message);
        throw error;
    }
}


async function addUserWallet(directusToken, email, address, poolID) {
    const userWalletUrl = 'http://localhost:8055/items/userWallets';
    const nftDropUrl = 'http://localhost:8055/items/NFTdrops';

    // Get ID of NFTdrop by poolID
    const nftDropID = await getNFTDropByPoolID(directusToken, poolID);

    if (!nftDropID) {
        return null;
    }

    // Add user wallet to the database, include email and wallet address
    const userWalletBody = {
        email: email,
        walletAddress: address
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

        // Update NFTdrop entry to link it to the newly created user wallet
        const nftDropBody = {
            userWallets: [{ userWallets_id: userWalletID }]
        };

        await axios.patch(`${nftDropUrl}/${nftDropID}`, nftDropBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            }
        });

        return userWalletResponse.data.data;

    } catch (error) {
        console.error('Error adding user wallet:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function getNFTdropsByIDs(directusToken, nftDropIDs) {
    const nftDropUrl = `http://localhost:8055/items/NFTdrops?filter[userWallets][_in]=${nftDropIDs.join(',')}`;

    try {
        const response = await axios.get(nftDropUrl, {
            headers: {
                'Authorization': `Bearer ${directusToken}`
            }
        });

        return response.data.data;
    } catch (error) {
        console.error('Error fetching NFTdrops by IDs:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function updateUserWallet(directusToken, email, address, poolID) {
    const userWalletUrl = `http://localhost:8055/items/userWallets?filter[email][_eq]=${email}`;
    const nftDropUrl = 'http://localhost:8055/items/NFTdrops';

    const nftDropID = await getNFTDropByPoolID(directusToken, poolID);
    console.log(`${poolID} is NFTDrop ID:`, nftDropID);

    if (!nftDropID) {
        return null;
    }

    try {
        // Fetch existing user wallet
        const userWalletResponse = await axios.get(userWalletUrl, {
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
        // Fetch the NFTdrop entries by IDs
        const existingNFTdrops = await getNFTdropsByIDs(directusToken, existingNFTdropIDs);
        console.log('Existing NFTdrops from NFTdrop:', existingNFTdrops);
        // Check if the NFTdrop is already in the user wallet
        const existingNFTdrop = existingNFTdrops.find(nftDrops => nftDrops.id === nftDropID);
        console.log('the NFTdrop is already in the user wallet:', existingNFTdrop);

        if (existingNFTdrop) {
            console.log('NFTdrop already in user wallet');
            return userWallet;
        }

        // Update the NFTdrop to set the userWallets field
        const updatedNFTdropBody = {
            userWallets: [{ userWallets_id: userWallet.id }]
        };

        const updatedNFTdropResponse = await axios.patch(`${nftDropUrl}/${nftDropID}`, updatedNFTdropBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${directusToken}`
            }
        });

        console.log('Updated NFTdrop:', updatedNFTdropResponse.data.data);

        return updatedNFTdropResponse.data.data;


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


