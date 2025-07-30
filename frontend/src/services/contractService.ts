import { ethers } from 'ethers';

// ABI 파일들 import
import ProposalABI from '../contracts/Proposal.json';
import DAOABI from '../contracts/DAO.json';

// --- 필요한 인터페이스 정의 ---
export interface Collective {
  id: string;
  name: string;
  description: string;
  participants: number;
  category: string;
  isActive: boolean;
  contractAddress: string;
}

export interface DaoDetails {
  passCriteria: number;
  votingDuration: number; // 일(days) 단위
  entryFee: string; // "ETH" 단위
  absentPenalty: string; // "ETH" 단위
  countToExpel: number;
  scoreToExpel: number;
  proposalContractAddress: string;
}

class ContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  // --- Provider 초기화 ---
  async initializeProvider() {
    if (this.provider) return;

    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      const network = await this.provider.getNetwork();
      if (network.chainId !== BigInt(11155111)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
          this.provider = new ethers.BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();
        } catch (error) {
          alert("DApp을 사용하려면 Sepolia 테스트넷으로 전환해주세요.");
          throw new Error("네트워크 전환 필요");
        }
      }
    } else {
      alert("DApp을 사용하려면 MetaMask를 설치해주세요.");
      throw new Error("MetaMask 없음");
    }
  }

  // --- 지갑 연결 ---
  async connectWallet(): Promise<string> {
    await this.initializeProvider();
    if (!this.signer) throw new Error("지갑 연결 실패");
    return this.signer.getAddress();
  }

  // --- DAO 규칙 정보 조회 ---
  async getDaoDetails(daoAddress: string): Promise<DaoDetails> {
    await this.initializeProvider();
    const daoContract = new ethers.Contract(daoAddress, DAOABI.abi, this.provider);
  
    const [
      passCriteria, votingDuration, entryFee, absentPenalty,
      countToExpel, scoreToExpel, proposalContractAddress,
    ] = await Promise.all([
      daoContract.passCriteria(),
      daoContract.votingDuration(),
      daoContract.entryFee(),
      daoContract.absentPenalty(),
      daoContract.countToExpel(),
      daoContract.scoreToExpel(),
      daoContract.proposalContract(),
    ]);
  
    return {
      passCriteria: Number(passCriteria),
      votingDuration: Number(votingDuration) / (60 * 60 * 24),
      entryFee: ethers.formatEther(entryFee),
      absentPenalty: ethers.formatEther(absentPenalty),
      countToExpel: Number(countToExpel),
      scoreToExpel: Number(scoreToExpel),
      proposalContractAddress: proposalContractAddress,
    };
  }
  
  // --- 내 Glass Score 조회 ---
  async getMyGlassScore(proposalAddress: string, userAddress: string): Promise<number> {
    await this.initializeProvider();
    const proposalContract = new ethers.Contract(proposalAddress, ProposalABI.abi, this.provider);
    const score = await proposalContract.glassScore(userAddress);
    return Number(score);
  }

  // --- [신규 추가] DAO 전체 Glass Score 평균 계산 ---
  async getDaoAverageScore(proposalAddress: string): Promise<number> {
    await this.initializeProvider();
    const proposalContract = new ethers.Contract(proposalAddress, ProposalABI.abi, this.provider);

    const members: string[] = await proposalContract.getAllMembers();
    if (members.length === 0) {
      return 0;
    }

    // 모든 멤버의 점수 조회를 병렬로 처리
    const scorePromises = members.map(memberAddress => proposalContract.glassScore(memberAddress));
    const scores = await Promise.all(scorePromises);

    // 모든 점수의 합계를 계산
    const totalScore = scores.reduce((sum, score) => sum + Number(score), 0);
    
    // 평균 계산
    return Math.round(totalScore / members.length);
  }

  // --- 내가 멤버인지 확인 ---
  async isMember(daoAddress: string, userAddress: string): Promise<boolean> {
    await this.initializeProvider();
    const daoContract = new ethers.Contract(daoAddress, DAOABI.abi, this.provider);
    return daoContract.isMember(userAddress);
  }

  // --- DAO 가입 ---
  async joinDAO(daoAddress: string): Promise<void> {
    await this.initializeProvider();
    if (!this.signer) throw new Error("지갑이 연결되지 않았습니다.");
    
    const daoContract = new ethers.Contract(daoAddress, DAOABI.abi, this.signer);
    const entryFee = await daoContract.entryFee();
    
    const tx = await daoContract.joinDAO({ value: entryFee });
    await tx.wait();
  }

  // --- DAO 탈퇴 ---
  async leaveDAO(daoAddress: string): Promise<void> {
    await this.initializeProvider();
    if (!this.signer) throw new Error("지갑이 연결되지 않았습니다.");
    
    const daoContract = new ethers.Contract(daoAddress, DAOABI.abi, this.signer);
    const tx = await daoContract.leaveDAO();
    await tx.wait();
  }

  // --- 내가 가입한 DAO 필터링 ---
  async filterMyDAOs(allCollectives: Collective[], walletAddress: string): Promise<Collective[]> {
    const myDaos: Collective[] = [];
    
    for (const collective of allCollectives) {
      try {
        const isMember = await this.isMember(collective.contractAddress, walletAddress);
        if (isMember) {
          myDaos.push(collective);
        }
      } catch (error) {
        console.warn(`Failed to check membership for ${collective.name}:`, error);
      }
    }
    
    return myDaos;
  }
}

export const contractService = new ContractService();
export default contractService;