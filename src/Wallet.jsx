import { useState } from "react";
import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect();

export default function Wallet() {
  const [accountAddress, setAccountAddress] = useState(null);

  const connectWallet = async () => {
    try {
      const newAccounts = await peraWallet.connect();
      peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
      setAccountAddress(newAccounts[0]);
      console.log("Connected wallet address:", newAccounts[0]);
    } catch (error) {
      console.error("Couldn't connect to Pera Wallet", error);
    }
  };

  const handleDisconnectWalletClick = () => {
    peraWallet.disconnect();
    setAccountAddress(null);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Pera Wallet Test</h1>

      {accountAddress ? (
        <div style={styles.connectedBox}>
          <p style={styles.connectedText}>Connected: {accountAddress}</p>
          <button style={styles.disconnectBtn} onClick={handleDisconnectWalletClick}>
            Disconnect
          </button>
        </div>
      ) : (
        <button style={styles.connectBtn} onClick={connectWallet}>
          Connect Pera Wallet
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  connectBtn: {
    backgroundColor: "#0077cc",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  disconnectBtn: {
    backgroundColor: "#cc0000",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    marginTop: "10px",
  },
  connectedBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  connectedText: {
    color: "green",
    fontWeight: "bold",
    fontFamily: "monospace",
    marginBottom: "10px",
    wordBreak: "break-all",
    textAlign: "center",
  },
};
