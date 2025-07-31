import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useWallet } from "../contexts/WalletContext";
// *** 1. MODIFIED: 정확한 폼 컴포넌트 파일명으로 import 경로를 수정합니다. ***
import NewProposalForm from "./DaoNewProposalForm";
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

// 제안의 목적을 사람이 읽을 수 있는 문자열로 변환해주는 헬퍼 함수
const getProposalPurpose = (proposal: any): string => {
  try {
    // proposal의 sanctionType 데이터를 파싱 (스마트 컨트랙트에서 저장된 필드명)
    const proposalType = proposal.sanctionType || '';
    
    if (proposalType === 'treasury-in') {
      const amount = proposal.amount ? `${Number(proposal.amount) / 1e18} ETH` : 'ETH';
      return `💰 입금 요청: ${amount}`;
    }
    
    if (proposalType === 'treasury-out') {
      const amount = proposal.amount ? `${Number(proposal.amount) / 1e18} ETH` : 'ETH';
      return `💸 출금 요청: ${amount}`;
    }
    
    if (proposalType === 'rule-change') {
      // 규칙 변경의 경우 title(규칙명)과 afterValue(새값)를 표시
      const ruleToChange = proposal.title || '규칙';
      const newValue = proposal.afterValue || '새값';
      return `📜 규칙 변경: ${ruleToChange} → ${newValue}`;
    }
    
    // 기본값
    return '📋 일반 제안';
  } catch (error) {
    console.error('Error parsing proposal purpose:', error);
    return '제안 목적 확인 중...';
  }
};

