import React from "react";
import "../styles/DaoOverview.css";

const DaoHistory: React.FC = () => (
  <section className="dao-overview">
    <div className="dao-profile">
      <div className="dao-image">Hist</div>
      <div>
        <h2 className="dao-title">Activity History</h2>
        <div className="dao-id">@mad_camp0x</div>
        <div className="dao-date">created on 2025.06</div>
      </div>
    </div>
    <div className="dao-stats">
      <div>
        <div className="stat-label">Total Events</div>
        <div className="stat-value">1,250</div>
      </div>
      <div>
        <div className="stat-label">This Month</div>
        <div className="stat-value">45</div>
      </div>
      <div>
        <div className="stat-label">This Week</div>
        <div className="stat-value">12</div>
      </div>
    </div>
    <div className="dao-treasury">
      <div className="treasury-label">Activity Score</div>
      <div className="treasury-amount">A+</div>
    </div>
    <div className="dao-bars">
      <div>
        <div className="bar-label">Participation Rate</div>
        <div className="bar-bg">
          <div className="bar-fill glass" style={{width: "78%"}} />
        </div>
      </div>
      <div>
        <div className="bar-label">Engagement Level</div>
        <div className="bar-bg">
          <div className="bar-fill vote" style={{width: "91%"}} />
        </div>
      </div>
    </div>
    <div className="dao-activity">
      <div className="activity-label">
        <button className="activity-button">View Full History</button>
      </div>
    </div>
  </section>
);

export default DaoHistory;