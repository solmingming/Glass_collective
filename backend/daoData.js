// backend/daoData.js
const daoList = [
  {
    "id": "DAO_TEST1",
    "name": "DAO_TEST1_NAME",
    "created": "2025.07",
    "member": 10,
    "treasury": 1500000,
    "daoGlassScore": 50,
    "voteParticipation": 0,
    "rules": {
      "passThreshold": "50%",
      "votePeriod": "3일",
      "absentPenalty": "0.001ETH",
      "countToExpel": 5,
      "entryFee": "0.001ETH",
    },
    "proposals": [
      {
        "id": "p001",
        "title": "공동 잔고 입금",
        "description": "@user1이 2025년 8월 회비 10,000원을 공동 잔고에 입금합니다.",
        "proposer": "@user1",
        "created": "2025.08.10",
        "status": "완료",
        "requireVote": false,
        "type": "treasury-in",
        "amount": 10000,
        "source": "@user1",
        "reason": "2025년 8월 회비"
      },
      {
        "id": "p002",
        "title": "공동 잔고 출금",
        "description": "서버비 30,000원 출금 제안 (2025년 8월)",
        "proposer": "@admin",
        "created": "2025.08.11",
        "status": "진행중",
        "requireVote": true,
        "type": "treasury-out",
        "amount": 30000,
        "target": "서버비",
        "reason": "월간 운영비"
      },
      {
        "id": "p003",
        "title": "DAO 규칙 변경",
        "description": "투표 정족수를 30%에서 40%로 상향 조정합니다.",
        "proposer": "@user2",
        "created": "2025.08.12",
        "status": "진행중",
        "requireVote": true,
        "type": "rule-change",
        "ruleTarget": "vote-quorum",
        "before": "30%",
        "after": "40%"
      },
      {
        "id": "p004",
        "title": "멤버 초대",
        "description": "@newmember 님을 DAO 멤버로 초대합니다.",
        "proposer": "@user3",
        "created": "2025.08.13",
        "status": "진행중",
        "requireVote": true,
        "type": "member-invite",
        "targetMember": "@newmember"
      },
      {
        "id": "p005",
        "title": "멤버 추방",
        "description": "@baduser 님을 DAO에서 추방합니다.",
        "proposer": "@admin",
        "created": "2025.08.14",
        "status": "진행중",
        "requireVote": true,
        "type": "member-expel",
        "targetMember": "@baduser"
      },
      {
        "id": "p006",
        "title": "멤버 징계(투표권 박탈)",
        "description": "@lazyuser 님의 투표권을 1개월간 박탈합니다.",
        "proposer": "@admin",
        "created": "2025.08.15",
        "status": "진행중",
        "requireVote": true,
        "type": "member-sanction",
        "targetMember": "@lazyuser",
        "sanctionType": "vote-ban",
        "duration": "1개월"
      },
      {
        "id": "p007",
        "title": "공지: 8월 워크샵 안내",
        "description": "8월 20일(수) 19:00에 오프라인 워크샵이 진행됩니다.",
        "proposer": "@admin",
        "created": "2025.08.16",
        "status": "완료",
        "requireVote": false,
        "type": "announcement"
      }
    ]
  },
  {
    "id": "DAO_TEST2",
    "name": "DAO_TEST2_NAME",
    "created": "2025.06",
    "member": 8,
    "treasury": 800000,
    "daoGlassScore": 50,
    "voteParticipation": 0,
    "rules": {
      "passThreshold": "50%",
      "votePeriod": "5일",
      "absentPenalty": "0.002ETH",
      "countToExpel": 3,
      "entryFee": "0.002ETH",
    },
    "proposals": [
      // DAO_TEST2의 proposal들
    ]
  }
];

module.exports = daoList;