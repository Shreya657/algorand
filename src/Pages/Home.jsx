import React, { useState, useEffect } from 'react';
import { connectWallet, getConnectedWallet, disconnectWallet, utils } from '../utils/algorand';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.jsx';
import '../styles/Home.css'

const Home = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectingAnimation, setShowConnectingAnimation] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const connectedWallet = getConnectedWallet();
    if (connectedWallet) {
      setWalletAddress(connectedWallet);
    }
  }, []);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

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
    <div className={`home-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="chain-text">Chain</span>
            <span className="badge-text">Badge</span>
          </div>
          
          <div className="nav-menu">
            <button 
              className={`nav-item ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => scrollToSection('home')}
            >
              Home
            </button>
            <button 
              className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => scrollToSection('about')}
            >
              About
            </button>
            <button 
              className={`nav-item ${activeSection === 'faq' ? 'active' : ''}`}
              onClick={() => scrollToSection('faq')}
            >
              FAQ
            </button>
            <button 
              className={`nav-item ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={() => scrollToSection('contact')}
            >
              Contact Us
            </button>
          </div>

          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleDarkMode}>
              {darkMode ? (
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2"/>
                  <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2"/>
                  <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </button>
            
            {!walletAddress ? (
              <button 
                className={`connect-wallet-nav ${isConnecting ? 'connecting' : ''}`}
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="wallet-connected-nav">
                <span className="wallet-address-nav">{utils.formatAddress(walletAddress)}</span>
                <button className="disconnect-nav" onClick={handleDisconnectWallet}>×</button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section id="home" className="hero-section">
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
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <h2 className="section-title">About ChainBadge</h2>
          <div className="about-content">
            <div className="about-text">
              <h3>Revolutionizing Event Verification</h3>
              <p>
                ChainBadge is a decentralized platform that transforms how events issue and verify achievements. 
                Built on the Algorand blockchain, we provide a tamper-proof, transparent system for creating 
                and managing digital badges.
              </p>
              <p>
                Our mission is to eliminate fraud in event certification while providing participants with 
                verifiable, portable achievements they truly own. No central authority can revoke or 
                manipulate your earned badges.
              </p>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">1000+</div>
                  <div className="stat-label">Badges Created</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Events Verified</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">Decentralized</div>
                </div>
              </div>
            </div>
            
            <div className="about-visual">
              <div className="blockchain-visual">
                <div className="block">🏆</div>
                <div className="connection"></div>
                <div className="block">🎖️</div>
                <div className="connection"></div>
                <div className="block">⭐</div>
                <div className="connection"></div>
                <div className="block">🎯</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
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
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>What is ChainBadge?</h3>
              <p>
                ChainBadge is a blockchain-based platform that allows event organizers to create 
                verifiable digital badges and participants to claim them directly to their wallets.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>How do I claim a badge?</h3>
              <p>
                Simply connect your Algorand wallet, enter the event details or scan the QR code 
                provided by the organizer, and claim your badge. It will be minted directly to your wallet.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Are there any fees?</h3>
              <p>
                There are minimal Algorand network fees (typically 0.001 ALGO) for minting badges. 
                Our platform doesn't charge additional fees for basic badge creation and claiming.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Which wallets are supported?</h3>
              <p>
                We currently support MyAlgo Wallet and Pera Wallet. More wallet integrations 
                are planned for future releases.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Can badges be transferred?</h3>
              <p>
                Yes! Since badges are Algorand Standard Assets (ASAs), they can be transferred 
                between wallets, traded, or displayed in any ASA-compatible platform.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>How do I verify a badge?</h3>
              <p>
                All badges are verifiable on the Algorand blockchain. You can check the asset ID 
                on AlgoExplorer or any Algorand block explorer to verify authenticity and metadata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <h2 className="section-title">Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Get in Touch</h3>
              <p>
                Have questions, suggestions, or need help with badge creation? 
                We'd love to hear from you!
              </p>
              
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="contact-label">Email</div>
                    <div className="contact-value">support@chainbadge.com</div>
                  </div>
                </div>
                
                <div className="contact-method">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M9 19C-5 19 -5 5 9 5H15C29 5 29 19 15 19L9 19Z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="15,9 19,12 15,15" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="contact-label">Discord</div>
                    <div className="contact-value">ChainBadge Community</div>
                  </div>
                </div>
                
                <div className="contact-method">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M9 11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M19 11C19 15.97 15.97 20 12 20C8.03 20 5 15.97 5 11" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="20" x2="12" y2="24" stroke="currentColor" strokeWidth="2"/>
                      <line x1="8" y1="24" x2="16" y2="24" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="contact-label">GitHub</div>
                    <div className="contact-value">github.com/chainbadge</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="contact-form">
              <h3>Send us a Message</h3>
              <form className="message-form">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" placeholder="Your name" />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="your.email@example.com" />
                </div>
                
                <div className="form-group">
                  <label>Subject</label>
                  <select>
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                    <option>Bug Report</option>
                    <option>Feature Request</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Message</label>
                  <textarea placeholder="Tell us how we can help you..."></textarea>
                </div>
                
                <button type="submit" className="submit-btn">
                  Send Message
                  <svg viewBox="0 0 24 24" fill="none">
                    <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2"/>
                    <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-text">
            Built on <span className="algorand-text">Algorand</span> • Powered by Web3
          </div>
          <div className="footer-links">
            <a href="#about" className="footer-link" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
            <a href="#faq" className="footer-link" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>Help</a>
            <a href="#contact" className="footer-link" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;