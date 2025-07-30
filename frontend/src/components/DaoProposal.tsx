import React, { useState, useEffect } from 'react';
import '../styles/DaoProposal.css';
import DaoNewProposalForm from './DaoNewProposalForm';
import contractService from "../services/contractService";

// 실제 데이터 대신 사용할 임시 제안 데이터 타입
interface Proposal {
  id: number;
  title: string;
  author: string;
  timestamp: string;
  summary: string;
  timeLeft: string;
  description?: string;
  amount?: string;
  status?: string;
  votesFor?: string;
  votesAgainst?: string;
  votesAbstain?: string;
}

// 디자인과 똑같이 보이도록 만든 임시 데이터
const mockProposals: Proposal[] = [
  { id: 1, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 2, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 3, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 4, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 5, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
  { id: 6, title: 'GPU 구매 공동 제안', author: '@0xasdf...', timestamp: '3시간 전', summary: 'TL;DR', timeLeft: '3h 42m' },
];

const DaoProposal: React.FC = () => {
  // 나중에 스마트 컨트랙트에서 가져올 제안 목록 상태
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProposalForm, setShowNewProposalForm] = useState(false);
  const [error, setError] = useState("");

  // 컴포넌트가 처음 렌더링될 때 임시 데이터를 설정합니다.
  // TODO: 이 부분을 나중에 블록체인에서 데이터를 가져오는 로직으로 교체하세요.
  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    setError("");
    
    try {
      // 네트워크 확인
      const isCorrectNetwork = await contractService.checkNetwork();
      if (!isCorrectNetwork) {
        setError("Sepolia 네트워크에 연결해주세요.");
        return;
      }

      console.log("제안 목록 로드 시작...");

      // 실제 제안 목록 가져오기
      const blockchainProposals = await contractService.getAllProposals();
      
      console.log("블록체인에서 가져온 제안들:", blockchainProposals);
      
      if (blockchainProposals.length > 0) {
        // 블록체인에서 가져온 제안들을 사용
        setProposals(blockchainProposals);
      } else {
        // 블록체인에 제안이 없으면 더미 데이터 사용
        console.log("블록체인에 제안이 없어서 더미 데이터 사용");
        setProposals(mockProposals);
      }
      
    } catch (error: any) {
      console.error("제안 목록 로드 오류:", error);
      setError(error.message || "제안 목록을 불러오는 중 오류가 발생했습니다.");
      // 오류 발생 시 더미 데이터 사용
      setProposals(mockProposals);
    } finally {
      setLoading(false);
    }
  };

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

  // 새 제안 폼에서 뒤로가기 버튼 클릭 시 실행될 함수
  const handleBackToProposals = () => {
    setShowNewProposalForm(false);
    // 새 제안 생성 후 목록 새로고침
    loadProposals();
  };

  // 새 제안 폼이 보여질 때
  if (showNewProposalForm) {
    return <DaoNewProposalForm onBack={handleBackToProposals} />;
  }

  return (
    <div className="dao-proposal-container">
      <div className="dao-proposal-header">
        <h2>Proposals</h2>
        <button className="create-proposal-btn" onClick={handleCreateProposal}>
          ✏️ Create Proposal
        </button>
      </div>

      {loading ? (
        <div className="loading-message">제안 목록을 불러오는 중...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="proposal-list">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="proposal-card">
              <div className="proposal-header">
                <h3 className="proposal-title">{proposal.title}</h3>
                <span className="proposal-author">{proposal.author}</span>
              </div>
              <div className="proposal-meta">
                <span className="proposal-timestamp">{proposal.timestamp}</span>
                <span className="proposal-summary">{proposal.description || proposal.summary}</span>
                <span className="proposal-time-left">{proposal.timeLeft}</span>
                {proposal.amount && (
                  <span className="proposal-amount">💰 {proposal.amount} ETH</span>
                )}
              </div>
              <div className="proposal-actions">
                <button 
                  className="vote-btn vote-for" 
                  onClick={() => handleVote(proposal.id, 'for')}
                >
                  ✔️ For
                </button>
                <button 
                  className="vote-btn vote-abstain" 
                  onClick={() => handleVote(proposal.id, 'abstain')}
                >
                  ➖ Abstain
                </button>
                <button 
                  className="vote-btn vote-against" 
                  onClick={() => handleVote(proposal.id, 'against')}
                >
                  ❌ Against
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DaoProposal;