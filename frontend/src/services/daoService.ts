export interface DAO {
  id: string;
  name: string;
  description: string;
  participants: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  collectiveType: 'public' | 'private';
  inviteCode?: string;
  nftInvitation?: any;
  rules?: {
    threshold: number;
    votingDuration: number;
    maxKickCount: number;
    entryFee: number;
    penaltyFee: number;
  };
}

class DAOService {
  private readonly STORAGE_KEY = 'glass_collective_daos';

  // 모든 DAO 가져오기
  getAllDAOs(): DAO[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading DAOs:', error);
      return [];
    }
  }

  // 새 DAO 추가
  addDAO(dao: Omit<DAO, 'id' | 'createdAt'>): DAO {
    const newDAO: DAO = {
      ...dao,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    const existingDAOs = this.getAllDAOs();
    const updatedDAOs = [...existingDAOs, newDAO];
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedDAOs));
      return newDAO;
    } catch (error) {
      console.error('Error saving DAO:', error);
      throw error;
    }
  }

  // DAO 업데이트
  updateDAO(id: string, updates: Partial<DAO>): DAO | null {
    const daos = this.getAllDAOs();
    const index = daos.findIndex(dao => dao.id === id);
    
    if (index === -1) return null;

    const updatedDAO = { ...daos[index], ...updates };
    daos[index] = updatedDAO;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(daos));
      return updatedDAO;
    } catch (error) {
      console.error('Error updating DAO:', error);
      throw error;
    }
  }

  // DAO 삭제
  deleteDAO(id: string): boolean {
    const daos = this.getAllDAOs();
    const filteredDAOs = daos.filter(dao => dao.id !== id);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDAOs));
      return true;
    } catch (error) {
      console.error('Error deleting DAO:', error);
      return false;
    }
  }

  // ID로 DAO 찾기
  getDAOById(id: string): DAO | null {
    const daos = this.getAllDAOs();
    return daos.find(dao => dao.id === id) || null;
  }

  // 카테고리별 DAO 필터링
  getDAOsByCategory(category: string): DAO[] {
    const daos = this.getAllDAOs();
    return daos.filter(dao => dao.category === category);
  }

  // 검색어로 DAO 필터링
  searchDAOs(searchTerm: string): DAO[] {
    const daos = this.getAllDAOs();
    const term = searchTerm.toLowerCase();
    
    return daos.filter(dao => 
      dao.name.toLowerCase().includes(term) ||
      dao.description.toLowerCase().includes(term) ||
      dao.category.toLowerCase().includes(term)
    );
  }

  // 참가자 수 업데이트
  updateParticipantCount(id: string, newCount: number): boolean {
    const dao = this.getDAOById(id);
    if (!dao) return false;

    return this.updateDAO(id, { participants: newCount }) !== null;
  }

  // 고유 ID 생성
  private generateId(): string {
    return `dao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 초기 샘플 DAO 데이터
  initializeSampleData(): void {
    const existingDAOs = this.getAllDAOs();
    if (existingDAOs.length > 0) return; // 이미 데이터가 있으면 초기화하지 않음

    const sampleDAOs: Omit<DAO, 'id' | 'createdAt'>[] = [
      {
        name: 'Glass\nCollective',
        description: '투명하고 공정한 Web3 공동체',
        participants: 1250,
        category: 'glass',
        isActive: true,
        collectiveType: 'public'
      },
      {
        name: 'Tech\nStartup',
        description: '혁신적인 기술 스타트업 생태계',
        participants: 1890,
        category: 'technology',
        isActive: true,
        collectiveType: 'public'
      },
      {
        name: 'DeFi\nCollective',
        description: '탈중앙화 금융 생태계 구축',
        participants: 3421,
        category: 'finance',
        isActive: true,
        collectiveType: 'public'
      },
      {
        name: 'Art\nCollective',
        description: '디지털 아트와 NFT를 통한 창작자 공동체',
        participants: 567,
        category: 'art',
        isActive: true,
        collectiveType: 'public'
      },
      {
        name: 'AI\nCollective',
        description: '인공지능과 머신러닝 연구 공동체',
        participants: 2156,
        category: 'technology',
        isActive: true,
        collectiveType: 'public'
      }
    ];

    sampleDAOs.forEach(dao => this.addDAO(dao));
  }
}

export const daoService = new DAOService(); 