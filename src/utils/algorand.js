import algosdk from 'algosdk';

// IPFS Configuration (Optional)
const IPFS_CONFIG = {
  // Option 1: Use NFT.Storage (Free)
  nftStorageKey: import.meta.env.VITE_NFT_STORAGE_KEY || null,
  
  // Option 2: Use Pinata
  pinataApiKey: import.meta.env.VITE_PINATA_API_KEY || null,
  pinataSecretKey: import.meta.env.VITE_PINATA_SECRET_KEY || null,
  
  // Option 3: Public IPFS gateway (for testing)
  usePublicGateway: true
};

/**
 * Upload metadata to IPFS (optional)
 */
const uploadToIPFS = async (metadata) => {
  try {
    // For now, return a placeholder URL
    // You can implement actual IPFS upload here
    if (IPFS_CONFIG.nftStorageKey) {
      // TODO: Implement NFT.Storage upload
      console.log('NFT.Storage upload would happen here');
    } else if (IPFS_CONFIG.pinataApiKey) {
      // TODO: Implement Pinata upload
      console.log('Pinata upload would happen here');
    }
    
    // Return placeholder for now
    return `ipfs://QmPlaceholder${Date.now()}`;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    return "ipfs://placeholder";
  }
};

/**
 * Generate badge image URL
 */
const generateBadgeImageUrl = (badgeType, eventName) => {
  // For now, use placeholder service
  // In production, you'd generate/upload actual badge images
  const colors = {
    'Participant': '4F46E5',
    'Speaker': '10B981', 
    'Winner': 'F59E0B'
  };
  
  const color = colors[badgeType] || '4F46E5';
  return `https://via.placeholder.com/512x512/${color}/FFFFFF?text=${encodeURIComponent(badgeType + ' Badge')}`;
};

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
export const createBadgeAsset = async (eventName, badgeType, recipientAddress = "HQFGHKHUNPU4X265KWLNFTDHLFVZ5BZO2REZ2QQLTS5Q3ASELDQAVF7WHQ") => {
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
    
    // Detailed wallet connection debugging
    console.log('=== WALLET CONNECTION DEBUG ===');
    console.log('Wallet object:', wallet);
    console.log('Wallet connector:', wallet.connector);
    console.log('Connector connected:', wallet.connector?.connected);
    console.log('Connector accounts:', wallet.connector?.accounts);
    
    // Try to get current session info
    try {
      const sessionAccounts = await wallet.reconnectSession();
      console.log('Session accounts:', sessionAccounts);
      if (!sessionAccounts || sessionAccounts.length === 0) {
        throw new Error('No active wallet session found. Please reconnect your Pera Wallet.');
      }
      // Update current account with session account
      currentAccount = sessionAccounts[0];
      connectedAccount = currentAccount;
      console.log('Using session account:', currentAccount);
    } catch (sessionError) {
      console.error('Session reconnect failed:', sessionError);
      throw new Error('Wallet session expired. Please disconnect and reconnect your Pera Wallet.');
    }
    
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
    console.log('Current account for transaction:', currentAccount);
    console.log('Suggested params:', suggestedParams);

    // Validate all required parameters before proceeding
    if (!currentAccount) {
      throw new Error('Current account is null or undefined');
    }
    if (!suggestedParams) {
      throw new Error('Suggested params is null or undefined');
    }
    if (!badgeMetadata.name) {
      throw new Error('Badge name is null or undefined');
    }

    // Use the simplest possible approach - manually construct the transaction object
    const txnParams = {
      from: currentAccount,
      total: 1,  // Use regular number instead of BigInt
      decimals: 0,
      assetName: badgeMetadata.name,
      unitName: "BADGE",
      assetURL: "ipfs://placeholder",
      defaultFrozen: false,
      suggestedParams: suggestedParams
      // Completely omit all optional address fields
    };
    
    console.log('Creating transaction with minimal params:', txnParams);
    
    let assetCreateTxn;
    try {
      assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(txnParams);
      console.log('✅ Transaction created successfully');
      console.log('Transaction details:', {
        type: assetCreateTxn.type,
        from: assetCreateTxn.from,
        fee: assetCreateTxn.fee
      });
    } catch (txnError) {
      console.error('❌ Transaction creation failed:', txnError);
      throw new Error(`Transaction creation failed: ${txnError.message}`);
    }


    console.log('Created transaction, signing...');

    // Ensure wallet is properly connected before signing
    try {
      // Check if wallet is still connected and try to reconnect if needed
      if (!wallet.connector || !wallet.connector.connected) {
        console.log('Wallet not connected, attempting to reconnect...');
        const accounts = await wallet.reconnectSession();
        if (!accounts || accounts.length === 0) {
          throw new Error('Failed to reconnect wallet');
        }
        console.log('Wallet reconnected successfully');
      }
    } catch (reconnectError) {
      console.log('Reconnect failed, wallet might not be properly connected:', reconnectError.message);
      throw new Error('Please reconnect your Pera Wallet and try again');
    }

    // Sign transaction with Pera Wallet - try simplified signing method
    console.log('Attempting to sign transaction...');
    const signingPromise = wallet.signTransaction([[{
      txn: assetCreateTxn
    }]]);
    
    const signingTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Wallet signing timeout after 60 seconds - please check your Pera Wallet app')), 60000);
    });
    
    console.log('Waiting for wallet signature...');
    const signedTxns = await Promise.race([signingPromise, signingTimeoutPromise]);

    console.log('Transaction signed, submitting...');

    // Submit transaction with timeout
    const submitPromise = algodClient.sendRawTransaction(signedTxns[0]).do();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Transaction submission timeout after 30 seconds')), 30000);
    });
    
    const { txId } = await Promise.race([submitPromise, timeoutPromise]);
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
      [{ txn: transferTxn }]
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
      [{ txn: optInTxn }]
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
 * Wait for transaction confirmation with timeout
 */
