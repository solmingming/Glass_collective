import React from "react";
import "../styles/Header.css";

const Header: React.FC = () => (
  <header className="header">
    <div className="search-container">
      <input
        className="search-input"
        type="text"
        placeholder="search for a collective"
      />
      <div className="search-icon">🔍</div>
    </div>
    <div className="header-right">
      <button className="wallet-btn">0x0EFA118A...</button>
    </div>
  </header>
);

export default Header;