// 투표 종료까지 남은 시간을 계산하는 함수
const getTimeRemaining = (startTime: number, votingDuration: number, currentTime: number): string => {
  const deadlineTimestamp = (startTime + votingDuration) * 1000; // 초를 밀리초로 변환
  const timeRemaining = deadlineTimestamp - currentTime;
  
  if (timeRemaining <= 0) {
    return "투표 종료됨";
  }
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}일 ${hours}시간 ${minutes}분`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else {
    return `${minutes}분`;
  }
};

const DaoProposal: React.FC = () => {
  const { id: daoAddress } = useParams<{ id: string }>();
  const { walletAddress, connectWallet, isConnecting } = useWallet();

  // --- 상태 관리 ---
  const [proposals, setProposals] = useState<any[]>([]);
  const [daoRules, setDaoRules] = useState<{ votingDuration?: number }>({});
  const [daoDetails, setDaoDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<{[key: number]: boolean}>({});
  const [error, setError] = useState("");
  const [view, setView] = useState<'list' | 'form'>('list');
  const [currentTime, setCurrentTime] = useState(Date.now()); // 실시간 업데이트를 위한 현재 시간

  // --- 데이터 로딩 함수 ---
  const fetchProposalsAndRules = useCallback(async () => {
    if (!daoAddress) return;
    setIsLoading(true); // 데이터를 새로고침할 때마다 로딩 상태로 설정
    try {
      // Promise.all을 사용해 DAO 규칙과 제안 목록을 병렬로 요청
      const [daoDetailsData, props] = await Promise.all([
        contractService.getDaoDetails(daoAddress),
        contractService.getAllProposals(daoAddress)
      ]);
      
      setDaoDetails(daoDetailsData);
      setDaoRules({ votingDuration: daoDetailsData.rules.votingDuration });
      // *** 2. FIX: 읽기 전용 배열 문제를 해결하기 위해 .slice()를 사용합니다. ***
      setProposals([...props].reverse());
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

  // 실시간으로 현재 시간 업데이트 및 투표 현황 확인 (30초마다)
  useEffect(() => {
    const timer = setInterval(async () => {
      setCurrentTime(Date.now());
      
      // Pending 제안들의 투표 현황 확인 및 자동 최종화
      if (daoAddress && proposals.length > 0) {
        for (let i = 0; i < proposals.length; i++) {
          const proposalId = proposals.length - 1 - i;
          const proposal = proposals[i];
          
          if (getStatusText(proposal.status) === 'Pending') {
            try {
              const voteStatus = await contractService.getProposalVoteStatus(daoAddress, proposalId);
              
              if (voteStatus.canFinalize) {
                console.log(`Auto-finalizing proposal ${proposalId} - all members voted`);
                try {
                  await contractService.finalizeProposal(daoAddress, proposalId);
                  console.log(`Proposal ${proposalId} auto-finalized successfully`);
                } catch (finalizeError) {
                  console.error(`Error auto-finalizing proposal ${proposalId}:`, finalizeError);
                }
              }
            } catch (error) {
              console.error(`Error checking vote status for proposal ${proposalId}:`, error);
            }
          }
        }
        
        // 제안 목록 새로고침
        await fetchProposalsAndRules();
      }
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(timer);
  }, [daoAddress, proposals, fetchProposalsAndRules]);

  // --- 핸들러 함수들 ---
  const handleAction = async (proposalId: number, action: () => Promise<any>, successMessage: string, errorMessage: string) => {
    // 지갑 연결 확인
    if (!walletAddress) {
      alert("Please connect your wallet to perform this action.");
      connectWallet();
      return;
    }
    
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
      async () => {
        await contractService.voteOnProposal(daoAddress, proposalId, choice);
        
        // 투표 후 즉시 투표 현황 확인 (더 빠른 응답)
        setTimeout(async () => {
          try {
            // 투표 현황 확인
            const voteStatus = await contractService.getProposalVoteStatus(daoAddress, proposalId);
            console.log(`Vote status for proposal ${proposalId}:`, voteStatus);
            
            // 모든 멤버가 투표했으면 자동으로 최종화
            if (voteStatus.canFinalize) {
              console.log("All members have voted. Auto-finalizing proposal...");
              try {
                await contractService.finalizeProposal(daoAddress, proposalId);
                alert("All members have voted! Proposal has been automatically finalized.");
              } catch (finalizeError) {
                console.error("Error finalizing proposal:", finalizeError);
                // finalizeError의 상세 정보 출력
                if (finalizeError instanceof Error) {
                  console.error("Finalize error details:", finalizeError.message);
                  alert(`Vote submitted successfully, but finalization failed: ${finalizeError.message}`);
                } else {
                  alert("Vote submitted successfully, but there was an issue finalizing the proposal. You may need to finalize it manually.");
                }
              }
            } else {
              console.log("Not all members have voted yet. Cannot auto-finalize.");
            }
            
            // 제안 목록 새로고침
            await fetchProposalsAndRules();
          } catch (error) {
            console.error("Error checking vote status:", error);
            // 에러가 발생해도 제안 목록은 새로고침
            await fetchProposalsAndRules();
          }
        }, 2000); // 2초 후 확인 (더 빠르게)
      },
      "Vote submitted successfully! Checking if all members have voted...",
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

  const handleCreateProposalClick = () => {
    if (!walletAddress) {
        alert("Please connect your wallet first to create a proposal.");
        connectWallet();
        return;
    }
    setView('form');
  }

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
        <div className="header-buttons">
          <button className="refresh-btn" onClick={fetchProposalsAndRules} disabled={isLoading}>
            {isLoading ? "Loading..." : "🔄 Refresh"}
          </button>
          <button className="create-proposal-btn" onClick={handleCreateProposalClick} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "+ Create New Proposal"}
          </button>
        </div>
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
                <div className="proposal-purpose">
                  <span className="purpose-text">{getProposalPurpose(prop)}</span>
                </div>
                <p className="card-description">{prop.description}</p>
                
                <div className="vote-stats">
                  <div className="vote-row">
                    <span>✔️ For <strong>{Number(prop.votesFor)}</strong></span>
                    <span>❌ Against <strong>{Number(prop.votesAgainst)}</strong></span>
                    <span>➖ Abstain <strong>{Number(prop.votesAbstain)}</strong></span>
                  </div>
                  {daoDetails && (
                    <span className="total-votes">
                      📊 총 투표: <strong>{Number(prop.votesFor) + Number(prop.votesAgainst) + Number(prop.votesAbstain)}</strong> / <strong>{daoDetails.participants}</strong>
                    </span>
                  )}
                </div>
                
                {/* 투표 종료까지 남은 시간 표시 */}
                {status === 'Pending' && daoRules.votingDuration && (
                  <div className="time-remaining">
                    <span className="time-label">⏰ 투표 종료까지:</span>
                    <span className="time-value">
                      {getTimeRemaining(Number(prop.startTime), daoRules.votingDuration, currentTime)}
                    </span>
                  </div>
                )}
                
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