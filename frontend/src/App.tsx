import React from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DaoDetail from "./components/DaoDetail";
import "./styles/App.css";

const App: React.FC = () => {
  return (
    // 전체 화면을 좌우로 나누는 레이아웃 (flex)
    <div className="app-container">
      {/* 왼쪽 사이드바 */}
      <Sidebar />
      {/* 오른쪽 메인 영역 */}
      <div className="main-content">
        <Header />
        <main className="main-area">
          <DaoDetail />
        </main>
      </div>
    </div>
  );
};

export default App;