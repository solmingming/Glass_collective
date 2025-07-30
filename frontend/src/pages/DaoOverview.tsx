import React, { useState, useEffect } from "react";
import GlassScore from "../components/GlassScore";
import "../styles/DaoOverview.css";

const DaoOverview: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showJoinButton, setShowJoinButton] = useState(true); // Join 버튼 표시 여부

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleJoinClick = () => {
    // Join 버튼 클릭 시 로직
    console.log("Join button clicked!");
    // 여기에 실제 join 로직 추가
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
              우리는 새로운 가능성을 탐구하며, 서로의 경험과 지식을 나누어 더 나은 미래를 만들어갑니다.
            </div>
          </div>
        </div>
        
        {/* Join 버튼 - 우측 상단 */}
        {showJoinButton && (
          <div className="join-section-top">
            <button className="join-btn" onClick={handleJoinClick}>
              <span className="join-icon">+</span>
              <span className="join-text">Join</span>
            </button>
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