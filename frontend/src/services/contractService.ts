import { ethers } from 'ethers';

// ABI 파일들 import
import GovernanceTokenABI from '../contracts/GovernanceToken.json';
import EnhancedProposalABI from '../contracts/EnhancedProposal.json';
import VotingABI from '../contracts/Voting.json';
import ExecutionABI from '../contracts/Execution.json';
import VaultABI from '../contracts/Vault.json';
import AutoExecutionABI from '../contracts/AutoExecution.json';
import CorruptionMonitorABI from '../contracts/CorruptionMonitor.json';
import ProposalABI from '../contracts/Proposal.json'; // DAO 기능은 Proposal 컨트랙트에 있음

// 컨트랙트 ABI 타입 정의
export interface ContractABIs {
  GovernanceToken: any[];
  EnhancedProposal: any[];
  Voting: any[];
  Execution: any[];
  Vault: any[];
  AutoExecution: any[];
  CorruptionMonitor: any[];
  Proposal: any[]; // Proposal 컨트랙트 (DAO 기능 포함)
}

// 컨트랙트 주소 타입 정의
export interface ContractAddresses {
  GovernanceToken: string;
  EnhancedProposal: string;
  Voting: string;
  Execution: string;
  Vault: string;
  AutoExecution: string;
  CorruptionMonitor: string;
  Proposal: string; // Proposal 컨트랙트 (DAO 기능 포함)
}

// 프론트엔드와 공유할 Collective 데이터 타입
export interface Collective {
  id: string;
  name: string;
  description: string;
  participants: number;
  category: string;
  isActive: boolean;
  contractAddress: string; // << [중요] 각 DAO의 컨트랙트 주소 필드
}

// 네트워크 설정
export const NETWORKS = {
  LOCALHOST: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545'
  },
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID'
  }
};

// 기본 컨트랙트 주소 (배포 후 업데이트 필요)
const DEFAULT_ADDRESSES: ContractAddresses = {
  GovernanceToken: '0x...',
  EnhancedProposal: '0x...',
  Voting: '0x...',
  Execution: '0x...',
  Vault: '0x...',
  AutoExecution: '0x...',
  CorruptionMonitor: '0x...',
  Proposal: '0x...' // 기본값은 사용되지 않음
};

// 컨트랙트 ABI (실제 ABI 사용)
const CONTRACT_ABIS: ContractABIs = {
  GovernanceToken: GovernanceTokenABI.abi,
  EnhancedProposal: EnhancedProposalABI.abi,
  Voting: VotingABI.abi,
  Execution: ExecutionABI.abi,
  Vault: VaultABI.abi,
  AutoExecution: AutoExecutionABI.abi,
  CorruptionMonitor: CorruptionMonitorABI.abi,
  Proposal: ProposalABI.abi // Proposal ABI 등록
};

