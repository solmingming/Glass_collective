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
      <div className="search-bar-outer">
        <input
          className="search-bar-modern"
          type="text"
          placeholder="검색어를 입력하세요..."
          value={searchTerm ?? ''}
          onChange={e => setSearchTerm && setSearchTerm(e.target.value)}
        />
        <span className="search-icon-modern">
          <svg width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
        </span>
      </div>
      <div className="header-center">
        {/* 필요시 중앙 컨텐츠 */}
      </div>
      <div className="header-right">
        <div className="wallet-display">
          {walletAddress ? formatAddress(walletAddress) : '지갑 연결 필요'}
        </div>
        <button className="darkmode-btn">🌙</button>
      </div>
    </header>
  );
};

export default Header;