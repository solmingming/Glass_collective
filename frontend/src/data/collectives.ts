export interface Collective {
  id: string;
  name: string;
  description: string;
  participants: number;
  category: string;
  isActive: boolean;
  contractAddress: string;
}

// 모든 DAO 목록의 단일 원천
export const allCollectives: Collective[] = [
  {
    id: 'my-first-dao-sepolia',
    name: 'My First DAO Sepolia',
    description: 'This is my first DAO deployed on Sepolia!',
    participants: 1900,
    category: 'technology',
    isActive: true,
    contractAddress: '0xa050fb69034eeE8C84E8Df6Cc2df204c8BcE0773'
  },
  {
    id: 'sample-tech-startup',
    name: 'Sample Tech Startup',
    description: '혁신적인 기술 스타트업 생태계',
    participants: 1890,
    category: 'technology',
    isActive: true,
    contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' // 예시 주소
  },
  {
    id: 'sample-gaming-collective',
    name: 'Sample Gaming Collective',
    description: '게임과 메타버스 생태계 구축',
    participants: 1567,
    category: 'gaming',
    isActive: true,
    contractAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' // 예시 주소
  },
  // ... (나머지 DAO 정보들도 여기에 유지) ...
];