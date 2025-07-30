import React, { useState, useEffect } from "react";
import "./../styles/DaoProposal.css";
import NewProposalForm from "./DaoNewProposalForm";
import contractService from "../services/contractService";

// 실제 데이터 대신 사용할 임시 제안 데이터 타입
interface Proposal {
  id: number;
  title: string;
  author: string;
  timestamp: string;
  summary: string;
  timeLeft: string;
  emoji?: string;
}

// 디자인과 똑같이 보이도록 만든 임시 데이터
const mockProposals: Proposal[] = [
  { id: 1, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m', emoji: '🖥️' },
  { id: 2, title: '새로운 멤버 초대', author: '@0xqwer...', timestamp: '5시간 전', summary: 'TL;DR', timeLeft: '5h 30m', emoji: '👥' },
  { id: 3, title: '프로젝트 자금 지원', author: '@0xzxcv...', timestamp: '1일 전', summary: 'TL;DR', timeLeft: '23h 15m', emoji: '💰' },
  { id: 4, title: '커뮤니티 규칙 개정', author: '@0xasdf...', timestamp: '2일 전', summary: 'TL;DR', timeLeft: '47h 30m', emoji: '📋' },
  { id: 5, title: '기술 스택 업그레이드', author: '@0xqwer...', timestamp: '3일 전', summary: 'TL;DR', timeLeft: '71h 45m', emoji: '⚡' },
  { id: 6, title: '환경 보호 프로젝트', author: '@0xzxcv...', timestamp: '4일 전', summary: 'TL;DR', timeLeft: '95h 20m', emoji: '🌱' },
];

const DaoProposal: React.FC = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
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

  const handleCreateProposal = () => {
    setShowNewProposal(true);
  };

  const handleVote = async (proposalId: number, voteType: 'for' | 'abstain' | 'against') => {
    try {
      console.log(`Voting ${voteType} for proposal ${proposalId}`);
      // TODO: 실제 투표 로직 구현
      alert(`${voteType} 투표가 기록되었습니다.`);
    } catch (error) {
      console.error('투표 오류:', error);
      alert('투표 중 오류가 발생했습니다.');
    }
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
      // const blockchainProposals = await contractService.getAllProposals();
      setProposals(mockProposals);
      
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

  if (showNewProposal) {
    return <NewProposalForm onBack={handleCloseNewProposal} />;
  }

  return (
    <div className="proposals-container">
      <div className="proposals-header">
        <h1 className="proposals-title">Proposals</h1>
        <button className="create-proposal-button" onClick={handleCreateProposal}>
          📝
        </button>
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
            <div className="proposals-grid">
              {proposals.map((proposal) => (
                <div
                  className="proposal-card"
                  key={proposal.id}
                  onClick={() => handleSelect(proposal.id)}
                >
                  <div className="card-header">
                    <h2 className="card-title">{proposal.title}</h2>
                    <div className="card-meta">
                      <span className="author">by {proposal.author}</span>
                      <span className="timestamp">🕒 {proposal.timestamp}</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="summary">{proposal.summary}</p>
                    <div className="time-left-container">
                      <p className="time-left-label">Time left:</p>
                      <p className="time-left-value">{proposal.timeLeft}</p>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button 
                      className="vote-button vote-for" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(proposal.id, 'for');
                      }}
                    >
                      ✓
                    </button>
                    <button 
                      className="vote-button vote-abstain" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(proposal.id, 'abstain');
                      }}
                    >
                      -
                    </button>
                    <button 
                      className="vote-button vote-against" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(proposal.id, 'against');
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="proposal-detail-card">
          <div className="proposal-detail-header">
            <button className="back-button" onClick={handleBack}>
              ← Back to Proposals
            </button>
            <button className="discussion-btn">
              Join the discussion <span role="img" aria-label="chat">💬</span>
            </button>
            <div className="proposal-detail-actions">
              <button className="action-yes" onClick={() => handleVote(selectedId, 'for')}>✔️</button>
              <button className="action-neutral" onClick={() => handleVote(selectedId, 'abstain')}>➖</button>
              <button className="action-no" onClick={() => handleVote(selectedId, 'against')}>❌</button>
            </div>
          </div>
          <div className="proposal-detail-content">
            <div className="proposal-detail-emoji">
              {mockProposals.find(p => p.id === selectedId)?.emoji}
            </div>
            <div className="proposal-detail-title">
              {mockProposals.find(p => p.id === selectedId)?.title}
            </div>
            <div className="proposal-detail-summary">
              {mockProposals.find(p => p.id === selectedId)?.summary}
            </div>
            <div className="proposal-detail-meta">
              <span>by {mockProposals.find(p => p.id === selectedId)?.author}</span>
              <span>🕒 {mockProposals.find(p => p.id === selectedId)?.timestamp}</span>
              <span>⏰ {mockProposals.find(p => p.id === selectedId)?.timeLeft} left</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaoProposal;