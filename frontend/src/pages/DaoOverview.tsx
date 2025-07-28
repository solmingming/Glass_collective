import React from "react";
import "../styles/DaoOverview.css";

// DaoOverview 컴포넌트
const DaoOverview: React.FC = () => (
  // 전체 섹션을 감싸는 div (공통 className)
  <section className="dao-overview">
    {/* DAO 프로필 영역 */}
    <div className="dao-profile">
      <div className="dao-image">img</div>
      <div>
        <h2 className="dao-title">Mad_camp</h2>
        <div className="dao-id">@mad_camp0x</div>
        <div className="dao-date">created on 2025.06</div>
      </div>
    </div>
    {/* DAO 통계 영역 */}
    <div className="dao-stats">
      <div>
        <div className="stat-label">Member</div>
        <div className="stat-value">20</div>
      </div>
      <div>
        <div className="stat-label">Vote</div>
        <div className="stat-value">20</div>
      </div>
      <div>
        <div className="stat-label">Proposal</div>
        <div className="stat-value">35</div>
      </div>
    </div>
    {/* DAO 금고(재정) 영역 */}
    <div className="dao-treasury">
      <div className="treasury-label">Collective Treasury</div>
      <div className="treasury-amount">150,000,000</div>
    </div>
    {/* DAO 지표(바) 영역 */}
    <div className="dao-bars">
      <div>
        <div className="bar-label">Glass score</div>
        <div className="bar-bg">
          <div className="bar-fill glass" style={{width: "70%"}} />
        </div>
      </div>
      <div>
        <div className="bar-label">Voting participation</div>
        <div className="bar-bg">
          <div className="bar-fill vote" style={{width: "60%"}} />
        </div>
      </div>
    </div>
    {/* 최근 활동 영역 */}
    <div className="dao-activity">
      <div className="activity-label">
        <button className="activity-button">Lasted Activity</button>
      </div>
    </div>
  </section>
);

export default DaoOverview;