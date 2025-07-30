import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import NewProposalForm from "./DaoNewProposalForm"; // 폼 컴포넌트 import
import { contractService } from "../services/contractService";
import "../styles/DaoProposal.css";

// 제안의 상태(enum)를 사람이 읽을 수 있는 문자열로 변환해주는 헬퍼 함수
const getStatusText = (status: bigint | number): string => {
  const statusNum = Number(status);
  switch (statusNum) {
    case 0: return 'Pending';
    case 1: return 'Passed';
    case 2: return 'Rejected';
    case 3: return 'Executed';
    default: return 'Unknown';
  }
};

const DaoProposal: React.FC = () => {
  const { id: daoAddress } = useParams<{ id: string }>();

  // --- 상태 관리 ---
  const [proposals, setProposals] = useState<any[]>([]);
  const [daoRules, setDaoRules] = useState<{ votingDuration?: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<{[key: number]: boolean}>({}); // 개별 버튼 로딩 상태
  const [error, setError] = useState("");
  const [view, setView] = useState<'list' | 'form'>('list');

  // --- 데이터 로딩 함수 ---
  const fetchProposalsAndRules = useCallback(async () => {
    if (!daoAddress) return;
    try {
      // Promise.all을 사용해 DAO 규칙과 제안 목록을 병렬로 요청
      const [daoDetails, props] = await Promise.all([
        contractService.getDaoDetails(daoAddress),
        contractService.getAllProposals(daoAddress)
      ]);
      
      setDaoRules({ votingDuration: daoDetails.rules.votingDuration });
      // 최신 제안이 위로 오도록 정렬
      setProposals(props.slice().reverse());
    } catch (err) {
      setError("Failed to load proposals and DAO rules.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [daoAddress]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchProposalsAndRules();
  }, [fetchProposalsAndRules]);

  // --- 핸들러 함수들 ---
  const handleAction = async (proposalId: number, action: () => Promise<any>, successMessage: string, errorMessage: string) => {
    setIsActionLoading(prev => ({ ...prev, [proposalId]: true }));
    try {
      await action();
      alert(successMessage);
      await fetchProposalsAndRules(); // 액션 성공 후 목록 새로고침
    } catch (err: any) {
      console.error(errorMessage, err);
      const message = err.code === 'ACTION_REJECTED' ? "Transaction was rejected by user." : errorMessage;
      alert(message);
    } finally {
      setIsActionLoading(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  const handleVote = (proposalId: number, choice: 0 | 1 | 2) => {
    if (!daoAddress) return;
    handleAction(
      proposalId,
      () => contractService.voteOnProposal(daoAddress, proposalId, choice),
      "Vote submitted successfully!",
      "Failed to submit vote. You may have already voted or are not a member."
    );
  };

  const handleFinalize = (proposalId: number) => {
    if (!daoAddress) return;
    handleAction(
      proposalId,
      () => contractService.finalizeProposal(daoAddress, proposalId),
      "Proposal finalized successfully!",
      "Failed to finalize proposal. The voting period may not be over, or it has already been finalized."
    );
  };

  // --- 뷰 렌더링 ---
  if (isLoading) return <div className="status-message">Loading proposals...</div>;
  if (error) return <div className="status-message error">{error}</div>;

  // 새 제안 만들기 폼 보기
  if (view === 'form') {
    return <NewProposalForm 
      onProposalCreated={() => { 
        setView('list'); 
        fetchProposalsAndRules();
      }} 
      onBack={() => setView('list')} 
    />;
  }

  // 제안 목록 보기 (기본)
  return (
    <div className="dao-proposal-page">
      <div className="proposal-header">
        <h1>Proposals</h1>
        <button className="create-proposal-btn" onClick={() => setView('form')}>
          + Create New Proposal
        </button>
      </div>

      <div className="proposal-list">
        {proposals.length === 0 ? (
          <div className="no-proposals">
            <p>No proposals have been created yet.</p>
            <p>Be the first to create one!</p>
          </div>
        ) : (
          proposals.map((prop, index) => {
            const proposalId = proposals.length - 1 - index;
            const status = getStatusText(prop.status);
            
            // 스마트 컨트랙트에서 가져온 투표 기간(초 단위)을 사용하여 데드라인 계산
            const deadlineTimestamp = (Number(prop.startTime) + (daoRules.votingDuration || 0)) * 1000;
            const isVotingPeriodOver = deadlineTimestamp > 0 && Date.now() > deadlineTimestamp;

            return (
              <div key={proposalId} className={`proposal-card status-${status.toLowerCase()}`}>
                <div className="card-header">
                  <h3 className="card-title">{`#${proposalId}: ${prop.title}`}</h3>
                  <div className={`status-tag ${status.toLowerCase()}`}>{status}</div>
                </div>
                <p className="card-description">{prop.description}</p>
                
                <div className="vote-stats">
                  <span>✔️ For: <strong>{Number(prop.votesFor)}</strong></span>
                  <span>❌ Against: <strong>{Number(prop.votesAgainst)}</strong></span>
                  <span>➖ Abstain: <strong>{Number(prop.votesAbstain)}</strong></span>
                </div>
                
                {status === 'Pending' && (
                  <div className="action-buttons">
                    {!isVotingPeriodOver ? (
                      <>
                        <button onClick={() => handleVote(proposalId, 0)} disabled={isActionLoading[proposalId]}>For</button>
                        <button onClick={() => handleVote(proposalId, 1)} disabled={isActionLoading[proposalId]}>Against</button>
                        <button onClick={() => handleVote(proposalId, 2)} disabled={isActionLoading[proposalId]}>Abstain</button>
                      </>
                    ) : (
                      <span className="voting-ended-text">Voting has ended.</span>
                    )}

                    {isVotingPeriodOver && (
                      <button className="finalize-btn" onClick={() => handleFinalize(proposalId)} disabled={isActionLoading[proposalId]}>
                        {isActionLoading[proposalId] ? 'Finalizing...' : 'Finalize'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DaoProposal;