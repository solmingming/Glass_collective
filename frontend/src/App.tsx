import React, { useRef, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Login from './pages/Login';
import CollectivesSearch from './components/CollectivesSearch';
import ScrollProgress from './components/ScrollProgress';
import MouseFollower from './components/MouseFollower';

// DAO 페이지 컴포넌트들
import LogoSidebar from './components/LogoSidebar';
import Header from './components/Header';
import MenuSidebar from './components/MenuSidebar';
import DaoOverview from './components/DaoOverview';
import DaoRulebook from './components/DaoRulebook';
import DaoProposal from './components/DaoProposal';
import DaoHistory from './components/DaoHistory';
import DaoMypage from './components/DaoMypage';

// CSS 파일들을 동적으로 import
import './App.css'; // 랜딩페이지용 스타일

// DAO 페이지용 탭 리스트
const daoTabList = [
  { key: "overview", path: "/dao/overview", label: "Overview", component: <DaoOverview /> },
  { key: "rulebook", path: "/dao/rulebook", label: "Rule Book", component: <DaoRulebook /> },
  { key: "proposal", path: "/dao/proposal", label: "Proposal", component: <DaoProposal /> },
  { key: "history", path: "/dao/history", label: "History", component: <DaoHistory /> },
  { key: "mypage", path: "/dao/mypage", label: "My page", component: <DaoMypage /> },
];

// DAO 페이지 메인 컴포넌트
const DaoAppContent: React.FC = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // DAO 페이지용 CSS 동적 로딩
  useEffect(() => {
    import('./styles/DaoLayout.css');
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) setWalletAddress(accounts[0]);
      });
    }
  }, []);

  const HEADER_HEIGHT = 80; // 실제 헤더 높이와 동일시해야함

  // 스크롤 이벤트 핸들러
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrolling) return;
    
    const scrollTop = e.currentTarget.scrollTop;
    const windowHeight = e.currentTarget.clientHeight;
    const sectionHeight = windowHeight - HEADER_HEIGHT;
    const currentIndex = Math.round(scrollTop / sectionHeight);
    
    if (currentIndex !== currentTab && currentIndex >= 0 && currentIndex < daoTabList.length) {
      setCurrentTab(currentIndex);
    }
  };

  // 메뉴 클릭 시 해당 섹션으로 스크롤
  const scrollToTab = (idx: number) => {
    if (isScrolling || idx === currentTab) return;
    
    setIsScrolling(true);
    setCurrentTab(idx);
    
    // URL 변경 (삭제)
    // navigate(daoTabList[idx].path);
    
    const main = mainRef.current;
    const section = sectionRefs.current[idx];

    if (main && section) {
      // 섹션의 top 위치에서 헤더 높이만큼 빼서 스크롤
      const top = section.offsetTop - HEADER_HEIGHT;
      main.scrollTo({ top, behavior: "smooth" });
    }
  
    setTimeout(() => setIsScrolling(false), 1000);
  };

  // URL 변경 시 탭 인덱스 업데이트 (불필요하므로 주석 처리)
  // useEffect(() => {
  //   const tabIndex = getCurrentTabIndex();
  //   if (tabIndex !== -1 && tabIndex !== currentTab) {
  //     setCurrentTab(tabIndex);
  //   }
  // }, [location.pathname]);

  return (
    <div className="dao-app-container">
      <LogoSidebar />
      <div className="right-area">
        <Header walletAddress={walletAddress ? walletAddress : undefined} />
        <div className="content-row">
          <MenuSidebar
            tabList={daoTabList}
            currentTab={currentTab}
            onTabClick={scrollToTab}
          />
          <main
            ref={mainRef}
            className="main-area scroll-container"
            onScroll={handleScroll}
          >
            {daoTabList.map((tab, idx) => (
              <div
                key={tab.key}
                ref={(el) => {
                  sectionRefs.current[idx] = el;
                }}
                className={`tab-section ${idx === currentTab ? "active" : ""}`}
              >
                <div className="tab-content">
                  {tab.component}
                </div>
              </div>
            ))}
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
        <Route path="/collective/:id" element={<DaoAppContent />} />
      </Routes>
    </Router>
  )
}

export default App
