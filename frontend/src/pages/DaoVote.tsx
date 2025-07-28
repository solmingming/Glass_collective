import React from "react";
import "../styles/DaoOverview.css";

const DaoVote: React.FC = () => (
  <section className="dao-overview">
    <div className="dao-profile">
      <div className="dao-image">Vote</div>
      <div>
        <h2 className="dao-title">Voting System</h2>
        <div className="dao-id">@mad_camp0x</div>
        <div className="dao-date">created on 2025.06</div>
      </div>
    </div>
    <div className="dao-stats">
      <div>
        <div className="stat-label">Total Votes</div>
        <div className="stat-value">150</div>
      </div>
      <div>
        <div className="stat-label">Active</div>
        <div className="stat-value">8</div>
      </div>
      <div>
        <div className="stat-label">Completed</div>
        <div className="stat-value">142</div>
      </div>
    </div>
    <div className="dao-treasury">
      <div className="treasury-label">Voting Power</div>
      <div className="treasury-amount">85%</div>
    </div>
    <div className="dao-bars">
      <div>
        <div className="bar-label">Voter Turnout</div>
        <div className="bar-bg">
          <div className="bar-fill glass" style={{width: "85%"}} />
        </div>
      </div>
      <div>
        <div className="bar-label">Consensus Rate</div>
        <div className="bar-bg">
          <div className="bar-fill vote" style={{width: "92%"}} />
        </div>
      </div>
    </div>
    <div className="dao-activity">
      <div className="activity-label">
        <button className="activity-button">Latest Voting Activity</button>
      </div>
    </div>
  </section>
);

export default DaoVote;