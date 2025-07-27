import React from "react";
import "../styles/LogoSidebar.css";

const LogoSidebar: React.FC = () => (
  <aside className="logo-sidebar">
    <div className="logo">
      <img src="./assets/GC_logo.png" alt="GC" className="logo-image" />
    </div>
  </aside>
);

export default LogoSidebar;