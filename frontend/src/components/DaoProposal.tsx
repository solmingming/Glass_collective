import React, { useState, useEffect } from "react";
import "./../styles/DaoProposal.css";
import NewProposalForm from "./DaoNewProposalForm";
import contractService from "../services/contractService";

const dummyProposals = [
  {
    id: 1,
    title: "MT 장소 고르기",
    emoji: "🟫",
    status: "ongoing",
  },
  {
    id: 2,
    title: "회식 장소 고르기",
    emoji: "🕶️",
    status: "ongoing",
  },
  {
    id: 3,
    title: "반티 정하기",
    emoji: "🟦",
    status: "ongoing",
  },
  {
    id: 4,
    title: "MT 장소 고르기",
    emoji: "🟫",
    status: "ongoing",
  },
  {
    id: 5,
    title: "MT 장소 고르기",
    emoji: "🟫",
    status: "ongoing",
  },
];

const proposalDetails: { [key: string]: { description: string } } = {
  1: { description: "MT 장소를 투표로 정합니다. 후보: 강릉, 속초, 남이섬" },
  2: { description: "회식 장소를 투표로 정합니다. 후보: 고기집, 횟집, 중식당" },
  3: { description: "반티(단체티) 디자인을 투표로 정합니다. 후보: 흰색, 파란색, 노란색" },
  4: { description: "MT 장소를 투표로 정합니다. 후보: 강릉, 속초, 남이섬" },
  5: { description: "MT 장소를 투표로 정합니다. 후보: 강릉, 속초, 남이섬" },
};

// ... (생략: import, dummyProposals, proposalDetails 등 기존 코드)

const DaoProposal: React.FC = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = (id: number) => setSelectedId(id);
  const handleBack = () => setSelectedId(null);
  const handleNewProposal = () => setShowNewProposal(true);
  const handleCloseNewProposal = () => {
    setShowNewProposal(false);
    // 새 제안 생성 후 목록 새로고침
    loadProposals();
  };

  const loadProposals = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // 네트워크 확인
      const isCorrectNetwork = await contractService.checkNetwork();
      if (!isCorrectNetwork) {
        setError("Sepolia 네트워크에 연결해주세요.");
        return;
      }

      // 실제 제안 목록 가져오기 (현재는 더미 데이터 사용)
      // TODO: getAllProposals 함수 구현 후 실제 데이터 사용
      setProposals(dummyProposals);
      
    } catch (error: any) {
      console.error("제안 목록 로드 오류:", error);
      setError(error.message || "제안 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  return (
    <div className="dao-proposal-container">
      {showNewProposal ? (
        <NewProposalForm onBack={handleCloseNewProposal} />
      ) : (
        <>
          <div className="dao-proposal-header">
            <h2>Proposals</h2>
            <span className="edit-icon" title="Create Proposal" onClick={handleNewProposal}>✏️</span>
            <span className="sort-by">sort by</span>
          </div>
          {selectedId === null ? (
            <div className="proposal-list">
              {isLoading ? (
                <div className="loading-message">제안 목록을 불러오는 중...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : proposals.length === 0 ? (
                <div className="empty-message">아직 제안이 없습니다. 첫 번째 제안을 만들어보세요!</div>
              ) : (
                proposals.map((proposal) => (
                  <div
                    className="proposal-card"
                    key={proposal.id}
                    onClick={() => handleSelect(proposal.id)}
                  >
                    <div className="proposal-emoji">{proposal.emoji}</div>
                    <div className="proposal-title">{proposal.title}</div>
                    <div className="proposal-actions">
                      <span className="action-yes">✔️</span>
                      <span className="action-neutral">➖</span>
                      <span className="action-no">❌</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="proposal-detail-card">
              <div className="proposal-detail-header">
                <button className="discussion-btn">
                  Join the discussion <span role="img" aria-label="chat">💬</span>
                </button>
                <div className="proposal-detail-actions">
                  <span className="action-yes">✔️</span>
                  <span className="action-neutral">➖</span>
                  <span className="action-no">❌</span>
                </div>
              </div>
              <div className="proposal-detail-content">
                <div className="proposal-detail-emoji">
                  {dummyProposals.find(p => p.id === selectedId)?.emoji}
                </div>
                <div className="proposal-detail-title">
                  {dummyProposals.find(p => p.id === selectedId)?.title}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DaoProposal;