import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import GlassScore from "./GlassScore"; // GlassScore 컴포넌트가 있다고 가정
import { contractService, type DAO } from "../services/contractService";
import "../styles/DaoOverview.css";

// DAO의 상세 정보 및 규칙을 담을 타입
interface DaoDetails extends DAO {
  rules: {
    passCriteria: number;
    votingDuration: number;
    absentPenalty: string;
    countToExpel: number;
    scoreToExpel: number;
    entryFee: string;
  };
  members: string[]; // 멤버 목록을 포함
}

// Glass Score 관리를 위한 임시 DB 서비스 (localStorage 사용)
const glassScoreDB = {
  getScores: (daoId: string): { [memberAddress: string]: number } => {
    const scores = localStorage.getItem(`glass_scores_${daoId}`);
    return scores ? JSON.parse(scores) : {};
  },
  getScore: (daoId: string, memberAddress: string): number => {
    const scores = glassScoreDB.getScores(daoId);
    return scores[memberAddress.toLowerCase()] ?? 50; // 기본값 50
  },
  setScore: (daoId: string, memberAddress: string, newScore: number) => {
    const scores = glassScoreDB.getScores(daoId);
    scores[memberAddress.toLowerCase()] = newScore;
    localStorage.setItem(`glass_scores_${daoId}`, JSON.stringify(scores));
  },
  calculateDaoScore: (daoId: string, members: string[]): number => {
    if (members.length === 0) return 0;
    const scores = glassScoreDB.getScores(daoId);
    const totalScore = members.reduce((sum, member) => {
      return sum + (scores[member.toLowerCase()] ?? 50);
    }, 0);
    return Math.round(totalScore / members.length);
  }
};


