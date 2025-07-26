import React from "react";
import LogoSidebar from "./components/LogoSidebar";
import Header from "./components/Header";
import MenuSidebar from "./components/MenuSidebar";
import DaoDetail from "./components/DaoDetail";
import "./styles/App.css";

const App: React.FC = () => {
  return (
    <div className="app-container">
      {/* 가장 왼쪽 로고 사이드바 */}
      <LogoSidebar />
      {/* 오른쪽 전체 영역 */}
      <div className="right-area">
        {/* 상단 헤더 */}
        <Header />
        {/* 헤더 아래: 메뉴 사이드바 + 메인 */}
        <div className="content-row">
          <MenuSidebar />
          <main className="main-area">
            <DaoDetail />
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;