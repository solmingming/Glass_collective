import React from "react";
import "../styles/Sidebar.css";

const Sidebar: React.FC = () => (
  <aside className="sidebar">
    <div className="logo">GC</div>
    <nav>
      <ul>
        <li>Collective page</li>
        <li>Collective overview</li>
        <li>Rule Book</li>
        <li>Proposal</li>
        <li>Vote</li>
        <li>History</li>
        <li>My page</li>
      </ul>
    </nav>
  </aside>
);

export default Sidebar;