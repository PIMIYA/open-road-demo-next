import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { KukaiEmbed, Networks } from 'kukai-embed';

const KukaiEmbedComponent = forwardRef(({ onLoginSuccess }, ref) =>  {
    const embedRef = useRef(null);
    const [isEmbedOpen, setIsEmbedOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useImperativeHandle(ref, () => ({
        logout: async () => {
            if (embedRef.current) {
                try {
                    await embedRef.current.logout();
                    setIsLoggedIn(false);
                    console.log('Logged out successfully');
                } catch (error) {
                    console.error('Error during logout:', error);
                }
            }
        }
    }));

    const initializeEmbed = () => {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            if (embedRef.current) {
                console.log('Kukai-Embed already initialized');
                return;
            }
            const embed = new KukaiEmbed({
                net: Networks.ghostnet,
                element: document.getElementById('kukai-container')
            });

            embed.init().then(() => {
                if (embed.user) {
                    console.log('Already logged in', embed.user);
                    setIsLoggedIn(true);
                }
            }).catch(error => {
                console.error('Error during initialization:', error);
            });

            embedRef.current = embed;
        }
    };

    useEffect(() => {
        initializeEmbed();
    }, []);

    const handleLogin = async () => {
        if (embedRef.current) {
            try {
                const userInfo = await embedRef.current.login({
                    loginOptions: ['google'],
                    wideButtons: [true],
                    showBackButton: [true],
                });

                if (userInfo) {
                    // console.log(`userInfo is : ${JSON.stringify(userInfo)}`);
                    setIsLoggedIn(true);
                    onLoginSuccess(userInfo);
                }
            } catch (error) {
                console.error('Error during login:', error);
            }
        }
        setIsEmbedOpen(true);
    };

    // const handleLogout = async () => {
    //     if (embedRef.current) {
    //         try {
    //             await embedRef.current.logout();
    //             setIsLoggedIn(false);
    //             console.log('Logged out successfully');
    //         } catch (error) {
    //             console.error('Error during logout:', error);
    //         }
    //     }
    // };

    return (
        <div>
            {isLoggedIn ? (
                <button onClick={() => ref.current.logout()}>Logout</button>
            ) : (
                <button onClick={handleLogin}>click to claimNFT</button>
            )}
            {isEmbedOpen && <div id="kukai-container"></div>}
        </div>
    );
});

export default KukaiEmbedComponent;

