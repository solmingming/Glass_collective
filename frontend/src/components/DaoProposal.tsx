import React, { useState } from "react";
import "./../styles/DaoProposal.css";
import NewProposalForm from "./DaoNewProposalForm";

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

  const handleSelect = (id: number) => setSelectedId(id);
  const handleBack = () => setSelectedId(null);
  const handleNewProposal = () => setShowNewProposal(true);
  const handleCloseNewProposal = () => setShowNewProposal(false);

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
              {dummyProposals.map((proposal) => (
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
              ))}
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