import React from "react";
import "../styles/DaoOverview.css";

const DaoMypage: React.FC = () => (
  <section className="dao-overview">
    <div className="dao-profile">
      <div className="dao-image">My</div>
      <div>
        <h2 className="dao-title">My Profile</h2>
        <div className="dao-id">@mad_camp0x</div>
        <div className="dao-date">member since 2025.01</div>
      </div>
    </div>
    <div className="dao-stats">
      <div>
        <div className="stat-label">My Votes</div>
        <div className="stat-value">89</div>
      </div>
      <div>
        <div className="stat-label">My Proposals</div>
        <div className="stat-value">7</div>
      </div>
      <div>
        <div className="stat-label">My Activity</div>
        <div className="stat-value">156</div>
      </div>
    </div>
    <div className="dao-treasury">
      <div className="treasury-label">My Contribution</div>
      <div className="treasury-amount">92%</div>
    </div>
    <div className="dao-bars">
      <div>
        <div className="bar-label">Participation Rate</div>
        <div className="bar-bg">
          <div className="bar-fill glass" style={{width: "92%"}} />
        </div>
      </div>
      <div>
        <div className="bar-label">Reputation Score</div>
        <div className="bar-bg">
          <div className="bar-fill vote" style={{width: "88%"}} />
        </div>
      </div>
    </div>
    <div className="dao-activity">
      <div className="activity-label">
        <button className="activity-button">Edit Profile</button>
      </div>
    </div>
  </section>
);

export default DaoMypage;