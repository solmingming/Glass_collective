import React from "react";
import "../styles/LogoSidebar.css";
import logoImage from "../assets/GC_logo.png";

const LogoSidebar: React.FC = () => (
  <aside className="logo-sidebar">
    <div className="logo">
      <img src={logoImage} alt="GC" className="logo-image" />
    </div>
  </aside>
);

export default LogoSidebar;