import React from "react";
import "../styles/DaoOverview.css";

// DaoRulebook 컴포넌트
const DaoRulebook: React.FC = () => (
  <section className="dao-overview">
    {/* 프로필, 통계, 금고, 바, 활동 등 DaoOverview와 동일 구조 */}
    <div className="dao-profile">
      <div className="dao-image">Rule</div>
      <div>
        <h2 className="dao-title">Rule Book</h2>
        <div className="dao-id">@mad_camp0x</div>
        <div className="dao-date">created on 2025.06</div>
      </div>
    </div>
    <div className="dao-stats">
      <div>
        <div className="stat-label">Total Rules</div>
        <div className="stat-value">15</div>
      </div>
      <div>
        <div className="stat-label">Active</div>
        <div className="stat-value">12</div>
      </div>
      <div>
        <div className="stat-label">Draft</div>
        <div className="stat-value">3</div>
      </div>
    </div>
    <div className="dao-treasury">
      <div className="treasury-label">Rule Compliance Rate</div>
      <div className="treasury-amount">95%</div>
    </div>
    <div className="dao-bars">
      <div>
        <div className="bar-label">Rule Adherence</div>
        <div className="bar-bg">
          <div className="bar-fill glass" style={{width: "95%"}} />
        </div>
      </div>
      <div>
        <div className="bar-label">Community Consensus</div>
        <div className="bar-bg">
          <div className="bar-fill vote" style={{width: "88%"}} />
        </div>
      </div>
    </div>
    <div className="dao-activity">
      <div className="activity-label">
        <button className="activity-button">Latest Rule Updates</button>
      </div>
    </div>
  </section>
);

export default DaoRulebook;