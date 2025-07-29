import { ethers } from 'ethers';

// ABI 파일들 import
import GovernanceTokenABI from '../contracts/GovernanceToken.sol/GovernanceToken.json';
import EnhancedProposalABI from '../contracts/EnhancedProposal.sol/EnhancedProposal.json';
import VotingABI from '../contracts/Voting.sol/Voting.json';
import ExecutionABI from '../contracts/Execution.sol/Execution.json';
import VaultABI from '../contracts/Vault.sol/Vault.json';
import AutoExecutionABI from '../contracts/AutoExecution.sol/AutoExecution.json';
import CorruptionMonitorABI from '../contracts/CorruptionMonitor.sol/CorruptionMonitor.json';

// 컨트랙트 ABI 타입 정의
export interface ContractABIs {
  GovernanceToken: any[];
  EnhancedProposal: any[];
  Voting: any[];
  Execution: any[];
  Vault: any[];
  AutoExecution: any[];
  CorruptionMonitor: any[];
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
  GovernanceToken: '0x...', // 배포 후 실제 주소로 변경
  EnhancedProposal: '0x...',
  Voting: '0x...',
  Execution: '0x...',
  Vault: '0x...',
  AutoExecution: '0x...',
  CorruptionMonitor: '0x...'
};

// 컨트랙트 ABI (실제 ABI 사용)
const CONTRACT_ABIS: ContractABIs = {
  GovernanceToken: GovernanceTokenABI.abi,
  EnhancedProposal: EnhancedProposalABI.abi,
  Voting: VotingABI.abi,
  Execution: ExecutionABI.abi,
  Vault: VaultABI.abi,
  AutoExecution: AutoExecutionABI.abi,
  CorruptionMonitor: CorruptionMonitorABI.abi
};

class ContractService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: any = {};

  // Provider 초기화
  async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
    } else {
      // 로컬 네트워크 연결
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
    const expectedChainId = NETWORKS.LOCALHOST.chainId; // 또는 SEPOLIA
    
    return network.chainId === BigInt(expectedChainId);
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
    
    // 이벤트에서 proposalId 추출
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