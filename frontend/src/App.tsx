import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, useParams, Outlet } from 'react-router-dom';

// --- 페이지 및 공용 컴포넌트 Import ---
// *** 1. MODIFIED: 경로를 'pages'로 통일하고 필요한 컴포넌트만 import 합니다. ***
import Home from './pages/Home';
import Contact from './pages/Contact';
import Login from './pages/Login';
import CollectivesSearch from './components/CollectivesSearch';
import CreateDAO from './components/CreateDAO';
import DaoOverview from './components/DaoOverview';
import DaoProposal from './components/DaoProposal';
import DaoHistory from './components/DaoHistory';

// 공용 UI 컴포넌트
import LogoSidebar from './components/LogoSidebar';
import Header from './components/Header';
import MenuSidebar from './components/MenuSidebar';
import ScrollProgress from './components/ScrollProgress';
import MouseFollower from './components/MouseFollower';

// --- 서비스 Import ---
// *** 2. REMOVED: daoService를 완전히 제거합니다. ***
// import { daoService } from './services/daoService'; // 이 줄을 삭제
import { contractService } from './services/contractService'; // contractService는 개별 페이지에서 사용

// --- CSS Import ---
import './App.css'; // 랜딩페이지용 스타일
import './styles/DaoLayout.css'; // DAO 레이아웃용 스타일


// --- *** 3. NEW: DAO 페이지를 위한 통합 레이아웃 컴포넌트 *** ---
// 기존 DaoLayout을 개선하여 동적 ID와 탭 관리를 더 견고하게 만듭니다.
const DaoLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>(); // URL에서 DAO ID(:id)를 가져옵니다.

  const [currentTab, setCurrentTab] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // URL의 id가 유효한지 확인합니다.
  if (!id) {
    // id가 없는 경우, 검색 페이지로 리다이렉트합니다.
    navigate('/collectives-search');
    return null; // 렌더링 중단
  }

  // DAO의 탭 목록. 이제 id가 항상 존재하므로 동적으로 안전하게 생성됩니다.
  const daoTabList = [
    { key: "overview", path: `/collective/${id}/overview`, label: "Overview" },
    { key: "proposal", path: `/collective/${id}/proposal`, label: "Proposal" },
    { key: "history", path: `/collective/${id}/history`, label: "History" },
  ];

  // 지갑 연결 상태 확인
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) setWalletAddress(accounts[0]);
      });
    }
  }, []);

  // URL 경로가 변경될 때마다 현재 탭을 업데이트합니다.
  useEffect(() => {
    const tabIndex = daoTabList.findIndex(tab => location.pathname.startsWith(tab.path));
    // 기본 경로(`/collective/:id`)로 접근 시 overview 탭(0)으로 설정합니다.
    setCurrentTab(tabIndex === -1 ? 0 : tabIndex);
  }, [location.pathname, id]);

  // 탭 클릭 핸들러
  const handleTabClick = (idx: number) => {
    navigate(daoTabList[idx].path);
  };

  return (
    <div className="dao-app-container">
      <LogoSidebar />
      <div className="right-area">
        <Header walletAddress={walletAddress ?? undefined} daoName={`DAO #${id.slice(0, 6)}...`} />
        <div className="content-row">
          <MenuSidebar
            tabList={daoTabList}
            currentTab={currentTab}
            onTabClick={handleTabClick}
          />
          <main className="main-area">
            {/* --- 중첩된 라우트(자식 컴포넌트)가 여기에 렌더링됩니다. --- */}
            <Outlet /> 
          </main>
        </div>
      </div>
    </div>
  );
};

// --- 랜딩페이지용 레이아웃 컴포넌트 (변경 없음) ---
const LandingLayout: React.FC = () => {
  return (
    <div className="glass-collective-app">
      <ScrollProgress />
      <MouseFollower />
      {/* Outlet을 사용하여 Home, Contact, Login 페이지를 렌더링 */}
      <Outlet />
    </div>
  );
};


function App() {
  // *** 4. REMOVED: DAO 서비스 초기화 로직 제거 ***
  // useEffect(() => {
  //   daoService.initializeSampleData();
  // }, []);

  return (
    <Router>
      <Routes>
        {/* --- *** 5. MODIFIED: 라우트 구조를 명확하게 재구성 *** --- */}
        
        {/* 그룹 1: 랜딩 및 일반 페이지 (상단 네비게이션 바 없는 레이아웃) */}
        <Route path="/" element={<LandingLayout />}>
          <Route index element={<Home />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
        </Route>

        {/* 그룹 2: 전체 DAO 검색 및 생성 페이지 (별도 레이아웃) */}
        <Route path="/collectives-search" element={<CollectivesSearch />} />
        <Route path="/create-dao" element={<CreateDAO />} />
        
        {/* 그룹 3: 개별 DAO 상세 페이지 (DAO 전용 레이아웃 사용) */}
        {/* `/collective/:id` 경로에 접근하면 DaoLayout이 먼저 렌더링됩니다. */}
        <Route path="/collective/:id" element={<DaoLayout />}>
          {/* 자식 라우트들: Outlet 위치에 렌더링됩니다. */}
          <Route index element={<DaoOverview />} /> {/* `/collective/:id` 기본 경로 */}
          <Route path="overview" element={<DaoOverview />} />
          <Route path="proposal" element={<DaoProposal />} />
          <Route path="history" element={<DaoHistory />} />
        </Route>
        
        {/* 존재하지 않는 경로에 대한 처리 (선택 사항) */}
        <Route path="*" element={<div>404 Not Found</div>} />

      </Routes>
    </Router>
  )
}

export default App;