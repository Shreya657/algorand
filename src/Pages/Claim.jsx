import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { 
  connectWallet, 
  getConnectedWallet, 
  isWalletConnected,
  claimBadgeSimple,
  createBadgeAssetTest,  // Add test function
  getBadgesOwnedByAddress,
  utils 
} from '../utils/algorand';
import '../styles/Claim.css';

const Claim = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [ownedBadges, setOwnedBadges] = useState([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
  
  // Navigate to home
  const navigateToHome = () => {
    navigate('/');
  };
  // Get claim parameters from URL
  const eventId = searchParams.get('event');
  const badgeId = searchParams.get('badge');
  
  // Manual claim form
  const [manualClaim, setManualClaim] = useState({
    eventName: '',
    badgeType: 'Participant'
  });

  // Check wallet connection on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      const connectedWallet = getConnectedWallet();
      if (connectedWallet) {
        const isConnected = await isWalletConnected();
        if (isConnected) {
          setWalletAddress(connectedWallet);
          loadOwnedBadges(connectedWallet);
        } else {
          setWalletAddress(null);
        }
      }
    };
    
    checkWalletConnection();
  }, []);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const result = await connectWallet();
      if (result.success) {
        setWalletAddress(result.address);
        loadOwnedBadges(result.address);
      } else {
        alert('Failed to connect wallet: ' + result.error);
      }
    } catch (error) {
      alert('Error connecting wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadOwnedBadges = async (address) => {
    setIsLoadingBadges(true);
    try {
      // Load real blockchain badges
      const realBadges = await getBadgesOwnedByAddress(address);
      
      // Load test badges from localStorage
      const testBadges = JSON.parse(localStorage.getItem('testBadges') || '[]');
      
      // Combine real and test badges
      const allBadges = [...realBadges, ...testBadges];
      setOwnedBadges(allBadges);
    } catch (error) {
      console.error('Error loading badges:', error);
      // If blockchain call fails, at least show test badges
      const testBadges = JSON.parse(localStorage.getItem('testBadges') || '[]');
      setOwnedBadges(testBadges);
    } finally {
      setIsLoadingBadges(false);
    }
  };

  const handleClaimBadge = async (eventName, badgeType) => {
    if (!walletAddress) {
      alert('Please connect your Pera Wallet first');
      return;
    }

    setIsClaiming(true);
    setClaimResult(null);

    try {
      console.log(`Claiming ${badgeType} badge for ${eventName}...`);
      
      // Call claimBadgeSimple which now handles real/test fallback internally
      const result = await claimBadgeSimple(eventName, badgeType);
      console.log('Badge claim result:', result);
      
      setClaimResult(result);
      
      if (result.success) {
        // Handle badge storage based on whether it's test or real
        if (result.isTest) {
          // For test badges, store them locally
          const testBadges = JSON.parse(localStorage.getItem('testBadges') || '[]');
          const newTestBadge = {
            assetId: result.assetId,
            name: result.badgeInfo.name,
            unitName: 'BADGE',
            creator: walletAddress,
            isTest: true,
            claimedAt: new Date().toISOString()
          };
          testBadges.push(newTestBadge);
          localStorage.setItem('testBadges', JSON.stringify(testBadges));
          
          // Update owned badges to include test badges
          setOwnedBadges(prev => [...prev, newTestBadge]);
        } else {
          // For real badges, reload from blockchain
          await loadOwnedBadges(walletAddress);
        }
      }
    } catch (error) {
      console.error('Badge claiming error:', error);
      setClaimResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleManualClaimSubmit = (e) => {
    e.preventDefault();
    if (!manualClaim.eventName.trim()) {
      alert('Please enter an event name');
      return;
    }
    handleClaimBadge(manualClaim.eventName, manualClaim.badgeType);
  };

  const handleManualClaimChange = (e) => {
    const { name, value } = e.target;
    setManualClaim(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!walletAddress) {
    return (
      <div className={`claim-container ${darkMode ? 'dark' : 'light'}`}>
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-logo" onClick={navigateToHome}>
              <span className="chain-text">Chain</span>
              <span className="badge-text">Badge</span>
            </div>
            <div className="nav-title">
              <h1>Claim Badge</h1>
            </div>
            <div className="nav-actions">
              {/* Theme controlled from home page */}
            </div>
          </div>
        </nav>
        
        <div className="connect-prompt">
          <div className="connect-card">
            <h2>Connect Your Wallet</h2>
            <p>Connect your wallet to claim event badges</p>
            <button 
              className="connect-btn"
              onClick={handleConnectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                'Connect Wallet'
              )}
            </button>
            <p className="connect-hint">Scan QR code with your wallet app</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`claim-container ${darkMode ? 'dark' : 'light'}`}>
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo" onClick={navigateToHome}>
            <span className="chain-text">Chain</span>
            <span className="badge-text">Badge</span>
          </div>
          <div className="nav-title">
            <h1>Claim Badge</h1>
          </div>
          <div className="nav-actions">
            <div className="wallet-connected-nav">
              <span className="wallet-address-nav">{utils.formatAddress(walletAddress)}</span>
              <div className="wallet-status">Connected</div>
            </div>
          </div>
        </div>
      </nav>
      {/* Header */}
      <div className="claim-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Claim Event Badges</h1>
            <p>Claim your blockchain-verified event participation badges</p>
          </div>
          <div className="wallet-info">
            <div className="connected-wallet">
              <div className="wallet-indicator"></div>
              <span>Connected: {utils.formatAddress(walletAddress)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* URL-based Claim Section */}
      {(eventId && badgeId) && (
        <div className="url-claim-section">
          <div className="claim-card">
            <h2>🎫 Badge Ready to Claim</h2>
            <div className="badge-preview">
              <div className="badge-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="badge-details">
                <h3>Event Badge</h3>
                <p>Event ID: {eventId}</p>
                <p>Badge ID: {badgeId}</p>
              </div>
            </div>
            <button 
              className="claim-btn primary"
              onClick={() => handleClaimBadge('Event_' + eventId, 'Participant')}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <span>Claiming...</span>
                </div>
              ) : (
                'Claim This Badge'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Manual Claim Section */}
      <div className="manual-claim-section">
        <div className="claim-card">
          <h2>🏷️ Manual Badge Claim</h2>
          <p>Enter event details to claim your badge</p>
          
          <form onSubmit={handleManualClaimSubmit} className="claim-form">
            <div className="form-group">
              <label>Event Name *</label>
              <input
                type="text"
                name="eventName"
                value={manualClaim.eventName}
                onChange={handleManualClaimChange}
                placeholder="e.g. Web3 Developer Conference 2024"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Badge Type</label>
              <select
                name="badgeType"
                value={manualClaim.badgeType}
                onChange={handleManualClaimChange}
              >
                <option value="Participant">Participant Badge</option>
                <option value="Speaker">Speaker Badge</option>
                <option value="Winner">Winner Badge</option>
              </select>
            </div>
            
            <button 
              type="submit"
              className="claim-btn primary"
              disabled={isClaiming}
            >
              {isClaiming ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <span>Claiming...</span>
                </div>
              ) : (
                'Claim Badge'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Claim Result */}
      {claimResult && (
        <div className="claim-result-section">
          <div className={`result-card ${claimResult.success ? 'success' : 'error'}`}>
            {claimResult.success ? (
              <>
                <div className="success-icon">🎉</div>
                <h3>Badge Claimed Successfully!</h3>
                <p>{claimResult.message}</p>
                <div className="badge-info">
                  <div className="info-item">
                    <span className="label">Asset ID:</span>
                    <span className="value">{claimResult.assetId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Transaction ID:</span>
                    <span className="value">{utils.formatAddress(claimResult.txId)}</span>
                  </div>
                  {claimResult.isTest && (
                    <div className="test-notice">
                      <span className="test-badge">🧪 TEST MODE</span>
                      <span>This badge is simulated and won't appear in your Pera Wallet</span>
                    </div>
                  )}
                  {!claimResult.isTest && (
                    <div className="real-notice">
                      <span className="real-badge">🌐 REAL ASA</span>
                      <span>This badge is on Algorand testnet and will appear in your Pera Wallet</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="error-icon">❌</div>
                <h3>Claim Failed</h3>
                <p>{claimResult.error}</p>
                <button 
                  className="retry-btn"
                  onClick={() => setClaimResult(null)}
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Owned Badges Section */}
      <div className="owned-badges-section">
        <div className="section-header">
          <h2>🏆 Your Badges</h2>
          <p>Blockchain-verified badges in your wallet</p>
          <button 
            className="refresh-btn"
            onClick={() => loadOwnedBadges(walletAddress)}
            disabled={isLoadingBadges}
          >
            {isLoadingBadges ? (
              <div className="spinner small"></div>
            ) : (
              '🔄 Refresh'
            )}
          </button>
        </div>

        <div className="badges-grid">
          {isLoadingBadges ? (
            <div className="loading-badges">
              <div className="spinner"></div>
              <span>Loading your badges...</span>
            </div>
          ) : ownedBadges.length > 0 ? (
            ownedBadges.map((badge) => (
              <div key={badge.assetId} className="badge-card">
                <div className="badge-card-header">
                  <div className={`badge-type-indicator ${badge.isTest ? 'test' : ''}`}>
                    {badge.isTest ? 'TEST BADGE' : 'Badge'}
                  </div>
                  <div className="badge-asset-id">#{badge.assetId}</div>
                </div>

                <div className="badge-content">
                  <div className="badge-icon large">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M6 9C6 10.45 6.39 11.78 7.07 12.93L12 22L16.93 12.93C17.61 11.78 18 10.45 18 9C18 5.13 14.87 2 11 2H13C9.13 2 6 5.13 6 9Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3>{badge.name || 'Event Badge'}</h3>
                  <p>{badge.unitName || 'BADGE'}</p>
                </div>

                <div className="badge-details">
                  <div className="detail-item">
                    <span className="detail-label">Asset ID:</span>
                    <span className="detail-value">{badge.assetId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Creator:</span>
                    <span className="detail-value">{utils.formatAddress(badge.creator)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-badges">
              <div className="no-badges-icon">🏅</div>
              <h3>No Badges Yet</h3>
              <p>Claim your first event badge to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Claim;