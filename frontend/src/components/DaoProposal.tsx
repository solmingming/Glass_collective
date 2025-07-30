import React, { useState, useEffect } from 'react';
import '../styles/DaoProposal.css'; // 일반 CSS 파일 임포트
import DaoNewProposalForm from './DaoNewProposalForm';

// 실제 데이터 대신 사용할 임시 제안 데이터 타입
interface Proposal {
  id: number;
  title: string;
  author: string;
  timestamp: string;
  summary: string;
  timeLeft: string;
}

// 디자인과 똑같이 보이도록 만든 임시 데이터
const mockProposals: Proposal[] = [
  { id: 1, title: 'GPU 구매 공ddddd동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 2, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 3, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 4, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 5, title: 'GPU 구매 공ddddd동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 6, title: 'GPU 구매 공ddddd동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
];

const DaoProposal: React.FC = () => {
  // 나중에 스마트 컨트랙트에서 가져올 제안 목록 상태
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProposalForm, setShowNewProposalForm] = useState(false);

  // 컴포넌트가 처음 렌더링될 때 임시 데이터를 설정합니다.
  // TODO: 이 부분을 나중에 블록체인에서 데이터를 가져오는 로직으로 교체하세요.
  useEffect(() => {
    // API나 스마트 컨트랙트 호출을 시뮬레이션
    setTimeout(() => {
      setProposals(mockProposals);
      setLoading(false);
    }, 500); // 0.5초 로딩
  }, []);

  // 투표 버튼 클릭 시 실행될 함수 (현재는 콘솔에 로그만 출력)
  const handleVote = (proposalId: number, choice: 'for' | 'abstain' | 'against') => {
    console.log(`Proposal ID: ${proposalId}, Choice: ${choice}`);
    // TODO: 여기에 스마트 컨트랙트의 vote 함수를 호출하는 코드를 작성합니다.
    // 예시: const tx = await signedDaoContract.vote(proposalId, 0);
  };
  
  // 새 제안 만들기 버튼 클릭 시 실행될 함수
  const handleCreateProposal = () => {
    setShowNewProposalForm(true);
  };

  const handleBackToProposals = () => {
    setShowNewProposalForm(false);
  };

  if (loading) {
    return <div className="proposals-container">Loading Proposals...</div>;
  }

  // 새 제안 폼을 보여줄 때
  if (showNewProposalForm) {
    return <DaoNewProposalForm onBack={handleBackToProposals} />;
  }

  return (
    <div className="proposals-container">
      <div className="proposals-header">
        <h1 className="proposals-title">Proposals</h1>
        <button className="create-proposal-button" onClick={handleCreateProposal}>
          📝
        </button>
      </div>
      <div className="proposals-grid">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="proposal-card">
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
              <button className="vote-button vote-for" onClick={() => handleVote(proposal.id, 'for')}>
                ✓
              </button>
              <button className="vote-button vote-abstain" onClick={() => handleVote(proposal.id, 'abstain')}>
                -
              </button>
              <button className="vote-button vote-against" onClick={() => handleVote(proposal.id, 'against')}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DaoProposal;