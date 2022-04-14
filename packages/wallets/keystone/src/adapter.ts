import {
    BaseSignerWalletAdapter, WalletConnectionError, WalletLoadError,
    WalletName,
    WalletNotConnectedError, WalletNotReadyError, WalletPublicKeyError,
    WalletReadyState,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base';
import {PublicKey, Transaction} from '@solana/web3.js';
import sdk, { PlayStatus, ReadStatus, SupportedResult } from "@keystonehq/sdk";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import Transport from "@ledgerhq/hw-transport";

interface KeystoneWallet {
    isKeystoneWallet?: boolean;
    getAccount(): Promise<string>;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

interface KeystoneWalletWindow extends Window {
    keystone?: KeystoneWallet;
}

declare const window: KeystoneWalletWindow;

export interface KeystoneWalletAdapterConfig {}

export const KeystoneWalletName = 'Keystone' as WalletName<'Keystone'>;

export class KeystoneWalletAdapter extends BaseSignerWalletAdapter {


    name = KeystoneWalletName;
    url = 'https://keyst.one';
    icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgA…2XAvgMoBfXHH7g6CgvhH/H3k2yZY7G4i5AAAAAElFTkSuQmCC";

    private _wallet: KeystoneWallet | null;
    private _publicKey: PublicKey | null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;
    private _connecting: boolean;

    constructor(config: KeystoneWalletAdapterConfig = {}) {
        super();
        this._wallet = null;
        this._publicKey = null;
        this._connecting = false;
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            if (this._readyState === WalletReadyState.Unsupported) throw new WalletNotReadyError();

            this._connecting = true;

            try {
                const { default: AirGapedKeyring } = await import(
                    '@keystonehq/eth-keyring'
                    )
                const keyring = AirGapedKeyring.getEmptyKeyring()
                await keyring.readKeyring()
            } catch (error: any) {
                throw new WalletLoadError(error?.message, error);
            }

            // let publicKey: PublicKey;
            // try {
            //     publicKey = await getPublicKey(transport, this._derivationPath);
            // } catch (error: any) {
            //     throw new WalletPublicKeyError(error?.message, error);
            // }

            const publicKey = new PublicKey("5vkq46DkwT3JCSgFQ1BVTR3G6GyQ1UyQsha9r8Uu93Di");
            this._publicKey = publicKey;
            this.emit('connect', publicKey);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    get connecting(): boolean {
        return this._connecting;
    }

    disconnect(): Promise<void> {
        return Promise.resolve();
    }

    get publicKey(): PublicKey | null {
        return this._publicKey;
    }

    get readyState(): WalletReadyState {
        return this._readyState;
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return wallet.signTransaction(transaction);
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return wallet.signAllTransactions(transactions);
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }


}
