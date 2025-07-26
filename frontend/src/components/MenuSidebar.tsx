import React from "react";
import "../styles/MenuSidebar.css";

const MenuSidebar: React.FC = () => (
  <aside className="menu-sidebar">
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

export default MenuSidebar;