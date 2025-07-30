import React, { useState, useEffect } from "react";
import GlassScore from "../components/GlassScore";
import contractService from "../services/contractService";
import "../styles/DaoOverview.css";

const DaoOverview: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showJoinButton, setShowJoinButton] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError("");
      const address = await contractService.connectWallet();
      setWalletAddress(address);
      setIsConnected(true);
      console.log("지갑 연결됨:", address);
    } catch (err) {
      setError("지갑 연결에 실패했습니다.");
      console.error("지갑 연결 오류:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClick = async () => {
    if (!isConnected) {
      setError("먼저 지갑을 연결해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await contractService.joinDAO();
      setShowJoinButton(false);
      console.log("DAO 가입 완료!");
    } catch (err) {
      setError("DAO 가입에 실패했습니다.");
      console.error("DAO 가입 오류:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`dao-overview-page overview-container ${isLoaded ? 'loaded' : ''}`}>
      {/* 1. 헤더 섹션 - 세련된 상단 배치 */}
      <div className="dao-header-section">
        <div className="dao-profile">
          <div className="dao-avatar-container">
            <div className="dao-avatar">
              <img src="/images/dao-avatar.png" alt="DAO Avatar" />
            </div>
            <div className="dao-type-overlay">
              <span className="dao-type public">Public</span>
            </div>
          </div>
          <div className="dao-info">
            <div className="dao-name">mad_camp collective</div>
            <div className="dao-description">
              혁신적인 아이디어를 공유하고 함께 성장하는 창작자들의 모임입니다. 
              우리는 새로운 가능성을 탐구하며, 서로의 경험과 지식을 나누어 더 나은 미래를 만들어갑니다.
            </div>
          </div>
        </div>
        
        {/* Join 버튼 - 우측 상단 */}
        {showJoinButton && (
          <div className="join-section-top">
            {!isConnected ? (
              <button className="join-btn" onClick={connectWallet} disabled={isLoading}>
                <span className="join-icon">🔗</span>
                <span className="join-text">{isLoading ? "연결 중..." : "지갑 연결"}</span>
              </button>
            ) : (
              <button className="join-btn" onClick={handleJoinClick} disabled={isLoading}>
                <span className="join-icon">+</span>
                <span className="join-text">{isLoading ? "가입 중..." : "Join"}</span>
              </button>
            )}
          </div>
        )}
        
        {/* 지갑 주소 표시 */}
        {isConnected && (
          <div className="wallet-info">
            <span className="wallet-address">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* 성공 메시지 */}
        {isConnected && !error && (
          <div className="success-message">
            ✅ DAO 멤버로 연결되었습니다!
          </div>
        )}
      </div>

      {/* 2. Glass Score & Rule Book - 수평 배치 */}
      <div className="score-rule-section">
        <div className="glass-score-section">
          <div className="score-group">
            <h3 className="score-title">DAO Score</h3>
            <div className="group-score">
              <GlassScore score={87} />
            </div>
          </div>
          
          <div className="score-personal">
            <h3 className="personal-score-title">내 기여도</h3>
            <div className="personal-score">
              <GlassScore score={92} />
            </div>
          </div>
        </div>

        <div className="rule-snapshot">
          <h3 className="rule-title">Governance Rules</h3>
          <div className="rule-grid">
            <div className="rule-item">
              <div className="rule-icon">🎯</div>
              <div className="rule-content">
                <div className="rule-name">임계값</div>
                <div className="rule-value">60%</div>
              </div>
            </div>
            
            <div className="rule-item">
              <div className="rule-icon">⏰</div>
              <div className="rule-content">
                <div className="rule-name">투표 기간</div>
                <div className="rule-value">7일</div>
              </div>
            </div>
            
            <div className="rule-item">
              <div className="rule-icon">💰</div>
              <div className="rule-content">
                <div className="rule-name">입장 예치금</div>
                <div className="rule-value">₩100K</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Smart Contract - 참신한 미니멀 디자인 */}
      <div className="contract-section">
        <div className="contract-info">
          <div className="contract-icon">📄</div>
          <div className="contract-details">
            <div className="contract-label">Smart Contract</div>
            <div className="contract-address">0x1234...abcd</div>
          </div>
        </div>
        <a 
          href="https://etherscan.io/address/0x1234567890abcdef" 
          target="_blank" 
          rel="noopener noreferrer"
          className="contract-link-btn"
        >
          <span>View</span>
          <div className="link-arrow">↗</div>
        </a>
      </div>
    </div>
  );
};

export default DaoOverview;