class ContractService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: any = {};

  // Provider 초기화
  async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
    } else {
      this.provider = new ethers.JsonRpcProvider(NETWORKS.LOCALHOST.rpcUrl);
    }
  }

  // 컨트랙트 인스턴스 생성
  async createContractInstance(contractName: keyof ContractAddresses, address?: string) {
    if (!this.provider) {
      await this.initializeProvider();
    }

    const contractAddress = address || DEFAULT_ADDRESSES[contractName];
    const abi = CONTRACT_ABIS[contractName];

    if (!this.signer) {
      throw new Error('지갑이 연결되지 않았습니다.');
    }

    return new ethers.Contract(contractAddress, abi, this.signer);
  }

  // 지갑 연결
  async connectWallet(): Promise<string> {
    if (typeof window !== 'undefined' && window.ethereum) {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      return accounts[0];
    }
    throw new Error('MetaMask가 설치되지 않았습니다.');
  }

  // 네트워크 확인
  async checkNetwork(): Promise<boolean> {
    if (!this.provider) return false;
    
    const network = await this.provider.getNetwork();
    const expectedChainId = NETWORKS.LOCALHOST.chainId;
    
    return network.chainId === BigInt(expectedChainId);
  }

  // +++ 신규 추가된 함수 +++
  // 모든 DAO 리스트와 사용자 주소를 받아, 사용자가 멤버인 DAO만 필터링하여 반환
  async filterMyDAOs(allCollectives: Collective[], userAddress: string): Promise<Collective[]> {
    console.log("🔍 filterMyDAOs called with:", allCollectives.length, "collectives, user:", userAddress);
    
    if (!this.provider || !userAddress) {
      console.warn("❌ Provider or user address not available for filtering.");
      return [];
    }
  
    // 각 DAO의 멤버십을 확인하는 비동기 작업 배열을 생성합니다.
    const membershipChecks = allCollectives.map(async (collective, index) => {
      console.log(`🔗 Checking membership for ${collective.name} (${index + 1}/${allCollectives.length})`);
      
      // 컨트랙트 주소가 유효한지 먼저 확인합니다.
      if (!ethers.isAddress(collective.contractAddress)) {
        console.error(`❌ Invalid contract address for ${collective.name}: ${collective.contractAddress}`);
        return false;
      }
      
      try {
        // 임시: 실제 컨트랙트 호출 대신 시뮬레이션 
        // TODO: 실제 배포된 컨트랙트가 있을 때 주석 해제
        // const daoContract = new ethers.Contract(collective.contractAddress, CONTRACT_ABIS.Proposal, this.provider);
        // const isUserMember = await daoContract.isMember(userAddress);
        
        // 임시로 첫 번째와 세 번째 DAO만 멤버로 시뮬레이션
        const isUserMember = index === 0 || index === 2;
        console.log(`✅ ${collective.name} membership result:`, isUserMember);
        return isUserMember;
      } catch (error) {
        // 컨트랙트 호출 중 오류가 발생하면 (예: 존재하지 않는 컨트랙트) 멤버가 아닌 것으로 처리합니다.
        console.error(`❌ Error checking membership for ${collective.name} at ${collective.contractAddress}:`, error);
        return false;
      }
    });
  
    // Promise.all을 사용하여 모든 멤버십 확인 작업을 병렬로 실행합니다.
    const results = await Promise.all(membershipChecks);
    console.log("🔍 Membership check results:", results);
  
    // 멤버십 확인 결과가 true인 collective만 필터링하여 새로운 배열로 반환합니다.
    const myDAOs = allCollectives.filter((_, index) => results[index]);
    console.log("🎯 Final filtered DAOs:", myDAOs.length, myDAOs.map(d => d.name));
    return myDAOs;
  }

  // GovernanceToken 관련 함수들
  async getTokenBalance(address: string): Promise<string> {
    const contract = await this.createContractInstance('GovernanceToken');
    const balance = await contract.balanceOf(address);
    return ethers.formatEther(balance);
  }

  async getStakedBalance(address: string): Promise<string> {
    const contract = await this.createContractInstance('GovernanceToken');
    const balance = await contract.stakedBalanceOf(address);
    return ethers.formatEther(balance);
  }

  async getVotingPower(address: string): Promise<string> {
    const contract = await this.createContractInstance('GovernanceToken');
    const power = await contract.getVotingPower(address);
    return ethers.formatEther(power);
  }

  async stake(amount: string): Promise<void> {
    const contract = await this.createContractInstance('GovernanceToken');
    const amountWei = ethers.parseEther(amount);
    const tx = await contract.stake(amountWei);
    await tx.wait();
  }

  async unstake(amount: string): Promise<void> {
    const contract = await this.createContractInstance('GovernanceToken');
    const amountWei = ethers.parseEther(amount);
    const tx = await contract.unstake(amountWei);
    await tx.wait();
  }

  // EnhancedProposal 관련 함수들
  async createProposal(
    title: string,
    description: string,
    amount: string,
    recipient: string,
    category: number
  ): Promise<number> {
    const contract = await this.createContractInstance('EnhancedProposal');
    const amountWei = ethers.parseEther(amount);
    const tx = await contract.createProposal(title, description, amountWei, recipient, category);
    const receipt = await tx.wait();
    
    const event = receipt.logs.find((log: any) => 
      log.eventName === 'ProposalCreated'
    );
    return event?.args?.proposalId || 0;
  }

  async getProposal(proposalId: number): Promise<any> {
    const contract = await this.createContractInstance('EnhancedProposal');
    return await contract.getProposal(proposalId);
  }

  async getProposalsByCategory(category: number): Promise<any[]> {
    const contract = await this.createContractInstance('EnhancedProposal');
    return await contract.getProposalsByCategory(category);
  }

  // Voting 관련 함수들
  async vote(proposalId: number, support: boolean): Promise<void> {
    const contract = await this.createContractInstance('Voting');
    const tx = await contract.vote(proposalId, support);
    await tx.wait();
  }

  async getVotes(proposalId: number): Promise<[string, string]> {
    const contract = await this.createContractInstance('Voting');
    return await contract.getVotes(proposalId);
  }

  // Vault 관련 함수들
  async getVaultBalance(): Promise<string> {
    const contract = await this.createContractInstance('Vault');
    const balance = await contract.getBalance();
    return ethers.formatEther(balance);
  }

  async depositToVault(amount: string): Promise<void> {
    const contract = await this.createContractInstance('Vault');
    const amountWei = ethers.parseEther(amount);
    const tx = await contract.deposit({ value: amountWei });
    await tx.wait();
  }

  // CorruptionMonitor 관련 함수들
  async getCorruptionIndex(): Promise<number> {
    const contract = await this.createContractInstance('CorruptionMonitor');
    return await contract.getCorruptionIndex();
  }

  async updateMetrics(
    transparencyScore: number,
    participationRate: number,
    proposalSuccessRate: number
  ): Promise<void> {
    const contract = await this.createContractInstance('CorruptionMonitor');
    const tx = await contract.updateMetrics(transparencyScore, participationRate, proposalSuccessRate);
    await tx.wait();
  }
}

export const contractService = new ContractService();
export default contractService;