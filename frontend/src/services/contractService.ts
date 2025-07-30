import { ethers } from 'ethers';

// ABI 파일들 import (현재 배포된 컨트랙트들)
import DAOABI from '../contracts/DAO.sol/DAO.json';
import ProposalABI from '../contracts/Proposal.sol/Proposal.json';
import ExecutionABI from '../contracts/Execution.sol/Execution.json';
import VaultABI from '../contracts/Vault.sol/Vault.json';

// 컨트랙트 ABI 타입 정의
export interface ContractABIs {
  DAO: any[];
  Proposal: any[];
  Execution: any[];
  Vault: any[];
}

// 컨트랙트 주소 타입 정의
export interface ContractAddresses {
  DAO: string;
  Proposal: string;
  Execution: string;
  Vault: string;
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
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/JwmYsRJLt8dFHUIWtNARe'
  }
};

// Sepolia에 배포된 컨트랙트 주소
const SEPOLIA_ADDRESSES: ContractAddresses = {
  DAO: '0x93D43C2b4DA4Ce841125276a5FC3d447846f5a62',
  Proposal: '0x3b252B33A7596d116420F54A987012097afaf2F1',
  Execution: '0x8E04122a1254477053Ca60a445aCd2a60F887ed3',
  Vault: '0x3fBa889931249C2AA907633da210429dC48F9515'
};

// 기본 컨트랙트 주소 (로컬 개발용)
const DEFAULT_ADDRESSES: ContractAddresses = {
  DAO: '0x0000000000000000000000000000000000000000', // 로컬 배포 시 실제 주소로 변경
  Proposal: '0x0000000000000000000000000000000000000000',
  Execution: '0x0000000000000000000000000000000000000000',
  Vault: '0x0000000000000000000000000000000000000000'
};

// 컨트랙트 ABI
const CONTRACT_ABIS: ContractABIs = {
  DAO: DAOABI.abi,
  Proposal: ProposalABI.abi,
  Execution: ExecutionABI.abi,
  Vault: VaultABI.abi
};

class ContractService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: any = {};
  private currentNetwork: 'localhost' | 'sepolia' = 'localhost';

  // Provider 초기화
  async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // 네트워크 확인
      const network = await this.provider.getNetwork();
      if (network.chainId === BigInt(11155111)) {
        this.currentNetwork = 'sepolia';
      }
    } else {
      // 로컬 네트워크 연결
      this.provider = new ethers.JsonRpcProvider(NETWORKS.LOCALHOST.rpcUrl);
      this.signer = await this.provider.getSigner();
    }
  }

  // 컨트랙트 인스턴스 생성
  async createContractInstance(contractName: keyof ContractAddresses, address?: string) {
    if (!this.provider) {
      await this.initializeProvider();
    }

    // Sepolia 네트워크인지 확인
    if (this.currentNetwork === 'sepolia') {
      const contractAddress = address || SEPOLIA_ADDRESSES[contractName];
      const abi = CONTRACT_ABIS[contractName];

      if (!this.signer) {
        throw new Error('지갑이 연결되지 않았습니다.');
      }

      return new ethers.Contract(contractAddress, abi, this.signer);
    } else {
      throw new Error('Sepolia 네트워크에 연결해주세요.');
    }
  }

  // 지갑 연결
  async connectWallet(): Promise<string> {
    if (typeof window !== 'undefined' && window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await this.initializeProvider();
      return accounts[0];
    }
    throw new Error('MetaMask가 설치되지 않았습니다.');
  }

  // 네트워크 확인
  async checkNetwork(): Promise<boolean> {
    if (!this.provider) {
      await this.initializeProvider();
    }
    
    const network = await this.provider!.getNetwork();
    return network.chainId === BigInt(11155111); // Sepolia
  }

  // DAO 관련 함수들
  async joinDAO(): Promise<void> {
    const daoContract = await this.createContractInstance('DAO');
    const entryFee = await daoContract.entryFee();
    await daoContract.joinDAO({ value: entryFee });
  }

  async createProposal(
    title: string,
    description: string,
    amount: string,
    recipient: string,
    requireVote: boolean = true,
    sanctionType: string = '',
    beforeValue: number = 0,
    afterValue: number = 0,
    targetMember: string = '0x0000000000000000000000000000000000000000'
  ): Promise<number> {
    try {
      const daoContract = await this.createContractInstance('DAO');
      
      console.log('제안 생성 시작:', {
        title,
        description,
        amount,
        recipient,
        requireVote,
        sanctionType
      });

      // 트랜잭션 실행
      const tx = await daoContract.createProposal(
        title,
        description,
        ethers.parseEther(amount),
        recipient,
        requireVote,
        sanctionType,
        beforeValue,
        afterValue,
        targetMember
      );

      console.log('트랜잭션 전송됨:', tx.hash);

      // 트랜잭션 완료 대기
      const receipt = await tx.wait();
      
      console.log('트랜잭션 완료:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      // 제안 ID 추출 - 트랜잭션 해시 기반으로 임시 ID 생성
      const proposalId = Date.now(); // 임시 ID (실제로는 이벤트에서 추출해야 함)

      console.log('제안 생성 완료, ID:', proposalId);
      return proposalId;

    } catch (error: any) {
      console.error('제안 생성 오류:', error);
      
      // 구체적인 에러 메시지 추출
      if (error.reason) {
        throw new Error(`제안 생성 실패: ${error.reason}`);
      } else if (error.message) {
        throw new Error(`제안 생성 실패: ${error.message}`);
      } else {
        throw new Error('제안 생성 중 알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  async vote(proposalId: number, choice: number): Promise<void> {
    const daoContract = await this.createContractInstance('DAO');
    await daoContract.vote(proposalId, choice);
  }

  async finalizeProposal(proposalId: number): Promise<void> {
    const daoContract = await this.createContractInstance('DAO');
    await daoContract.finalizeProposal(proposalId);
  }

  // Vault 관련 함수들
  async getVaultBalance(): Promise<string> {
    const vaultContract = await this.createContractInstance('Vault');
    const balance = await vaultContract.getBalance();
    return ethers.formatEther(balance);
  }

  async depositToVault(amount: string): Promise<void> {
    const vaultContract = await this.createContractInstance('Vault');
    await vaultContract.receive({ value: ethers.parseEther(amount) });
  }

  // Proposal 관련 함수들
  async getProposal(proposalId: number): Promise<any> {
    const proposalContract = await this.createContractInstance('Proposal');
    return await proposalContract.getProposal(proposalId);
  }

  async getAllProposals(): Promise<any[]> {
    const proposalContract = await this.createContractInstance('Proposal');
    // 구현 필요 - Proposal 컨트랙트에 getAllProposals 함수 추가 필요
    return [];
  }

  // Glass Score 관련 함수들
  async getGlassScore(address: string): Promise<number> {
    const proposalContract = await this.createContractInstance('Proposal');
    return await proposalContract.getGlassScore(address);
  }

  async getAllMembers(): Promise<string[]> {
    const proposalContract = await this.createContractInstance('Proposal');
    return await proposalContract.getAllMembers();
  }
}

export default new ContractService(); 