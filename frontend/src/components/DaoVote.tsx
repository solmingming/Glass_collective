import React from "react";
import "./../styles/DaoVote.css";

// 예시 데이터
const dummyVotes = [
  {
    id: 1,
    title: "A를 회장으로!",
    emoji: "🕶️",
    endDate: "2025.08.01 17:00",
    chartData: [60, 20, 20], // 찬성, 기권, 반대 (%)
  },
  {
    id: 2,
    title: "참가비 높이자",
    emoji: "🟫",
    endDate: "2025.08.02 17:00",
    chartData: [40, 30, 30],
  },
  {
    id: 3,
    title: "점메추",
    emoji: "🟫",
    endDate: "2025.08.03 17:00",
    chartData: [50, 25, 25],
  },
  {
    id: 4,
    title: "오늘 뭐하지",
    emoji: "🟫",
    endDate: "2025.08.04 17:00",
    chartData: [70, 10, 20],
  },
];

// 원그래프(도넛차트) SVG 컴포넌트 (간단한 예시)
const DonutChart = ({ data }: { data: number[] }) => {
  // data: [찬성, 기권, 반대] (비율)
  const total = data.reduce((a, b) => a + b, 0);
  const angles = data.map(v => (v / total) * 360);

  // 각 파이의 시작/끝 각도 계산
  let startAngle = 0;
  const paths = angles.map((angle, i) => {
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = 50 + 40 * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = 50 + 40 * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = 50 + 40 * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = 50 + 40 * Math.sin((Math.PI * (endAngle - 90)) / 180);
    const color = ["#3cb371", "#aaa", "#e74c3c"][i];
    const d = `
      M 50 50
      L ${x1} ${y1}
      A 40 40 0 ${largeArc} 1 ${x2} ${y2}
      Z
    `;
    startAngle = endAngle;
    return <path key={i} d={d} fill={color} />;
  });

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      {paths}
      <circle cx="50" cy="50" r="25" fill="#fff" />
    </svg>
  );
};

const DaoVote: React.FC = () => {
  return (
    <div className="dao-vote-container">
      <div className="dao-vote-header">
        <h2>Votes</h2>
        <span className="edit-icon" title="Create Vote">✏️</span>
      </div>
      <div className="vote-list">
        {dummyVotes.map((vote) => (
          <div className="vote-card" key={vote.id}>
            <div className="vote-card-header">
              <div className="vote-emoji">{vote.emoji}</div>
              <div className="vote-title">
                <span className="vote-id">{vote.id}</span> {vote.title}
              </div>
              <div className="vote-end-date">기한: {vote.endDate}</div>
            </div>
            <div className="vote-card-body">
              <DonutChart data={vote.chartData} />
              <div className="vote-actions">
                <span className="action-yes">✔️</span>
                <span className="action-neutral">➖</span>
                <span className="action-no">❌</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DaoVote;