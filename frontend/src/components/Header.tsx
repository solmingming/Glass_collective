import React from "react";
import "../styles/Header.css";

interface HeaderProps {
  walletAddress?: string;
  searchTerm?: string;
  setSearchTerm?: (v: string) => void;
}

const formatAddress = (address: string) => {
  if (!address) return '';
  return address.slice(0, 10) + '...';
};

const Header: React.FC<HeaderProps> = ({ walletAddress, searchTerm, setSearchTerm }) => {
  return (
    <header className="header">
      <div className="search-container">
        <input
          className="search-input"
          type="text"
          placeholder="search for a collective"
          value={searchTerm ?? ''}
          onChange={e => setSearchTerm && setSearchTerm(e.target.value)}
        />
        <div className="search-icon">🔍</div>
      </div>
      <div className="header-right">
        <button className="wallet-btn">
          {walletAddress ? formatAddress(walletAddress) : '0x0EFA118A...'}
        </button>
      </div>
    </header>
  );
};

export default Header;