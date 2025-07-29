import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/DaoOverview.css";
import { fetchDao } from "../services/daoApi";


// DaoOverview 컴포넌트
const DaoOverview: React.FC = () => {
  const { id } = useParams();
  const [dao, setDao] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Api를 통해 id에 맞는 DAO 메타데이터 호출
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchDao(id)
      .then(setDao)
      .finally(() => setLoading(false));
  }, [id]);
  
  if (loading) return <div>로딩 중...</div>;
  if (!dao) return <div>DAO를 찾을 수 없습니다.</div>;
  
  return(
    <section className="dao-overview">
      {/* DAO 프로필 영역 */}
      <div className="dao-profile">
        <div className="dao-image">img</div>
        <div>
          <h2 className="dao-title">{dao.name}</h2>
          <div className="dao-id">{dao.handle}</div>
          <div className="dao-date">created on {dao.created}</div>
        </div>
      </div>
      {/* DAO 통계 영역 */}
      <div className="dao-stats">
        <div>
          <div className="stat-label">Member</div>
          <div className="stat-value">{dao.member}</div>
        </div>
        <div>
          <div className="stat-label">Vote</div>
          <div className="stat-value">{dao.vote}</div>
        </div>
        <div>
          <div className="stat-label">Proposal</div>
          <div className="stat-value">{dao.proposal}</div>
        </div>
      </div>
      {/* DAO 금고(재정) 영역 */}
      <div className="dao-treasury">
        <div className="treasury-label">Collective Treasury</div>
        <div className="treasury-amount">{dao.treasury.toLocaleString()}</div>
      </div>
      {/* DAO 지표(바) 영역 */}
      <div className="dao-bars">
        <div>
          <div className="bar-label">Glass score</div>
          <div className="bar-bg">
            <div className="bar-fill glass" style={{width:`${dao.glassScore}%`}} />
          </div>
        </div>
        <div>
          <div className="bar-label">Voting participation</div>
          <div className="bar-bg">
            <div className="bar-fill vote" style={{width: `${dao.voteParticipation}%`}} />
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
};

export default DaoOverview;