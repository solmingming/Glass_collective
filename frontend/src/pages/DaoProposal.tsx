import React from "react";
import "../styles/DaoOverview.css";

// DaoProposal 컴포넌트
const DaoProposal: React.FC = () => (
  <section className="dao-overview">
    {/* 프로필, 통계, 금고, 바, 활동 등 DaoOverview와 동일 구조 */}
    <div className="dao-profile">
      <div className="dao-image">Proposal</div>
      <div>
        <h2 className="dao-title">Proposal</h2>
        <div className="dao-id">@mad_camp0x</div>
        <div className="dao-date">created on 2025.06</div>
      </div>
    </div>
    <div className="dao-stats">
      <div>
        <div className="stat-label">Total Proposals</div>
        <div className="stat-value">35</div>
      </div>
      <div>
        <div className="stat-label">Open</div>
        <div className="stat-value">5</div>
      </div>
      <div>
        <div className="stat-label">Closed</div>
        <div className="stat-value">30</div>
      </div>
    </div>
    <div className="dao-treasury">
      <div className="treasury-label">Proposal Treasury</div>
      <div className="treasury-amount">50,000,000</div>
    </div>
    <div className="dao-bars">
      <div>
        <div className="bar-label">Proposal Success Rate</div>
        <div className="bar-bg">
          <div className="bar-fill glass" style={{width: "80%"}} />
        </div>
      </div>
      <div>
        <div className="bar-label">Participation</div>
        <div className="bar-bg">
          <div className="bar-fill vote" style={{width: "65%"}} />
        </div>
      </div>
    </div>
    <div className="dao-activity">
      <div className="activity-label">
        <button className="activity-button">Lasted Proposal Activity</button>
      </div>
    </div>
  </section>
);

export default DaoProposal;