const waitForConfirmation = async (txId, maxRounds = 10) => {
  let lastStatus = await algodClient.status().do();
  let lastRound = lastStatus['last-round'];
  let currentRound = 0;

  while (currentRound < maxRounds) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      console.log(`Transaction ${txId} confirmed in round ${pendingInfo['confirmed-round']}`);
      return pendingInfo;
    }

    if (pendingInfo['pool-error']) {
      throw new Error(`Transaction failed: ${pendingInfo['pool-error']}`);
    }

    lastRound++;
    currentRound++;
    console.log(`Waiting for confirmation... Round ${currentRound}/${maxRounds}`);
    await algodClient.statusAfterBlock(lastRound).do();
  }
  
  throw new Error(`Transaction ${txId} not confirmed after ${maxRounds} rounds`);
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

/**
 * SIMPLE TEST FUNCTION - Create badge without wallet signing (for testing)
 */
export const createBadgeAssetTest = async (eventName, badgeType) => {
  console.log('Creating test badge for:', { eventName, badgeType });
  
  // Simulate badge creation for testing
  const testAssetId = Math.floor(Math.random() * 1000000) + 100000;
  const testTxId = 'TEST_' + Date.now();
  
  const badgeMetadata = {
    name: `${eventName} - ${badgeType} Badge`,
    description: `Official ${badgeType} badge for ${eventName}`,
    image: `https://via.placeholder.com/300x300/4F46E5/white?text=${badgeType}`,
    event: eventName,
    type: badgeType,
    issued: new Date().toISOString()
  };
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Test badge created successfully!');
  
  return {
    success: true,
    assetId: testAssetId,
    txId: testTxId,
    metadata: badgeMetadata,
    isTest: true
  };
};

/**
 * REAL ASA CREATION - Fixed wallet signing approach
 */