const DaoOverview: React.FC = () => {
  const { id: daoId } = useParams<{ id: string }>();
  const location = useLocation();

  // --- 상태 관리 ---
  const [daoDetails, setDaoDetails] = useState<DaoDetails | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [myGlassScore, setMyGlassScore] = useState(0);
  const [daoGlassScore, setDaoGlassScore] = useState(0);

  // --- 데이터 로딩 함수 ---
  const loadDaoData = useCallback(async () => {
    if (!daoId) {
      setError("DAO address not found in URL.");
      return;
    }
    
    try {
      // 항상 DAO의 공개 정보를 먼저 로드
      const details = await contractService.getDaoDetails(daoId);
      
      // 가결된 규칙 변경 제안 확인 및 적용
      try {
        const proposals = await contractService.getAllProposals(daoId);
        const passedRuleChanges = proposals.filter((prop: any, index: number) => {
          const proposalId = proposals.length - 1 - index;
          const status = Number(prop.status);
          const isRuleChange = prop.sanctionType === 'rule-change';
          return status === 1 && isRuleChange; // 1 = Passed
        });
        
        // 가결된 규칙 변경을 적용
        if (passedRuleChanges.length > 0) {
          console.log("Found passed rule changes:", passedRuleChanges);
          
          // 가결된 규칙 변경을 details에 적용
          passedRuleChanges.forEach((proposal: any) => {
            const ruleName = proposal.title;
            const newValue = Number(proposal.afterValue);
            
            if (ruleName === 'passCriteria') {
              details.rules.passCriteria = newValue;
            } else if (ruleName === 'votingDuration') {
              details.rules.votingDuration = newValue;
            } else if (ruleName === 'absentPenalty') {
              details.rules.absentPenalty = (newValue / 1e18).toString() + ' ETH';
            } else if (ruleName === 'countToExpel') {
              details.rules.countToExpel = newValue;
            } else if (ruleName === 'scoreToExpel') {
              details.rules.scoreToExpel = newValue;
            } else if (ruleName === 'entryFee') {
              details.rules.entryFee = (newValue / 1e18).toString() + ' ETH';
            }
          });
          
          console.log("Updated DAO rules:", details.rules);
        }
      } catch (proposalError) {
        console.warn("Failed to check rule changes:", proposalError);
      }
      
      setDaoDetails(details);
      
      const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
      const currentAddress = accounts?.[0]?.toLowerCase();

      if (currentAddress && details) {
        setWalletAddress(currentAddress);
        const memberStatus = details.members.map((addr: string) => addr.toLowerCase()).includes(currentAddress);
        setIsMember(memberStatus);
        
        // 멤버 상태에 따라 점수 설정
        setMyGlassScore(memberStatus ? glassScoreDB.getScore(daoId, currentAddress) : 0);
        setDaoGlassScore(glassScoreDB.calculateDaoScore(daoId, details.members));
      } else {
        // 지갑 연결 안된 유저도 DAO 평균 점수는 볼 수 있도록 설정
        setDaoGlassScore(glassScoreDB.calculateDaoScore(daoId, details.members));
      }
    } catch (err) {
      setError("Failed to load DAO details. Please check the address and your network.");
      console.error("DAO 로딩 오류:", err);
    }
  }, [daoId]);

  // --- 초기 로딩 및 지갑 계정 변경 감지 ---
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await loadDaoData();
      setIsLoading(false);
    };
    initialize();

    // MetaMask 계정 변경 감지
    const handleAccountsChanged = () => {
        // 페이지를 새로고침하여 상태를 초기화하고 새 계정으로 데이터를 다시 로드
        window.location.reload();
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);

    return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [loadDaoData]);

  // --- *** MODIFIED: 단순화된 DAO 가입 핸들러 *** ---
  const handleJoinClick = async () => {
    // 1. 지갑 연결 확인 및 요청
    if (!walletAddress) {
      try {
        const address = await contractService.connectWallet();
        setWalletAddress(address);
        alert("Wallet connected! Please click 'Join' again to complete the transaction.");
      } catch (err) {
        setError("Wallet connection is required to join this collective.");
      }
      return;
    }
    
    // 2. 이미 멤버인 경우 함수 종료
    if (isMember) return;
    if (!daoDetails) return;

    // 3. 가입 트랜잭션 실행
    setIsJoinLoading(true);
    setError("");
    try {
      if (daoDetails.collectiveType === 'private') {
        const inviteCode = location.state?.inviteCode;
        if (!inviteCode) throw new Error("An invite code is required to join this private DAO. Please access it again from the search page.");
        await contractService.joinPrivateDAO(daoDetails.id, inviteCode);
      } else {
        await contractService.joinPublicDAO(daoDetails.id);
      }
      alert("Welcome! You have successfully joined the DAO.");
      
      // 4. 가입 성공 후, 최신 데이터로 화면 갱신
      await loadDaoData();

    } catch (err: any) {
      setError(err.message || "An error occurred while trying to join.");
      console.error("DAO 가입 오류:", err);
    } finally {
      setIsJoinLoading(false);
    }
  };

  if (isLoading) return <div className="overview-container status-message">Loading DAO Details...</div>;
  if (error && !daoDetails) return <div className="overview-container status-message error">{error}</div>;
  if (!daoDetails) return <div className="overview-container status-message">DAO not found.</div>;

  return (
    <div className="dao-overview-page overview-container loaded">
      <div className="dao-header-section">
        <div className="dao-profile">
          {/* --- *** NEW: 공동금고 잔액과 멤버 수 표시 *** --- */}
          <div className="dao-stats">
            <div className="stat-item">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">Treasury</div>
                <div className="stat-value">{daoDetails.treasuryBalance} Sep ETH</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Members</div>
                <div className="stat-value">{daoDetails.participants}</div>
              </div>
            </div>
          </div>
          
          <div className="dao-info">
            <div className="dao-name">{daoDetails.name}</div>
            <div className="dao-description">{daoDetails.description}</div>
          </div>
        </div>
        
        {/* --- *** MODIFIED: 헤더 우측 '가입' 버튼 UI *** --- */}
        <div className="join-section-top">
          <button 
            className={`join-btn ${isMember ? 'joined' : ''}`} 
            onClick={handleJoinClick} 
            disabled={isMember || isJoinLoading}
          >
            {isMember 
              ? "✅ Joined" 
              : isJoinLoading 
                ? "Processing..." 
                // 지갑 연결이 안됐을 때와 됐을 때 다른 텍스트 표시
                : walletAddress ? "+ Join This Collective" : "Connect Wallet to Join"
            }
          </button>
        </div>
      </div>
      
      {/* 에러가 있을 때만 배너 표시 */}
      {error && <div className="error-banner">{error}</div>}

      {/* Glass Score & Rule Book 섹션 */}
      <div className="score-rule-section">
        <div className="glass-score-section">
          <div className="score-group">
            <h3 className="score-title">DAO Score</h3>
            <div className="group-score"><GlassScore score={daoGlassScore} /></div>
          </div>
          <div className="score-personal">
            <h3 className="personal-score-title">My Contribution</h3>
            <div className="personal-score">
              <GlassScore score={myGlassScore} />
            </div>
          </div>
        </div>

        <div className="rule-snapshot">
          <h3 className="rule-title">Governance Rules</h3>
          <div className="rule-grid">
            <RuleItem icon="🎯" name="Threshold" value={`${daoDetails.rules.passCriteria}%`} />
            <RuleItem icon="⏰" name="Voting Period" value={`${daoDetails.rules.votingDuration / 86400} days`} />
            <RuleItem icon="💰" name="Entry Fee" value={`${daoDetails.rules.entryFee} ETH`} />
            <RuleItem icon="💸" name="Penalty Fee" value={`${daoDetails.rules.absentPenalty} ETH`} />
            <RuleItem icon="🚫" name="Expel Count" value={`${daoDetails.rules.countToExpel} times`} />
            <RuleItem icon="📉" name="Expel Score" value={`Under ${daoDetails.rules.scoreToExpel} pts`} />
          </div>
        </div>
      </div>

      {/* Smart Contract 섹션 */}
      <div className="contract-section">
        <div className="contract-info">
          <div className="contract-icon">📄</div>
          <div className="contract-details">
            <div className="contract-label">Smart Contract Address</div>
            <div className="contract-address">{daoDetails.id.slice(0, 6)}...{daoDetails.id.slice(-4)}</div>
          </div>
        </div>
        <a 
          href={`https://sepolia.etherscan.io/address/${daoDetails.id}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="contract-link-btn"
        >
          <span>View on Etherscan</span>
          <div className="link-arrow">↗</div>
        </a>
      </div>
    </div>
  );
};

// 규칙 아이템을 위한 헬퍼 컴포넌트
const RuleItem: React.FC<{ icon: string; name: string; value: string }> = ({ icon, name, value }) => (
  <div className="rule-item">
    <div className="rule-icon">{icon}</div>
    <div className="rule-content">
      <div className="rule-name">{name}</div>
      <div className="rule-value">{value}</div>
    </div>
  </div>
);

export default DaoOverview;