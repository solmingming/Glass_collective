import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import GlassScore from "../components/GlassScore";
import contractService, { type DaoDetails } from "../services/contractService";
import "../styles/DaoOverview.css";
// [수정] 새로 만든 데이터 파일에서 전체 DAO 목록을 가져옵니다.
import { allCollectives } from '../data/collectives';

const DaoOverview: React.FC = () => {
  // 라우트 파라미터는 '/collective/:id/overview' 와 같이 설정되어 있어야 합니다.
  const { id } = useParams<{ id: string }>();

  // --- 상태 관리 ---
  const [daoDetails, setDaoDetails] = useState<DaoDetails | null>(null);
  const [myScore, setMyScore] = useState<number>(0);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [isMember, setIsMember] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // [수정] URL의 id를 사용하여 전체 목록에서 현재 DAO 정보를 찾습니다.
  const currentDAO = allCollectives.find(dao => dao.id === id);

  // --- 데이터 로딩 로직 ---
  const loadDAOData = useCallback(async () => {
    // [수정] currentDAO가 있는지 먼저 확인합니다.
    if (!currentDAO) {
      setError("해당 DAO를 찾을 수 없습니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await contractService.initializeProvider();
      const details = await contractService.getDaoDetails(currentDAO.contractAddress);
      setDaoDetails(details);

      const avgScore = await contractService.getDaoAverageScore(details.proposalContractAddress);
      setAverageScore(avgScore);

      const address = await contractService.connectWallet();
      setWalletAddress(address);

      const memberStatus = await contractService.isMember(currentDAO.contractAddress, address);
      setIsMember(memberStatus);

      if (memberStatus) {
        const score = await contractService.getMyGlassScore(details.proposalContractAddress, address);
        setMyScore(score);
      } else {
        setMyScore(0);
      }
    } catch (err: any) {
      console.error("DAO 데이터 로딩 실패:", err);
      setError(err.message || "DAO 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [id, currentDAO]); // id와 currentDAO가 변경될 때 다시 로드

  useEffect(() => {
    loadDAOData();
  }, [loadDAOData]);

  // --- 가입 버튼 클릭 핸들러 ---
  const handleJoinClick = async () => {
    if (!currentDAO) return;
    if (isJoining) return;

    setIsJoining(true);
    try {
      await contractService.joinDAO(currentDAO.contractAddress);
      alert("DAO 가입이 완료되었습니다! 잠시 후 정보가 업데이트됩니다.");
      setTimeout(() => loadDAOData(), 1000);
    } catch (error: any) {
      console.error("Join 실패:", error);
      alert("DAO 가입 중 오류가 발생했습니다: " + (error.reason || error.message));
    } finally {
      setIsJoining(false);
    }
  };

  // --- 탈퇴 버튼 클릭 핸들러 ---
  const handleLeaveClick = async () => {
    if (!currentDAO) return;
    if (isLeaving) return;

    const confirmed = window.confirm("정말로 이 DAO에서 탈퇴하시겠습니까? 모든 권한이 박탈됩니다.");
    if (!confirmed) return;

    setIsLeaving(true);
    try {
      await contractService.leaveDAO(currentDAO.contractAddress);
      alert("DAO 탈퇴가 완료되었습니다! 잠시 후 정보가 업데이트됩니다.");
      setTimeout(() => loadDAOData(), 1000);
    } catch (error: any) {
      console.error("Leave 실패:", error);
      alert("DAO 탈퇴 중 오류가 발생했습니다: " + (error.reason || error.message));
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return <div className="overview-container loading-container"><div className="loading-spinner"></div><p>DAO 정보를 불러오는 중...</p></div>;
  }

  // [수정] currentDAO가 없을 경우의 에러 메시지
  if (error || !currentDAO) {
    return <div className="overview-container error-container"><p>{error || "DAO를 찾을 수 없습니다."}</p></div>;
  }

  return (
    <div className="dao-overview-page overview-container loaded">
      <div className="dao-header-section">
        <div className="dao-profile">
            <div className="dao-avatar-container">
              <div className="dao-avatar"><img src="/images/dao-avatar.png" alt="DAO Avatar" /></div>
            </div>
            <div className="dao-info">
              <div className="dao-name">{currentDAO.name.replace(/\\n/g, ' ')}</div>
              <div className="dao-description">{currentDAO.description}</div>
            </div>
        </div>
          <div className="join-section-top">
            {isMember ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  className="leave-btn" 
                  onClick={handleLeaveClick} 
                  disabled={isLeaving}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isLeaving ? 'not-allowed' : 'pointer',
                    opacity: isLeaving ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isLeaving ? '탈퇴 중...' : '탈퇴'}
                </button>
                <button className="join-btn joined" disabled>✓ Joined</button>
              </div>
            ) : (
              <button className="join-btn" onClick={handleJoinClick} disabled={isJoining}>
                {isJoining ? '가입 진행 중...' : `Join (${daoDetails?.entryFee || '...'} ETH)`}
              </button>
            )}
          </div>
      </div>

      <div className="score-rule-section">
        <div className="glass-score-section">
          <div className="score-group">
            <h3 className="score-title">DAO Score</h3>
            <div className="group-score">
              <GlassScore score={averageScore} />
            </div>
          </div>
          <div className="score-personal">
            <h3 className="personal-score-title">내 기여도</h3>
            <div className="personal-score">
              <GlassScore score={myScore} />
              {!isMember && <small>멤버가 아닙니다</small>}
            </div>
          </div>
        </div>

        <div className="rule-snapshot">
          <h3 className="rule-title">Governance Rules</h3>
          {daoDetails ? (
            <div className="rule-grid">
              <div className="rule-item">
                <div className="rule-icon">🎯</div>
                <div className="rule-content">
                  <div className="rule-name">통과 기준</div>
                  <div className="rule-value">{daoDetails.passCriteria}%</div>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">⏰</div>
                <div className="rule-content">
                  <div className="rule-name">투표 기간</div>
                  <div className="rule-value">{daoDetails.votingDuration}일</div>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">💰</div>
                <div className="rule-content">
                  <div className="rule-name">가입비</div>
                  <div className="rule-value">{daoDetails.entryFee} ETH</div>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">💸</div>
                <div className="rule-content">
                  <div className="rule-name">미참여 페널티</div>
                  <div className="rule-value">{daoDetails.absentPenalty} ETH</div>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">🚫</div>
                <div className="rule-content">
                  <div className="rule-name">추방 페널티 횟수</div>
                  <div className="rule-value">{daoDetails.countToExpel}회</div>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">📉</div>
                <div className="rule-content">
                  <div className="rule-name">추방 점수</div>
                  <div className="rule-value">{daoDetails.scoreToExpel}점</div>
                </div>
              </div>
            </div>
          ) : (<p>규칙 정보를 불러오는 중...</p>)}
        </div>
      </div>

      <div className="contract-section">
        <div className="contract-info">
          <div className="contract-icon">📄</div>
          <div className="contract-details">
            <div className="contract-label">Smart Contract</div>
            <div className="contract-address">{`${currentDAO.contractAddress.substring(0, 6)}...${currentDAO.contractAddress.substring(currentDAO.contractAddress.length - 4)}`}</div>
          </div>
        </div>
        <a href={`https://sepolia.etherscan.io/address/${currentDAO.contractAddress}`} target="_blank" rel="noopener noreferrer" className="contract-link-btn">
          <span>View</span><div className="link-arrow">↗</div>
        </a>
      </div>
    </div>
  );
};

export default DaoOverview;