import React, { useState, useEffect } from 'react';
import { connectWallet, getConnectedWallet, disconnectWallet, utils } from '../utils/algorand';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css'

const Home = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectingAnimation, setShowConnectingAnimation] = useState(false);
  const navigate = useNavigate();

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const connectedWallet = getConnectedWallet();
    if (connectedWallet) {
      setWalletAddress(connectedWallet);
    }
  }, []);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setShowConnectingAnimation(true);
    
    try {
      const result = await connectWallet();
      if (result.success) {
        setWalletAddress(result.address);
        setTimeout(() => {
          setShowConnectingAnimation(false);
        }, 1500);
      } else {
        alert('Failed to connect wallet: ' + result.error);
        setShowConnectingAnimation(false);
      }
    } catch (error) {
      alert('Error connecting wallet: ' + error.message);
      setShowConnectingAnimation(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    setWalletAddress(null);
  };

  const navigateToOrganizer = () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }
    navigate('/organizer');
  };

  const navigateToClaimer = () => {
    navigate('/claim');
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="logo-container">
            <div className="logo">
              <span className="chain-text">Chain</span>
              <span className="badge-text">Badge</span>
            </div>
            <div className="logo-subtitle">Decentralized Event Badges</div>
          </div>

          <h1 className="hero-title">
            Verifiable Event Badges
            <span className="gradient-text"> on Algorand</span>
          </h1>

          <p className="hero-description">
            Create tamper-proof, blockchain-verified badges for events, achievements, 
            and milestones. No signup required - just connect your wallet and claim your badge.
          </p>

          {/* Wallet Connection Section */}
          <div className="wallet-section">
            {!walletAddress ? (
              <div className="connect-wallet-container">
                <button 
                  className={`connect-wallet-btn ${isConnecting ? 'connecting' : ''}`}
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                >
                  {showConnectingAnimation ? (
                    <div className="connecting-animation">
                      <div className="spinner"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="wallet-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M21 18V6H7V4C7 3.45 6.55 3 6 3H3C2.45 3 2 3.45 2 4V20C2 20.55 2.45 21 3 21H6C6.55 21 7 20.55 7 20V18H21Z" stroke="currentColor" strokeWidth="2"/>
                        <rect x="7" y="6" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="17" cy="12" r="1" fill="currentColor"/>
                      </svg>
                      Connect Wallet
                    </>
                  )}
                </button>
                <p className="wallet-hint">Connect with MyAlgo to get started</p>
              </div>
            ) : (
              <div className="connected-wallet">
                <div className="wallet-info">
                  <div className="wallet-address">
                    <div className="connected-indicator"></div>
                    <span>Connected: {utils.formatAddress(walletAddress)}</span>
                  </div>
                  <button 
                    className="disconnect-btn"
                    onClick={handleDisconnectWallet}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className="primary-btn organizer-btn"
              onClick={navigateToOrganizer}
            >
              <div className="btn-content">
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <div>
                  <div className="btn-title">Create Event</div>
                  <div className="btn-subtitle">For Organizers</div>
                </div>
              </div>
            </button>

            <button 
              className="secondary-btn claimer-btn"
              onClick={navigateToClaimer}
            >
              <div className="btn-content">
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <div>
                  <div className="btn-title">Claim Badge</div>
                  <div className="btn-subtitle">For Participants</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Floating Badge Animation */}
        <div className="floating-badges">
          <div className="floating-badge badge-1">🏆</div>
          <div className="floating-badge badge-2">🎖️</div>
          <div className="floating-badge badge-3">⭐</div>
          <div className="floating-badge badge-4">🎯</div>
          <div className="floating-badge badge-5">💎</div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="features-container">
          <h2 className="features-title">Why ChainBadge?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon blockchain-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Blockchain Verified</h3>
              <p>Every badge is minted on Algorand blockchain, making it tamper-proof and permanently verifiable.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon instant-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Instant Claims</h3>
              <p>No signup, no forms. Just connect your wallet and claim your badge in seconds.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon ownership-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>True Ownership</h3>
              <p>You own your badges forever. Display them in any compatible wallet or platform.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-content">
          <div className="footer-text">
            Built on <span className="algorand-text">Algorand</span> • Powered by Web3
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">About</a>
            <a href="#" className="footer-link">Help</a>
            <a href="#" className="footer-link">GitHub</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;