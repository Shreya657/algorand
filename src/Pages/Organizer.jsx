import React, { useState, useEffect } from 'react';
import { 
  connectWallet, 
  getConnectedWallet, 
  isWalletConnected,
  createBadgeAsset, 
  generateClaimUrl,
  utils 
} from '../utils/algorand';
import'../styles/Organizer.css'

const Organizer = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Event Form State
  const [eventForm, setEventForm] = useState({
    eventName: '',
    eventDescription: '',
    eventDate: '',
    eventLocation: ''
  });
  
  // Badge Creation State
  const [createdBadges, setCreatedBadges] = useState([]);
  const [isCreatingBadge, setIsCreatingBadge] = useState(false);
  const [currentBadgeType, setCurrentBadgeType] = useState('');

  // Check wallet connection on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      const connectedWallet = getConnectedWallet();
      console.log('Initial wallet check:', connectedWallet);
      
      if (connectedWallet) {
        const isConnected = await isWalletConnected();
        console.log('Wallet connection status:', isConnected);
        
        if (isConnected) {
          setWalletAddress(connectedWallet);
        } else {
          console.log('Wallet not actually connected, clearing state');
          setWalletAddress(null);
        }
      }
    };
    
    checkWalletConnection();
    
    // Load saved badges from localStorage
    const savedBadges = localStorage.getItem('createdBadges');
    if (savedBadges) {
      setCreatedBadges(JSON.parse(savedBadges));
    }
  }, []);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const result = await connectWallet();
      if (result.success) {
        setWalletAddress(result.address);
      } else {
        alert('Failed to connect wallet: ' + result.error);
      }
    } catch (error) {
      alert('Error connecting wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createBadgeForEvent = async (badgeType) => {
    console.log('=== DEBUG INFO ===');
    console.log('createBadgeForEvent called with:', badgeType);
    console.log('Current walletAddress state:', walletAddress);
    console.log('getConnectedWallet():', getConnectedWallet());
    console.log('localStorage wallet:', localStorage.getItem('connectedWallet'));
    
    if (!walletAddress) {
      alert('Please connect your Pera Wallet first');
      return;
    }

    if (!eventForm.eventName) {
      alert('Please enter event name first');
      return;
    }

    setIsCreatingBadge(true);
    setCurrentBadgeType(badgeType);

    try {
      console.log(`Creating ${badgeType} badge for ${eventForm.eventName}...`);
      
      const result = await createBadgeAsset(eventForm.eventName, badgeType);
      console.log('Badge creation result:', result);
      
      if (result.success) {
        const eventId = `event_${Date.now()}`;
        const claimUrl = generateClaimUrl(eventId, result.assetId);
        
        const newBadge = {
          id: result.assetId,
          eventId: eventId,
          eventName: eventForm.eventName,
          badgeType: badgeType,
          txId: result.txId,
          claimUrl: claimUrl,
          createdAt: new Date().toISOString(),
          metadata: result.metadata,
          creator: walletAddress
        };

        const updatedBadges = [...createdBadges, newBadge];
        setCreatedBadges(updatedBadges);
        
        // Save to localStorage
        localStorage.setItem('createdBadges', JSON.stringify(updatedBadges));
        
        alert(`${badgeType} badge created successfully! Asset ID: ${result.assetId}`);
      } else {
        alert('Failed to create badge: ' + result.error);
      }
    } catch (error) {
      console.error('Badge creation error:', error);
      alert('Error creating badge: ' + error.message);
    } finally {
      setIsCreatingBadge(false);
      setCurrentBadgeType('');
    }
  };

  const generateQRCodeUrl = (claimUrl) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(claimUrl)}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  if (!walletAddress) {
    return (
      <div className="organizer-container">
        <div className="connect-prompt">
          <div className="connect-card">
            <h2>Connect Your Pera Wallet</h2>
            <p>You need to connect your Pera Wallet to create event badges</p>
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
                'Connect Pera Wallet'
              )}
            </button>
            <p className="connect-hint">Scan QR code with Pera Wallet on your phone</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="organizer-container">
      {/* Header */}
      <div className="organizer-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Event Organizer Dashboard</h1>
            <p>Create blockchain-verified badges for your events</p>
          </div>
          <div className="wallet-info">
            <div className="connected-wallet">
              <div className="wallet-indicator"></div>
              <span>Connected: {utils.formatAddress(walletAddress)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Creation Form */}
      <div className="event-form-section">
        <div className="form-card">
          <h2>Create New Event</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Event Name *</label>
              <input
                type="text"
                name="eventName"
                value={eventForm.eventName}
                onChange={handleEventFormChange}
                placeholder="e.g. Web3 Developer Conference 2024"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Event Description</label>
              <textarea
                name="eventDescription"
                value={eventForm.eventDescription}
                onChange={handleEventFormChange}
                placeholder="Brief description of your event..."
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Event Date</label>
              <input
                type="date"
                name="eventDate"
                value={eventForm.eventDate}
                onChange={handleEventFormChange}
              />
            </div>
            
            <div className="form-group">
              <label>Event Location</label>
              <input
                type="text"
                name="eventLocation"
                value={eventForm.eventLocation}
                onChange={handleEventFormChange}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Badge Creation Section */}
      <div className="badge-creation-section">
        <div className="section-header">
          <h2>Create Event Badges</h2>
          <p>Create different types of badges for your event participants</p>
        </div>

        <div className="badge-types-grid">
          <div className="badge-type-card">
            <div className="badge-icon participant-badge">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Participant Badge</h3>
            <p>For all event attendees and participants</p>
            <button 
              className="create-badge-btn participant-btn"
              onClick={() => createBadgeForEvent('Participant')}
              disabled={isCreatingBadge || !eventForm.eventName}
            >
              {isCreatingBadge && currentBadgeType === 'Participant' ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Participant Badge'
              )}
            </button>
          </div>

          <div className="badge-type-card">
            <div className="badge-icon winner-badge">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 9C6 10.45 6.39 11.78 7.07 12.93L12 22L16.93 12.93C17.61 11.78 18 10.45 18 9C18 5.13 14.87 2 11 2H13C9.13 2 6 5.13 6 9Z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="9" r="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Winner Badge</h3>
            <p>For competition winners and award recipients</p>
            <button 
              className="create-badge-btn winner-btn"
              onClick={() => createBadgeForEvent('Winner')}
              disabled={isCreatingBadge || !eventForm.eventName}
            >
              {isCreatingBadge && currentBadgeType === 'Winner' ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Winner Badge'
              )}
            </button>
          </div>

          <div className="badge-type-card">
            <div className="badge-icon speaker-badge">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3.09 8.26L12 22L20.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 2V22" stroke="currentColor" strokeWidth="1"/>
                <path d="M3.09 8.26L20.91 8.26" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </div>
            <h3>Speaker Badge</h3>
            <p>For keynote speakers and presenters</p>
            <button 
              className="create-badge-btn speaker-btn"
              onClick={() => createBadgeForEvent('Speaker')}
              disabled={isCreatingBadge || !eventForm.eventName}
            >
              {isCreatingBadge && currentBadgeType === 'Speaker' ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Speaker Badge'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Created Badges Section */}
      {createdBadges.length > 0 && (
        <div className="created-badges-section">
          <div className="section-header">
            <h2>Your Created Badges</h2>
            <p>Share these QR codes or links for participants to claim badges</p>
          </div>

          <div className="badges-grid">
            {createdBadges.map((badge) => (
              <div key={badge.id} className="badge-card">
                <div className="badge-card-header">
                  <div className={`badge-type-indicator ${badge.badgeType.toLowerCase()}`}>
                    {badge.badgeType}
                  </div>
                  <div className="badge-event-name">{badge.eventName}</div>
                </div>

                <div className="badge-details">
                  <div className="detail-item">
                    <span className="detail-label">Asset ID:</span>
                    <span className="detail-value">{badge.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Transaction:</span>
                    <span className="detail-value">{utils.formatAddress(badge.txId)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {new Date(badge.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="qr-section">
                  <div className="qr-code">
                    <img 
                      src={generateQRCodeUrl(badge.claimUrl)} 
                      alt={`QR Code for ${badge.badgeType} badge`}
                    />
                  </div>
                  <p className="qr-instructions">
                    Participants can scan this QR code to claim their {badge.badgeType.toLowerCase()} badge
                  </p>
                </div>

                <div className="badge-actions">
                  <button 
                    className="action-btn copy-btn"
                    onClick={() => copyToClipboard(badge.claimUrl)}
                  >
                    Copy Claim Link
                  </button>
                  <button 
                    className="action-btn view-btn"
                    onClick={() => window.open(badge.claimUrl, '_blank')}
                  >
                    Test Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizer;