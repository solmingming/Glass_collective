import React from "react";
import "../styles/MenuSidebar.css";

// MenuSidebarProps 타입 정의: 탭 목록, 현재 탭, 탭 클릭 핸들러를 props로 받음
interface MenuSidebarProps {
  tabList: { key: string; path: string, label: string }[];
  currentTab: number;
  onTabClick: (idx: number) => void;
}

const MenuSidebar: React.FC<MenuSidebarProps> = ({ tabList, currentTab, onTabClick }) => (
  <aside className="menu-sidebar">
    <nav>
      <ul>
        <li className="menu-title">Collective</li>

        {/* 탭 목록을 순회하며 메뉴 항목 생성 */}
        {tabList.map((tab, idx) => (
          <li
            key={tab.key}
            className={`menu-indent${currentTab === idx ? " active" : ""}`}
            onClick={() => onTabClick(idx)}
          >
            {tab.label}
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);

export default MenuSidebar;