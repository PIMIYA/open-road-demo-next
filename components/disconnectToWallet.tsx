'use client'

import React, { Dispatch, SetStateAction } from "react";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { TezosToolkit } from "@taquito/taquito";
/* Routing */
import { useRouter } from "next/router";


interface ButtonProps {
  wallet: BeaconWallet | null;
  setUserAddress: Dispatch<SetStateAction<string>>;
  setWallet: Dispatch<SetStateAction<any>>;
  setTezos: Dispatch<SetStateAction<TezosToolkit>>;
  setBeaconConnection: Dispatch<SetStateAction<boolean>>;
}

const DisconnectButton = ({
  wallet,
  setUserAddress,
  setWallet,
  setTezos,
  setBeaconConnection,
}: ButtonProps): JSX.Element => {
  /* Routing - Navigate programmatically */
  // const router = useRouter();
  // const query = router.query;
  // const walletState = query.wallet;

  const disconnectWallet = async (): Promise<void> => {
    if (wallet) {
      await wallet.clearActiveAccount();

      /* Routing - Conditional routing when hit disconnect btn*/
      // if (walletState) {
      //   console.log("just logout")
      //   router.push({
      //     pathname: '/audience/[wallet]',
      //     query: { wallet: walletState, login:"false" },                                                                                         
      //   })
      // } else if (!walletState) {
      //   console.log("go back to home")
      //   router.push({
      //     pathname: '/',                                                                                        
      //   })
      // }
      

    }
    setUserAddress("");
    setWallet(null);
    const tezosTK = new TezosToolkit("https://mainnet.ecadinfra.com");
    setTezos(tezosTK);
    setBeaconConnection(false);

    // // eslint-disable-next-line no-floating-promises
    // router.push({
    //   pathname: '/',                                                                                        
    // })
    
  };

  return (
    <div className="buttons">
      <button className="button" onClick={disconnectWallet}>
        <i className="fas fa-times"></i>Disconnect wallet
      </button>
    </div>
  );
};

export default DisconnectButton;
