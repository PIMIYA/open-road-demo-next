import { BeaconWallet } from '@taquito/beacon-wallet'
import {
  ExtendedPeerInfo,
  PermissionResponseOutput,
  PermissionScope
} from '@airgap/beacon-types'

import { MichelCodecPacker, TezosToolkit } from '@taquito/taquito'
import { ConnectFn, ContractCallDetails } from './types'

const createBeaconWallet = () =>
  typeof window === 'undefined'
    ? undefined
    : new BeaconWallet({
        name: 'Kairos',
        // appUrl: 'localhost:3000',    
        preferredNetwork: "mainnet",
        // walletConnectOptions: {
        //   projectId: '97f804b46f0db632c52af0556586a5f3',
        //   relayUrl: 'wss://relay.walletconnect.com'
        // },
        featuredWallets: ['kukai', 'trust', 'temple', 'umami'],
        // disableDefaultEvents: false, // Disable all events when true/ UI. This also disables the pairing alert.
      } as any)

export const connectBeacon: ConnectFn = async (isNew) => {
  if (!isNew) {
    const existingWallet = createBeaconWallet()
    const acc = await existingWallet?.client.getActiveAccount()

    if (!existingWallet || !acc) {
      throw new Error()
    }

    return {
      address: acc.address,
      connection: {
        imageUrl: undefined,
        connectionType: 'beacon',
        name: undefined
      },
      callcontract: callContractBeaconFn(existingWallet) ,
      disconnect: async () => {
        await existingWallet.client.disconnect()
      }
    }
  }
  const beaconWallet = createBeaconWallet()
  tezosToolkit.setWalletProvider(beaconWallet)

  if (!beaconWallet) {
    throw new Error('Tried to connect on the server')
  }

  const response = await beaconWallet.client.requestPermissions({
    network: {
      type: "mainnet" as any
    },
    scopes: [PermissionScope.OPERATION_REQUEST]
  })

  const connectionType = await getBeaconAppName(response, beaconWallet).catch(
    () => {
      console.error('problem getting beacon app name')
      return 'Unkown'
    }
  )
  return {
    address: response.address,
    connection: {
      imageUrl: undefined,
      connectionType
    },
    callcontract: callContractBeaconFn(beaconWallet) ,
    disconnect: async () => {
      await beaconWallet.client.disconnect()
    }
  }
}

const getBeaconAppName = async (
  response: PermissionResponseOutput,
  beaconWallet: BeaconWallet
): Promise<string> => {
  const extensions = {
    gpfndedineagiepkpinficbcbbgjoenn: 'spire_chrome',
    ookjlbkiijinhpmnjffcofjonbfbgaoc: 'temple_chrome',
    '{34ac229e-1cf5-4e4c-8a77-988155c4360f}': 'temple_firefox'
  }

  let appName = 'Unknown'
  if (response.accountInfo.origin.type === 'extension') {
    appName =
      response.accountInfo.origin.id in extensions
        ? extensions[
            response.accountInfo.origin.id as 'gpfndedineagiepkpinficbcbbgjoenn'
          ]
        : 'Unknown'
  } else if (response.walletKey) {
    appName = response.walletKey
  } else {
    // Failover if wallet key was not passed for some reason
    const peers = await beaconWallet.client.getPeers()
    if (response.appMetadata) {
      appName = response.appMetadata.name
    } else {
      const peer = peers.find(
        peer => (peer as ExtendedPeerInfo).senderId === response.senderId
      )
      if (peer) {
        appName = peer.name
      }
    }
  }
  return appName
}

export const tezosToolkit = new TezosToolkit(
  // for payments: todo: add prod url
  'https://mainnet.smartpy.io'
)
tezosToolkit.setPackerProvider(new MichelCodecPacker())

export const callContractBeaconFn =
  (beaconWallet: BeaconWallet) =>
  async ({ amountMutez, contractAddress, id }: ContractCallDetails) => {
    await beaconWallet?.requestPermissions({
      network: {
        type: "mainnet" as any
      },
      scopes: [PermissionScope.OPERATION_REQUEST]
    })
    const contract = await tezosToolkit.contract.at(contractAddress)

    const transfer = contract.methods.default().toTransferParams()
    transfer.parameter = {
      entrypoint: 'default',
      value: {
        prim: 'Pair',
        args: [
          {
            string: id
          }
        ]
      }
    }
    transfer.mutez = true
    transfer.amount = amountMutez
    const walletCmd = tezosToolkit.wallet.transfer(transfer)
    await walletCmd.send()
    return await Promise.resolve('')
  }