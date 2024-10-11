import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { KukaiEmbed, Networks } from "kukai-embed";
import { Button } from "@mui/material";

const KukaiEmbedComponent = forwardRef(({ onLoginSuccess }, ref) => {
  const embedRef = useRef(null);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useImperativeHandle(ref, () => ({
    logout: async () => {
      if (embedRef.current) {
        try {
          await embedRef.current.logout();
          setIsLoggedIn(false);
          console.log("Logged out successfully");
        } catch (error) {
          console.error("Error during logout:", error);
        }
      }
    },
  }));


  const initializeEmbed = () => {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      if (embedRef.current) {
        console.log("Kukai-Embed already initialized");
        return;
      }
      const embed = new KukaiEmbed({
        net: Networks.mainnet,
        element: document.getElementById("kukai-container"),
      });

      embed
        .init()
        .then(() => {
          if (embed.user) {
            console.log("Already logged in", embed.user);
            setIsLoggedIn(true);
          }

        //   // Inject CSS into the iframe, if needed , this is optional and test it after KUKAI add kairos to whitelist

        //   const iframe = document.getElementById("kukai-iframe");
        //   if (iframe) {
        //       const injectCSS = () => {
        //           try {
        //               const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        //               const css = `
        //                   .flex-row.header .abort {
        //                       display: none !important;
        //                   }
        //                   .flex-row.header .back {
        //                       display: none !important;
        //                   }
        //                   .footer {
        //                       display: none !important;
        //                   }
        //                   body {
        //                       background-color: red !important;
        //                   }
        //               `;
        //               const style = iframeDocument.createElement("style");
        //               style.appendChild(iframeDocument.createTextNode(css));
        //               iframeDocument.head.appendChild(style);
        //           } catch (error) {
        //               console.error("Error injecting CSS:", error);
        //           }
        //       };
  
        //       if (iframe.contentDocument.readyState === "complete") {
        //           injectCSS();
        //       } else {
        //           iframe.onload = injectCSS;
        //       }
        //     }
        })
        .catch((error) => {
          console.error("Error during initialization:", error);
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
          loginOptions: ["google"],
          wideButtons: [true],
          showBackButton: [true],
        });

        if (userInfo) {
          // console.log(`userInfo is : ${JSON.stringify(userInfo)}`);
          setIsLoggedIn(true);
          onLoginSuccess(userInfo);
        }
      } catch (error) {
        console.error("Error during login:", error);
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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // marginBottom: "16px",
        marginTop: "16px",
      }}
    >
      {isLoggedIn ? (
        <Button
          onClick={() => ref.current.logout()}
          sx={{
            backgroundColor: "#007bff",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "#0056b3",
            },
          }}
        >
          Logout
        </Button>
      ) : (
        <Button
          onClick={handleLogin}
          sx={{
            backgroundColor: "#007bff",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "#0056b3",
            },
          }}
        >
          click to claim NFT
        </Button>
      )}
      {isEmbedOpen && <div id="kukai-container"></div>}
    </div>
  );
});

export default KukaiEmbedComponent;
