import React, { useState, useEffect } from 'react';
import '../styles/DaoHistory.css'; // 일반 CSS 파일 임포트

// 히스토리 아이템의 타입을 정의합니다.
type HistoryItem = {
  id: number;
  type: 'proposal' | 'member_event';
  date: string; // 날짜별로 그룹화하기 위한 필드
  actor?: string;
  action?: 'join' | 'leave';
};

// 디자인과 똑같이 보이도록 만든 임시(mock) 데이터
const mockHistoryData: HistoryItem[] = [
  { id: 1, type: 'proposal', date: '2025.07.29' },
  { id: 2, type: 'member_event', date: '2025.07.29', actor: '0xa123bfe...', action: 'join' },
  { id: 3, type: 'proposal', date: '2025.07.29' },
  { id: 4, type: 'proposal', date: '2025.07.28' },
  { id: 5, type: 'member_event', date: '2025.07.27', actor: '0x456...', action: 'leave' },
  { id: 6, type: 'proposal', date: '2025.07.27' },
];

const DaoHistory: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setHistoryItems(mockHistoryData);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return <div className="history-container">Loading History...</div>;
  }

  return (
    <div className="history-container">
      <h1 className="history-title">History</h1>
      <div className="history-timeline">
        {/* 세로선: 타임라인 전체를 관통하는 중앙선 */}
        <div className="vertical-line" />
        {historyItems.map((item, index) => {
          const showDateHeader = index === 0 || historyItems[index - 1].date !== item.date;
          return (
            <div key={item.id} className="timeline-item">
              {showDateHeader && (
                <span className="date-header-inline">{item.date}</span>
              )}
              {item.type === 'proposal' ? (
                <div className="proposal-placeholder center-timeline-item"></div>
              ) : (
                <>
                  <div className="timeline-dot center-timeline-item"></div>
                  <span className="event-desc-separate">{item.actor} {item.action}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DaoHistory;