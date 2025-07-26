import React from "react";
import "../styles/Header.css";

const Header: React.FC = () => (
  <header className="header">
    <input
      className="search-input"
      type="text"
      placeholder="search for a collective"
    />
    <div className="header-right">
      <button className="wallet-btn">0x0EFA118A...</button>
      <button className="darkmode-btn">🌙</button>
    </div>
  </header>
);

export default Header;