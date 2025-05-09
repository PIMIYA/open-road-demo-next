import dynamic from "next/dynamic";
import { BeaconWallet } from "@taquito/beacon-wallet";
import {
  ExtendedPeerInfo,
  PermissionResponseOutput,
  PermissionScope,
} from "@airgap/beacon-types";

import { MichelCodecPacker, TezosToolkit, OpKind } from "@taquito/taquito";
import { stringToBytes } from "@taquito/utils";
import { ConnectFn, ContractCallDetails } from "./types";
// import { BeaconEvent } from "@airgap/beacon-sdk";
import { InMemorySigner } from "@taquito/signer";

const createBeaconWallet = () => {
  if (typeof window === "undefined") return undefined;

  // Lazy load BeaconWallet only on client side
  const { BeaconWallet } = require("@taquito/beacon-wallet");

  return new BeaconWallet({
    name: "Kairos",
    preferredNetwork: "mainnet",
    featuredWallets: ["kukai", "trust", "temple", "umami"],
  } as any);
};

// const createBeaconWallet = () =>
//   typeof window === "undefined"
//     ? undefined
//     : new BeaconWallet({
//         name: "Kairos",
//         // appUrl: 'localhost:3000',
//         preferredNetwork: "mainnet",
//         // walletConnectOptions: {
//         //   projectId: '97f804b46f0db632c52af0556586a5f3',
//         //   relayUrl: 'wss://relay.walletconnect.com'
//         // },
//         featuredWallets: ["kukai", "trust", "temple", "umami"],
//         // disableDefaultEvents: false, // Disable all events when true/ UI. This also disables the pairing alert.
//       } as any);

export const connectBeacon: ConnectFn = async (isNew) => {
  if (typeof window === "undefined") {
    throw new Error("Beacon wallet cannot be used on server side");
  }
  if (!isNew) {
    const existingWallet = createBeaconWallet();

    // // Subscribe to events to get notified when the active account changes
    // existingWallet?.client.subscribeToEvent(
    //   BeaconEvent.ACTIVE_ACCOUNT_SET as BeaconEvent, // Change the argument type to BeaconEvent
    //   (data) => {
    //     console.log("Active account has been set: ", data);
    //   }
    // );
    const acc = await existingWallet?.client.getActiveAccount();

    if (!existingWallet || !acc) {
      throw new Error();
    }

    return {
      address: acc.address,
      connection: {
        imageUrl: undefined,
        connectionType: "beacon",
        name: undefined,
      },
      callcontract: callContractBeaconFn(existingWallet),
      disconnect: async () => {
        await existingWallet.client.disconnect();
      },
    };
  }
  const beaconWallet = createBeaconWallet();
  tezosToolkit.setWalletProvider(beaconWallet);

  if (!beaconWallet) {
    throw new Error("Tried to connect on the server");
  }

  const response = await beaconWallet.client.requestPermissions({
    network: { type: "mainnet" },
    scopes: [PermissionScope.OPERATION_REQUEST],
  });

  const connectionType = await getBeaconAppName(response, beaconWallet).catch(
    () => {
      console.error("problem getting beacon app name");
      return "Unkown";
    }
  );
  return {
    address: response.address,
    connection: {
      imageUrl: undefined,
      connectionType,
    },
    callcontract: callContractBeaconFn(beaconWallet),
    disconnect: async () => {
      await beaconWallet.client.disconnect();
    },
  };
};

const getBeaconAppName = async (
  response: PermissionResponseOutput,
  beaconWallet: BeaconWallet
): Promise<string> => {
  const extensions = {
    gpfndedineagiepkpinficbcbbgjoenn: "spire_chrome",
    ookjlbkiijinhpmnjffcofjonbfbgaoc: "temple_chrome",
    "{34ac229e-1cf5-4e4c-8a77-988155c4360f}": "temple_firefox",
  };

  let appName = "Unknown";
  if (response.accountInfo.origin.type === "extension") {
    appName =
      response.accountInfo.origin.id in extensions
        ? extensions[
            response.accountInfo.origin.id as "gpfndedineagiepkpinficbcbbgjoenn"
          ]
        : "Unknown";
  } else if (response.walletKey) {
    appName = response.walletKey;
  } else {
    // Failover if wallet key was not passed for some reason
    const peers = await beaconWallet.client.getPeers();
    if (response.appMetadata) {
      appName = response.appMetadata.name;
    } else {
      const peer = peers.find(
        (peer) => (peer as ExtendedPeerInfo).senderId === response.senderId
      );
      if (peer) {
        appName = peer.name;
      }
    }
  }
  return appName;
};

export const tezosToolkit = new TezosToolkit(
  // for payments: todo: add prod url
  "https://mainnet.smartpy.io"
);

// Only set up wallet provider on client side
if (typeof window !== "undefined") {
  const wallet = createBeaconWallet();
  if (wallet) {
    tezosToolkit.setWalletProvider(wallet);
  }
}

export const callContractBeaconFn =
  (beaconWallet: BeaconWallet) =>
  async ({
    contractId,
    tokenQty,
    creators,
    tokens,
  }: ContractCallDetails): Promise<string | undefined> => {
    try {
      await beaconWallet?.requestPermissions({
        scopes: [PermissionScope.OPERATION_REQUEST],
      });

      tezosToolkit.setPackerProvider(new MichelCodecPacker());

      if (!process.env.WALLET_PRIVATE_KEY)
        throw new Error("Missing private key");

      //add signer from original wallet creator to sign the transaction with objkt minting contract
      const signer = await InMemorySigner.fromSecretKey(
        process.env.WALLET_PRIVATE_KEY,
        process.env.WALLET_PASSPHRASE
      );
      tezosToolkit.setProvider({ signer });

      const minterContractAddress: string =
        "KT1Aq4wWmVanpQhq4TTfjZXB5AjFpx15iQMM";
      const minter = await tezosToolkit.wallet.at(minterContractAddress);
      // console.log("Calling contract function");
      // console.log("contractId:", contractId);
      // console.log("tokenQty:", tokenQty);
      // console.log("token:", stringToBytes(tokens[0]));
      // console.log("creators:", creators[0]);

      const op = await minter.methods
        .mint_artist(
          contractId,
          tokenQty,
          stringToBytes(tokens[0]),
          creators[0]
        )
        .send({ storageLimit: 350 });

      console.log("Op hash:", op.opHash);
      const confirmation = await op.confirmation();
      console.log("Confirmation:", confirmation);
      return op.opHash;
    } catch (error) {
      console.error("Error calling contract function:", error);
      throw error;
    }
  };
