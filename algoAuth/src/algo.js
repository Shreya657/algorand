import algosdk from 'algosdk';
import nacl from 'tweetnacl';

// =================================================================
// Algorand & Pera Wallet Setup
// =================================================================
const ALGORAND_CONFIG = {
    server: 'https://testnet-api.algonode.cloud',
    port: '',
    token: '',
    network: 'testnet'
};

const algodClient = new algosdk.Algodv2(
    ALGORAND_CONFIG.token,
    ALGORAND_CONFIG.server,
    ALGORAND_CONFIG.port
);

let PeraWalletConnect = null;
let peraWallet = null;
let connectedAccount = null;

const loadPeraWallet = async () => {
    if (!PeraWalletConnect) {
        try {
            const module = await import('@perawallet/connect');
            PeraWalletConnect = module.PeraWalletConnect;
            peraWallet = new PeraWalletConnect({
                shouldShowSignTxnToast: false,
            });
        } catch (error) {
            console.error('Failed to load Pera Wallet Connect:', error);
            throw new Error('Pera Wallet Connect not available');
        }
    }
    return peraWallet;
};

export const connectWallet = async () => {
    try {
        const wallet = await loadPeraWallet();
        const accounts = await wallet.connect();
        
        if (accounts && accounts.length > 0) {
            connectedAccount = accounts[0];
            localStorage.setItem('connectedWallet', connectedAccount);
            wallet.connector?.on('disconnect', handleDisconnectWalletEvent);
            
            return {
                success: true,
                address: connectedAccount,
                accounts: accounts
            };
        }
        
        throw new Error('No accounts found');
        
    } catch (error) {
        console.error('Pera Wallet connection failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const handleDisconnectWalletEvent = () => {
    connectedAccount = null;
    localStorage.removeItem('connectedWallet');
    console.log('Pera Wallet disconnected');
};

export const getConnectedWallet = () => {
    if (!connectedAccount) {
        const savedWallet = localStorage.getItem('connectedWallet');
        if (savedWallet) {
            connectedAccount = savedWallet;
        }
    }
    return connectedAccount;
};

export const isWalletConnected = async () => {
    try {
        if (!connectedAccount) {
            const savedWallet = localStorage.getItem('connectedWallet');
            if (savedWallet) {
                connectedAccount = savedWallet;
            } else {
                return false;
            }
        }

        const wallet = await loadPeraWallet();
        
        if (wallet.connector && wallet.connector.connected) {
            return true;
        }
        
        const accounts = await wallet.reconnectSession();
        if (accounts && accounts.length > 0) {
            connectedAccount = accounts[0];
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Wallet connection check failed:', error);
        return false;
    }
};

export const disconnectWallet = async () => {
    try {
        if (peraWallet) {
            await peraWallet.disconnect();
        }
        connectedAccount = null;
        localStorage.removeItem('connectedWallet');
        console.log('Wallet disconnected');
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
    }
};

// =================================================================
// Wallet Authenticator Functions
// =================================================================

/**
 * Signs a message using a 0-Algo transaction with the connected Pera Wallet.
 * Returns the base64-encoded signature.
 */
export const signMessage = async (message) => {
    if (!connectedAccount) {
        throw new Error('Please connect your Pera Wallet first');
    }
    
    try {
        const wallet = await loadPeraWallet();
        const suggestedParams = await algodClient.getTransactionParams().do();
        const messageUint8 = new TextEncoder().encode(message);

        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: connectedAccount,
            to: connectedAccount,
            amount: 0,
            note: messageUint8, // We put the message in the transaction note
            suggestedParams
        });

        const signedTxns = await wallet.signTransaction([
            { txn, signers: [connectedAccount] }
        ]);
        
        // Return the base64-encoded signature from the signed transaction
        return signedTxns[0].blob.toString('base64');

    } catch (error) {
        console.error('Error signing message:', error);
        throw new Error('Failed to sign message: ' + error.message);
    }
};

/**
 * Verifies a signed message using tweetnacl.
 * Returns true if the signature is valid.
 */
export const verifySignature = (message, signature, address) => {
    try {
        const publicKey = algosdk.decodeAddress(address).publicKey;
        const messageUint8 = new TextEncoder().encode(message);
        
        // Convert the base64 signature string to a Uint8Array
        const signatureUint8 = new Uint8Array(atob(signature).split('').map(c => c.charCodeAt(0)));
        
        return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKey);

    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
};

// =================================================================
// Other Utility Functions (included for completeness)
// =================================================================
export const getAccountBalance = async (address) => {
    try {
        const accountInfo = await algodClient.accountInformation(address).do();
        return {
            balance: accountInfo.amount / 1000000,
            assets: accountInfo.assets || []
        };
    } catch (error) {
        console.error('Error getting balance:', error);
        return null;
    }
};

export const utils = {
    formatAddress: (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },
    
    formatAlgos: (microAlgos) => {
        return (microAlgos / 1000000).toFixed(2);
    }
};