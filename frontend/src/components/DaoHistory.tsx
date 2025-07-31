import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { contractService } from '../services/contractService';
import '../styles/DaoHistory.css';
import { ethers } from 'ethers';

// --- *** 1. MODIFIED: 히스토리 아이템 타입을 실제 데이터에 맞게 확장 *** ---
type HistoryItem = {
  type: 'proposal' | 'member_event';
  timestamp: number;
  // Proposal 타입일 때
  proposalId?: number;
  title?: string;
  proposer?: string;
  sanctionType?: string;
  amount?: bigint;
  recipient?: string;
  ruleToChange?: string;
  newValue?: bigint;
  // Member Event 타입일 때
  action?: 'join' | 'leave';
  actor?: string;
};

// --- 헬퍼 함수들 ---
const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatAddress = (address: string = ''): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getProposalPurpose = (item: HistoryItem): string => {
    if (item.sanctionType === 'treasury-in') return `💰 Treasury Deposit: ${ethers.formatEther(item.amount || 0)} ETH`;
    if (item.sanctionType === 'treasury-out') return `💸 Payout to ${formatAddress(item.recipient)}: ${ethers.formatEther(item.amount || 0)} ETH`;
    if (item.sanctionType === 'rule-change') return `📜 Rule Change: ${item.ruleToChange} → ${item.newValue}`;
    return '📋 General Proposal';
};


const DaoHistory: React.FC = () => {
  const { id: daoAddress } = useParams<{ id: string }>();

  // --- *** 2. MODIFIED: 상태 타입을 새로운 HistoryItem으로 변경 *** ---
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // --- 데이터 로딩 ---
  const fetchHistory = useCallback(async () => {
    if (!daoAddress) return;
    setIsLoading(true);
    try {
      const history = await contractService.getDaoHistory(daoAddress);
      setHistoryItems(history);
    } catch (err) {
      setError("Failed to load DAO history.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [daoAddress]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);


  if (isLoading) return <div className="history-container status-message">Loading History...</div>;
  if (error) return <div className="history-container status-message error">{error}</div>;

  return (
    <div className="history-container">
      <h1 className="history-title">Activity History</h1>
      <div className="history-timeline">
        <div className="vertical-line" />
        
        {/* --- *** 3. MODIFIED: 실제 데이터를 기반으로 타임라인 렌더링 *** --- */}
        {historyItems.length === 0 ? (
            <div className="no-history">No activities found yet.</div>
        ) : (
          historyItems.map((item, index) => {
            const currentDate = formatDate(item.timestamp);
            const prevDate = index > 0 ? formatDate(historyItems[index - 1].timestamp) : null;
            const showDateHeader = index === 0 || currentDate !== prevDate;
            
            return (
              <div key={`${item.type}-${item.timestamp}-${index}`} className="timeline-item">
                {showDateHeader && (
                  <div className="date-header">{currentDate}</div>
                )}
                
                {item.type === 'proposal' ? (
                  // 제안 이벤트 렌더링 (네모 박스)
                  <div className="timeline-content proposal">
                    <div className="timeline-icon proposal-icon">📄</div>
                    <div className="content-details">
                      <div className="content-title">
                        New Proposal Created: #{item.proposalId} {item.title}
                      </div>
                      <div className="content-purpose">{getProposalPurpose(item)}</div>
                      <div className="content-actor">by {formatAddress(item.proposer)}</div>
                    </div>
                  </div>
                ) : (
                  // 멤버 이벤트 렌더링 (동그라미)
                  <div className="timeline-content member-event">
                    <div className={`timeline-icon member-icon ${item.action}`}>{item.action === 'join' ? '🎉' : '👋'}</div>
                    <div className="content-details">
                      <div className="content-title">
                        <span className="actor-address">{formatAddress(item.actor)}</span>
                        {item.action === 'join' ? ' joined the collective.' : ' left the collective.'}
                      </div>
                    </div>
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

export default DaoHistory;