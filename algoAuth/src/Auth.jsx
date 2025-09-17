import React, { useState } from 'react';
import { connectWallet, getConnectedWallet, signMessage, verifySignature, utils } from './algo';

const Auth = () => {
  const [walletAddress, setWalletAddress] = useState(getConnectedWallet());
  const [status, setStatus] = useState('Please connect your wallet to authenticate.');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleConnect = async () => {
    const result = await connectWallet();
    if (result.success) {
      setWalletAddress(result.address);
      setStatus('Wallet connected. Now you can authenticate.');
    } else {
      setStatus('Failed to connect wallet.');
    }
  };

  const handleAuthenticate = async () => {
    if (!walletAddress) {
      setStatus('Please connect your wallet first.');
      return;
    }
    
    setIsAuthenticating(true);
    setStatus('Asking you to sign a message...');

    try {
      // The message to be signed
      const message = "Verify your identity for ChainAuth";
      const signature = await signMessage(message);

      if (!signature) {
        setStatus('Authentication cancelled.');
        setIsAuthenticating(false);
        return;
      }

      // Verify the signature (this happens locally)
      const isVerified = verifySignature(message, signature, walletAddress);

      if (isVerified) {
        setStatus('✅ Authentication successful! Your identity is verified.');
      } else {
        setStatus('❌ Authentication failed. Signature could not be verified.');
      }

    } catch (error) {
      setStatus(`Authentication failed: ${error.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', textAlign: 'center' }}>
      <h1>Algorand Wallet Authenticator</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>Authenticate with your Algorand wallet without a password.</p>

      {walletAddress ? (
        <div>
          <p>Connected: **{utils.formatAddress(walletAddress)}**</p>
          <button 
            onClick={handleAuthenticate} 
            disabled={isAuthenticating}
            style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}
          >
            {isAuthenticating ? 'Authenticating...' : 'Authenticate with Wallet'}
          </button>
        </div>
      ) : (
        <button 
          onClick={handleConnect}
          style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}
        >
          Connect Pera Wallet
        </button>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <p>Status: <strong>{status}</strong></p>
      </div>
    </div>
  );
};

export default Auth;