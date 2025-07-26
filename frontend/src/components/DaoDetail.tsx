import React from "react";
import "../styles/DaoDetail.css"

const DaoDetail: React.FC = () => (
  <section className="dao-detail">
    <div className="dao-profile">
      <div className="dao-image">몰입캠프</div>
      <div>
        <h2 className="dao-title">Mad_camp</h2>
        <div className="dao-id">@mad_camp0x</div>
        <div className="dao-date">created on 2025.06</div>
      </div>
    </div>
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
    <div className="dao-treasury">
      <div className="treasury-label">Collective Treasury</div>
      <div className="treasury-amount">150,000,000</div>
    </div>
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
    <div className="dao-activity">
      <div className="activity-label">
        <button className="activity-button">Lasted Activity</button>
      </div>
    </div>
  </section>
);

export default DaoDetail;