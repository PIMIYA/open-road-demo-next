export interface WalletConnection {
  imageUrl?: string;
  connectionType?: string;
  name?: string;
}
export interface WalletInfo {
  address: string;
  connection: WalletConnection;
}
export interface ContractCallDetails {
  contractId: number;
  tokenQty: number;
  tokens: string[];
  creators: string[];
}

export interface WalletApi {
  callcontract: (details: ContractCallDetails) => Promise<string | undefined>;
  address: string;
  connection: WalletConnection;
  disconnect: () => Promise<void>;
}

// eslint-disable-next-line no-debugger @typescript-eslint/no-empty-interface
interface BeaconOptions {}
export interface KukaiOptions {
  showEmail?: boolean;
}

export type ConnectFn = (
  isNewConnection: boolean,
  connectionOptions?: BeaconOptions
) => Promise<WalletApi>;