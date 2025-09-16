import algosdk from 'algosdk';

// Algorand Testnet Configuration
const ALGORAND_CONFIG = {
  server: 'https://testnet-api.algonode.cloud',
  port: '',
  token: '',
  network: 'testnet'
};

// Initialize Algorand client
const algodClient = new algosdk.Algodv2(
  ALGORAND_CONFIG.token,
  ALGORAND_CONFIG.server,
  ALGORAND_CONFIG.port
);

// Pera Wallet Connect Configuration
let PeraWalletConnect = null;
let peraWallet = null;

// Load Pera Wallet Connect dynamically
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

// Global state for connected wallet
let connectedAccount = null;

/**
 * Connect to Pera Wallet via WalletConnect (QR Code)
 */
export const connectWallet = async () => {
  try {
    const wallet = await loadPeraWallet();
    
    // Connect to Pera Wallet (shows QR code)
    const accounts = await wallet.connect();
    
    if (accounts && accounts.length > 0) {
      connectedAccount = accounts[0];
      console.log('Connected to Pera Wallet:', connectedAccount);
      
      // Save to localStorage for persistence
      localStorage.setItem('connectedWallet', connectedAccount);
      
      // Listen for disconnect events
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

/**
 * Handle wallet disconnect event
 */
const handleDisconnectWalletEvent = () => {
  connectedAccount = null;
  localStorage.removeItem('connectedWallet');
  console.log('Pera Wallet disconnected');
};

/**
 * Get connected wallet address - check localStorage first
 */
export const getConnectedWallet = () => {
  if (!connectedAccount) {
    // Check localStorage for persisted connection
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      connectedAccount = savedWallet;
    }
  }
  return connectedAccount;
};

/**
 * Check if wallet is actually connected (not just cached)
 */
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
    
    // Check if wallet is still connected
    if (wallet.connector && wallet.connector.connected) {
      return true;
    }
    
    // Try to reconnect automatically
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

/**
 * Disconnect wallet
 */
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

/**
 * Get account balance
 */
export const getAccountBalance = async (address) => {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return {
      balance: accountInfo.amount / 1000000, // Convert microAlgos to Algos
      assets: accountInfo.assets || []
    };
  } catch (error) {
    console.error('Error getting balance:', error);
    return null;
  }
};

/**
 * Create Badge Asset (ASA) - This is your NFT badge
 */
export const createBadgeAsset = async (eventName, badgeType, recipientAddress = null) => {
  console.log('createBadgeAsset called with:', { eventName, badgeType, recipientAddress });
  
  // Get the current connected account - check multiple sources
  let currentAccount = connectedAccount || getConnectedWallet();
  
  // If still no account, try to get it from Pera Wallet directly
  if (!currentAccount) {
    try {
      const wallet = await loadPeraWallet();
      if (wallet.connector && wallet.connector.accounts && wallet.connector.accounts.length > 0) {
        currentAccount = wallet.connector.accounts[0];
        connectedAccount = currentAccount; // Update our global state
        localStorage.setItem('connectedWallet', currentAccount);
        console.log('Retrieved account from Pera Wallet connector:', currentAccount);
      }
    } catch (error) {
      console.error('Failed to get account from wallet connector:', error);
    }
  }
  
  if (!currentAccount) {
    console.error('No account found. connectedAccount:', connectedAccount);
    throw new Error('Please reconnect your Pera Wallet - no account found');
  }

  console.log('Using connected account:', currentAccount);

  try {
    const wallet = await loadPeraWallet();
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    console.log('Got suggested params:', suggestedParams);

    // Badge metadata
    const badgeMetadata = {
      name: `${eventName} - ${badgeType} Badge`,
      description: `Official ${badgeType} badge for ${eventName}`,
      image: `https://via.placeholder.com/300x300/4F46E5/white?text=${badgeType}`,
      event: eventName,
      type: badgeType,
      issued: new Date().toISOString()
    };

    console.log('Creating badge with metadata:', badgeMetadata);

    // Create asset creation transaction - use currentAccount instead of connectedAccount
    const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: currentAccount, // Use currentAccount here
      total: 1,
      decimals: 0,
      assetName: badgeMetadata.name,
      unitName: 'BADGE',
      assetURL: `ipfs://placeholder`,
      assetMetadataHash: undefined,
      defaultFrozen: false,
      freeze: undefined,
      manager: currentAccount, // Use currentAccount here too
      clawback: undefined,
      reserve: undefined,
      strictEmptyAddressChecking: false,
      suggestedParams
    });

    console.log('Created transaction, signing...');

    // Sign transaction with Pera Wallet - use currentAccount in signers
    const signedTxns = await wallet.signTransaction([
      [{ txn: assetCreateTxn, signers: [currentAccount] }]
    ]);

    console.log('Transaction signed, submitting...');

    // Submit transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxns[0]).do();
    console.log('Transaction submitted with ID:', txId);

    // Wait for confirmation
    const confirmedTxn = await waitForConfirmation(txId);
    
    const assetId = confirmedTxn['asset-index'];
    console.log('Badge created with Asset ID:', assetId);

    // Update global state with successful account
    connectedAccount = currentAccount;

    // If recipient address provided, transfer the badge to them
    if (recipientAddress && recipientAddress !== currentAccount) {
      await transferBadge(assetId, recipientAddress);
    }

    return {
      success: true,
      assetId: assetId,
      txId: txId,
      metadata: badgeMetadata
    };

  } catch (error) {
    console.error('Badge creation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create badge'
    };
  }
};

