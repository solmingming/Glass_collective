import React, { useRef, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import LogoSidebar from "./components/LogoSidebar";
import Header from "./components/Header";
import MenuSidebar from "./components/MenuSidebar";
import DaoOverview from "./components/DaoOverview";
import DaoRulebook from "./components/DaoRulebook";
import DaoProposal from "./components/DaoProposal";
import DaoVote from "./components/DaoVote";
import DaoHistory from "./components/DaoHistory";
import DaoMypage from "./components/DaoMypage";
import "./styles/App.css";

const tabList = [
  { key: "overview", path: "/overview", label: "Overview", component: <DaoOverview /> },
  { key: "rulebook", path: "/rulebook", label: "Rule Book", component: <DaoRulebook /> },
  { key: "proposal", path: "/proposal", label: "Proposal", component: <DaoProposal /> },
  { key: "vote", path: "/vote", label: "Vote", component: <DaoVote /> },
  { key: "history", path: "/history", label: "History", component: <DaoHistory /> },
  { key: "mypage", path: "/mypage", label: "My page", component: <DaoMypage /> },
];

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // 현재 URL에 맞는 탭 인덱스 찾기
  const getCurrentTabIndex = () => {
    return tabList.findIndex(tab => tab.path === location.pathname);
  };


  const HEADER_HEIGHT = 80; // 실제 헤더 높이와 동일시해야함

  // 스크롤 이벤트 핸들러
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrolling) return;
    
    const scrollTop = e.currentTarget.scrollTop;
    const windowHeight = e.currentTarget.clientHeight;
    const sectionHeight = windowHeight - HEADER_HEIGHT;
    const currentIndex = Math.round(scrollTop / sectionHeight);
    
    if (currentIndex !== currentTab && currentIndex >= 0 && currentIndex < tabList.length) {
      setCurrentTab(currentIndex);
      // URL도 함께 변경
      navigate(tabList[currentIndex].path);
    }
  };

  // 메뉴 클릭 시 해당 섹션으로 스크롤
  const scrollToTab = (idx: number) => {
    if (isScrolling || idx === currentTab) return;
    
    setIsScrolling(true);
    setCurrentTab(idx);
    
    // URL 변경
    navigate(tabList[idx].path);
    
    const main = mainRef.current;
    const section = sectionRefs.current[idx];

    if (main && section) {
      // 섹션의 top 위치에서 헤더 높이만큼 빼서 스크롤
      const top = section.offsetTop - HEADER_HEIGHT;
      main.scrollTo({ top, behavior: "smooth" });
    }
  
    setTimeout(() => setIsScrolling(false), 1000);
  };

  // URL 변경 시 탭 인덱스 업데이트
  useEffect(() => {
    const tabIndex = getCurrentTabIndex();
    if (tabIndex !== -1 && tabIndex !== currentTab) {
      setCurrentTab(tabIndex);
    }
  }, [location.pathname]);

  return (
    <div className="app-container">
      <LogoSidebar />
      <div className="right-area">
        <Header />
        <div className="content-row">
          <MenuSidebar
            tabList={tabList}
            currentTab={currentTab}
            onTabClick={scrollToTab}
          />
          <main
            ref={mainRef}
            className="main-area scroll-container"
            onScroll={handleScroll}
          >
            {tabList.map((tab, idx) => (
              <div
                key={tab.key}
                ref={el => (sectionRefs.current[idx] = el)}
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

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
};

export default App;