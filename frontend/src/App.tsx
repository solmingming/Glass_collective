import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Login from './pages/Login';
import CollectivesSearch from './pages/CollectivesSearch';
import ScrollProgress from './components/ScrollProgress';
import MouseFollower from './components/MouseFollower';

// DAO 페이지 컴포넌트들
import LogoSidebar from './components/LogoSidebar';
import Header from './components/Header';
import MenuSidebar from './components/MenuSidebar';
import DaoOverview from './pages/DaoOverview';
import DaoRulebook from './pages/DaoRulebook';
import DaoProposal from './pages/DaoProposal';
import DaoVote from './pages/DaoVote';
import DaoHistory from './pages/DaoHistory';
import DaoMypage from './pages/DaoMypage';

// CSS 파일들을 동적으로 import
import './App.css'; // 랜딩페이지용 스타일

// DAO 페이지용 탭 리스트
const daoTabList = [
  { key: "overview", path: "/dao/overview", label: "Overview" },
  { key: "proposal", path: "/dao/proposal", label: "Proposal" },
  { key: "history", path: "/dao/history", label: "History" },
];

// DAO 페이지 레이아웃 컴포넌트
const DaoLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(0);

  // DAO 페이지용 CSS 동적 로딩
  useEffect(() => {
    import('./styles/DaoLayout.css');
  }, []);

  // 현재 URL에 맞는 탭 인덱스 찾기
  const getCurrentTabIndex = () => {
    return daoTabList.findIndex(tab => tab.path === location.pathname);
  };

  // 메뉴 클릭 시 해당 페이지로 이동
  const handleTabClick = (idx: number) => {
    if (idx === currentTab) return;
    
    setCurrentTab(idx);
    navigate(daoTabList[idx].path);
  };

  // URL 변경 시 탭 인덱스 업데이트
  useEffect(() => {
    const tabIndex = getCurrentTabIndex();
    if (tabIndex !== -1 && tabIndex !== currentTab) {
      setCurrentTab(tabIndex);
    }
  }, [location.pathname]);

  return (
    <div className="dao-app-container">
      <LogoSidebar />
      <div className="right-area">
        <Header />
        <div className="content-row">
          <MenuSidebar
            tabList={daoTabList}
            currentTab={currentTab}
            onTabClick={handleTabClick}
          />
          <main className="main-area">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

// 랜딩페이지용 메인 컴포넌트
const LandingApp: React.FC = () => {
  return (
    <div className="glass-collective-app" style={{ height: '100vh' }}>
      <ScrollProgress />
      <MouseFollower />
      {/* <Navigation /> 삭제! */}
      <main className="main-content">
        <Home />
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 랜딩페이지 라우트 */}
        <Route path="/" element={<LandingApp />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/collectives-search" element={<CollectivesSearch />} />
        
        {/* DAO 페이지 라우트들 */}
        <Route path="/dao" element={<DaoLayout />}>
          <Route index element={<DaoOverview />} />
          <Route path="overview" element={<DaoOverview />} />
          <Route path="proposal" element={<DaoProposal />} />
          <Route path="history" element={<DaoHistory />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
