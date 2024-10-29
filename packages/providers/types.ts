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
    collection_id: number;
    editions: number;
    metadata_cid: string[];
    target: string[];
  }
  
  export interface WalletApi {
    callcontract: (details: ContractCallDetails) => Promise<string | undefined>;
    address: string;
    connection: WalletConnection;
    disconnect: () => Promise<void>;
  }
  
   interface BeaconOptions {}
  export interface KukaiOptions {
    showEmail?: boolean;
  }
  
  export type ConnectFn = (
    isNewConnection: boolean,
    connectionOptions?: BeaconOptions
  ) => Promise<WalletApi>;