export const createRealBadgeAsset = async (eventName, badgeType, recipientAddress = null) => {
  console.log('createRealBadgeAsset called with:', { eventName, badgeType, recipientAddress });
  
  // Get the current connected account
  let currentAccount = connectedAccount || getConnectedWallet();
  
  if (!currentAccount) {
    throw new Error('Please connect your Pera Wallet first');
  }

  console.log('Using connected account:', currentAccount);

  try {
    const wallet = await loadPeraWallet();
    
    // Ensure wallet is properly connected with fresh session
    try {
      // First check if connector exists and is connected
      if (!wallet.connector || !wallet.connector.connected) {
        console.log('❌ Wallet not connected, requesting fresh connection...');
        throw new Error('Wallet session expired. Please reconnect your Pera Wallet.');
      }
      
      // Try to get fresh session accounts
      console.log('🔄 Refreshing wallet session...');
      const sessionAccounts = await wallet.reconnectSession();
      if (sessionAccounts && sessionAccounts.length > 0) {
        currentAccount = sessionAccounts[0];
        connectedAccount = currentAccount;
        console.log('✅ Fresh session established with account:', currentAccount);
      } else {
        console.log('❌ No accounts in session');
        throw new Error('No active wallet session. Please reconnect your Pera Wallet.');
      }
    } catch (sessionError) {
      console.log('❌ Session check failed:', sessionError.message);
      throw new Error('Wallet connection lost. Please disconnect and reconnect your Pera Wallet, then try again.');
    }
    
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

    // Create asset with minimal parameters (based on memory guidance)
    const assetURL = await uploadToIPFS(badgeMetadata);
    // Update the assetURL in the txnParams
    const txnParams = {
      from: currentAccount,
      total: 1,  // Use regular number (not BigInt)
      decimals: 0,
      assetName: badgeMetadata.name,
      unitName: "BADGE",
      assetURL: assetURL, // Use the generated URL instead of placeholder
      defaultFrozen: false,
      suggestedParams: suggestedParams
      // Omit optional address parameters as per memory guidance
    };
    
    console.log('Creating transaction with params:', txnParams);
    const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(txnParams);
    console.log('✅ Transaction created successfully');

    console.log('Requesting wallet signature...');
    console.log('📱 Please check your Pera Wallet mobile app and approve the transaction');
    console.log('🔍 If no notification appears, the wallet connection may need to be refreshed');
    
    // Try signing with timeout and retry logic
    let signedTxns;
    try {
      // Create a promise that will timeout
      const signingPromise = wallet.signTransaction([[{
        txn: assetCreateTxn
      }]]);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Signing timeout - no response from Pera Wallet after 30 seconds'));
        }, 30000);
      });
      
      console.log('⏳ Waiting for wallet signature (30 second timeout)...');
      signedTxns = await Promise.race([signingPromise, timeoutPromise]);
      
    } catch (signingError) {
      console.log('❌ Signing failed:', signingError.message);
      if (signingError.message.includes('timeout') || signingError.message.includes('User rejected')) {
        console.log('🔄 Wallet signing timeout - this might be due to WalletConnect session issues');
        console.log('💡 Suggestion: Try closing and reopening your Pera Wallet mobile app, then reconnect');
        throw new Error('Wallet signing timeout. This can happen due to WalletConnect session issues. Please:\n1. Close your Pera Wallet mobile app\n2. Reopen the app\n3. Disconnect and reconnect your wallet in the browser\n4. Try creating the badge again');
      }
      throw signingError;
    }

    console.log('✅ Transaction signed successfully');
    console.log('Submitting to Algorand network...');

    // Submit transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxns[0]).do();
    console.log('Transaction submitted with ID:', txId);

    // Wait for confirmation with timeout
    const confirmedTxn = await waitForConfirmation(txId, 10);
    
    const assetId = confirmedTxn['asset-index'];
    console.log('🎉 Real ASA created with Asset ID:', assetId);

    // Update global state
    connectedAccount = currentAccount;

    return {
      success: true,
      assetId: assetId,
      txId: txId,
      metadata: badgeMetadata,
      isTest: false // This is a real ASA
    };

  } catch (error) {
    console.error('Real ASA creation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create real ASA'
    };
  }
};