/**
 * Transfer badge to recipient
 */
export const transferBadge = async (assetId, recipientAddress) => {
  if (!connectedAccount) {
    throw new Error('Pera Wallet not connected');
  }

  try {
    const wallet = await loadPeraWallet();
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Create transfer transaction
    const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: connectedAccount,
      to: recipientAddress,
      amount: 1, // Transfer 1 badge
      assetIndex: assetId,
      suggestedParams
    });

    // Sign and submit
    const signedTxns = await wallet.signTransaction([
      [{ txn: transferTxn, signers: [connectedAccount] }]
    ]);
    
    const { txId } = await algodClient.sendRawTransaction(signedTxns[0]).do();
    await waitForConfirmation(txId);

    return {
      success: true,
      txId: txId
    };

  } catch (error) {
    console.error('Badge transfer failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Opt-in to receive an asset
 */
export const optInToAsset = async (assetId) => {
  if (!connectedAccount) {
    throw new Error('Pera Wallet not connected');
  }

  try {
    const wallet = await loadPeraWallet();
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Create opt-in transaction (amount = 0, from = to)
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: connectedAccount,
      to: connectedAccount,
      amount: 0,
      assetIndex: assetId,
      suggestedParams
    });

    const signedTxns = await wallet.signTransaction([
      [{ txn: optInTxn, signers: [connectedAccount] }]
    ]);
    
    const { txId } = await algodClient.sendRawTransaction(signedTxns[0]).do();
    await waitForConfirmation(txId);

    return {
      success: true,
      txId: txId
    };

  } catch (error) {
    console.error('Asset opt-in failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * CLAIM BADGE - Main claiming function for participants
 */
export const claimBadge = async (assetId, organizerAddress) => {
  if (!connectedAccount) {
    throw new Error('Please connect your Pera Wallet first');
  }

  try {
    // Step 1: Opt-in to receive the badge asset
    console.log('Step 1: Opting in to badge asset...');
    const optInResult = await optInToAsset(assetId);
    
    if (!optInResult.success) {
      throw new Error('Failed to opt-in to badge asset');
    }

    // Step 2: Get asset info to show user what they're claiming
    console.log('Step 2: Getting badge info...');
    const assetInfo = await getAssetInfo(assetId);
    
    return {
      success: true,
      message: 'Badge claimed successfully!',
      assetId: assetId,
      txId: optInResult.txId,
      badgeInfo: assetInfo.asset
    };

  } catch (error) {
    console.error('Badge claiming failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * SIMPLIFIED CLAIM - Create badge directly to claimer (MVP version)
 */
export const claimBadgeSimple = async (eventName, badgeType) => {
  if (!connectedAccount) {
    throw new Error('Please connect your Pera Wallet first');
  }

  try {
    // Create badge directly to the connected wallet
    const result = await createBadgeAsset(eventName, badgeType, connectedAccount);
    
    if (result.success) {
      return {
        success: true,
        message: `${badgeType} badge claimed successfully!`,
        assetId: result.assetId,
        txId: result.txId,
        badgeInfo: result.metadata
      };
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('Simple badge claiming failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get badges owned by an address
 */
export const getBadgesOwnedByAddress = async (address) => {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    const assets = accountInfo.assets || [];

    // Filter for badge assets (you can add more sophisticated filtering)
    const badges = assets.filter(asset => asset.amount > 0).map(asset => ({
      assetId: asset['asset-id'],
      amount: asset.amount
    }));

    // Get asset details for each badge
    const badgeDetails = await Promise.all(
      badges.map(async (badge) => {
        try {
          const assetInfo = await algodClient.getAssetByID(badge.assetId).do();
          return {
            assetId: badge.assetId,
            name: assetInfo.params.name,
            unitName: assetInfo.params['unit-name'],
            url: assetInfo.params.url,
            total: assetInfo.params.total,
            creator: assetInfo.params.creator
          };
        } catch (error) {
          console.error(`Error fetching asset ${badge.assetId}:`, error);
          return null;
        }
      })
    );

    return badgeDetails.filter(badge => badge !== null);

  } catch (error) {
    console.error('Error getting badges:', error);
    return [];
  }
};

/**
 * Wait for transaction confirmation
 */
const waitForConfirmation = async (txId) => {
  let lastStatus = await algodClient.status().do();
  let lastRound = lastStatus['last-round'];

  while (true) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      console.log(`Transaction ${txId} confirmed in round ${pendingInfo['confirmed-round']}`);
      return pendingInfo;
    }

    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
  }
};

/**
 * Generate claim URL for a badge
 */
export const generateClaimUrl = (eventId, assetId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/claim?event=${eventId}&badge=${assetId}`;
};

/**
 * Get asset info by ID
 */
export const getAssetInfo = async (assetId) => {
  try {
    const assetInfo = await algodClient.getAssetByID(assetId).do();
    return {
      success: true,
      asset: {
        id: assetId,
        name: assetInfo.params.name,
        unitName: assetInfo.params['unit-name'],
        total: assetInfo.params.total,
        creator: assetInfo.params.creator,
        url: assetInfo.params.url
      }
    };
  } catch (error) {
    console.error('Error getting asset info:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export utility functions
export const utils = {
  formatAddress: (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },
  
  formatAlgos: (microAlgos) => {
    return (microAlgos / 1000000).toFixed(2);
  }
};