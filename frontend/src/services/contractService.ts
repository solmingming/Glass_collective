import { ethers } from 'ethers';

// ABI 파일 import
import DAOFactoryABI from '../contracts/DAOFactory.json';
import DaoABI from '../contracts/DAO.json';
import ProposalABI from '../contracts/Proposal.json';
import VaultABI from '../contracts/Vault.json';

// --- *** 1. MODIFIED: 타입 정의를 새로운 기능에 맞게 확장 *** ---
export interface RuleSettings {
  threshold: number;
  votingDuration: number;
  entryFee: number;
  penaltyFee: number;
  countToExpel: number;
  scoreToExpel: number;
}

export interface DAO {
  id: string;
  name: string;
  description: string;
  category: string;
  participants: number;
  treasuryBalance: string;
  isActive: boolean;
  contractAddress: string;
  collectiveType: 'public' | 'private';
}

export interface DAOCreationData {
  name: string;
  description: string;
  category: string;
  collectiveType: 'public' | 'private';
  inviteCode?: string;
  rules: RuleSettings;
}

export type ProposalType = "treasury-in" | "treasury-out" | "rule-change";

export interface ProposalCreationData {
  daoAddress: string;
  title: string;
  description: string;
  proposalType: ProposalType;
  amount?: string; // ETH 단위 (treasury-in, treasury-out)
  recipient?: string; // 수신자 주소 (treasury-out)
  ruleToChange?: string; // 변경할 규칙 이름 (rule-change)
  newValue?: number; // 새로운 규칙 값 (rule-change)
}

// .env 환경 변수 로드 (Vite 환경)
const INFURA_PROJECT_ID = import.meta.env.VITE_INFURA_PROJECT_ID;
const DAO_FACTORY_ADDRESS = import.meta.env.VITE_DAO_FACTORY_ADDRESS || "0xf1cD4D3299f9D11aaF88e0878A24145Ab5Af7f42";

console.log("=== Environment Variables Debug ===");
console.log("VITE_INFURA_PROJECT_ID:", import.meta.env.VITE_INFURA_PROJECT_ID);
console.log("VITE_DAO_FACTORY_ADDRESS:", import.meta.env.VITE_DAO_FACTORY_ADDRESS);
console.log("Using DAO_FACTORY_ADDRESS:", DAO_FACTORY_ADDRESS);
console.log("===================================");

if (!INFURA_PROJECT_ID) {
  throw new Error("VITE_INFURA_PROJECT_ID is not set in .env file.");
}

if (!DAO_FACTORY_ADDRESS) {
  throw new Error("VITE_DAO_FACTORY_ADDRESS is not set in .env file.");
}

const SEPOLIA_RPC_URL = `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`;

class ContractService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;
  private factoryContract: ethers.Contract | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    }
  }
  
  async connectWallet(): Promise<string> {
    if (!(this.provider instanceof ethers.BrowserProvider)) {
        throw new Error('MetaMask is not installed.');
    }
    const accounts = await this.provider.send('eth_requestAccounts', []);
    this.signer = await this.provider.getSigner();
    
    try {
      // 현재 네트워크 확인
      const network = await this.provider.getNetwork();
      console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
      
      console.log("Connecting to DAO Factory at:", DAO_FACTORY_ADDRESS);
      this.factoryContract = new ethers.Contract(DAO_FACTORY_ADDRESS!, DAOFactoryABI.abi, this.signer);
      
      // 컨트랙트 존재 여부 체크 제거 (RPC 노드 문제로 인해 임시 비활성화)
      console.log("DAO Factory contract instance created successfully");
    } catch (error) {
      console.error("Contract connection error:", error);
      throw new Error(`Failed to connect to DAO Factory contract at ${DAO_FACTORY_ADDRESS}. Please check if the contract is deployed and the address is correct.`);
    }
    
    return accounts[0];
  }

  // *** 2. MODIFIED: createDAO 함수가 모든 규칙들을 처리하도록 수정 ***
  async createDAO(data: DAOCreationData): Promise<string> {
    if (!this.signer || !this.factoryContract) {
      throw new Error('Wallet not connected.');
    }
    const creatorAddress = await this.signer.getAddress();

    const votingDurationInSeconds = data.rules.votingDuration * 24 * 60 * 60;
    const entryFeeInWei = ethers.parseEther(data.rules.entryFee.toString());
    const penaltyFeeInWei = ethers.parseEther(data.rules.penaltyFee.toString());

    const tx = await this.factoryContract.createDAO(
      data.name,
      data.description,
      data.category,
      creatorAddress,
      data.collectiveType === 'private',
      data.inviteCode || "",
      data.rules.threshold,
      votingDurationInSeconds,
      entryFeeInWei,
      penaltyFeeInWei,
      data.rules.countToExpel,
      data.rules.scoreToExpel
    );

    const receipt = await tx.wait();
    const createdEvent = receipt.logs.map((log: any) => { 
      try { 
        return this.factoryContract!.interface.parseLog(log); 
      } catch (e) { 
        return null; 
      }
    }).find((event: any) => event?.name === 'DAOCreated');
    if (!createdEvent) { throw new Error("DAOCreated event not found."); }
    
    return (createdEvent as any).args.daoAddress;
  }

  // *** 3. MODIFIED: getAllDAOs 함수가 collectiveType을 처리하도록 수정 ***
  async getAllDAOs(): Promise<DAO[]> {
    const readOnlyFactory = new ethers.Contract(DAO_FACTORY_ADDRESS!, DAOFactoryABI.abi, this.provider);
    const creationEvents = await readOnlyFactory.queryFilter('DAOCreated');

    if (creationEvents.length === 0) return [];

    const daoPromises = creationEvents.map(async (event) => {
      const { daoAddress, name, description, category, isPrivate } = (event as any).args;
      try {
        const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.provider);
        const proposalContractAddress = await daoContract.proposalContract();
        const vaultContractAddress = await daoContract.vaultContract();
        const proposalContract = new ethers.Contract(proposalContractAddress, ProposalABI.abi, this.provider);
        const vaultContract = new ethers.Contract(vaultContractAddress, VaultABI.abi, this.provider);
        
        let memberCount = 0;
        let treasuryBalance = "0";
        
        try {
          const [memberCountResult, treasuryBalanceResult] = await Promise.all([
            proposalContract.getMemberCount(), 
            vaultContract.getBalance()
          ]);
          memberCount = Number(memberCountResult);
          treasuryBalance = ethers.formatEther(treasuryBalanceResult);
        } catch (error) {
          console.warn(`Failed to get details for DAO ${daoAddress}:`, error);
          // 기본값으로 설정
          memberCount = 9999;
          treasuryBalance = "0";
        }
        
        return {
          id: daoAddress,
          contractAddress: daoAddress,
          name: name,
          description: description,
          category: category,
          participants: memberCount,
          treasuryBalance: treasuryBalance,
          isActive: true,
          collectiveType: isPrivate ? 'private' : 'public',
        };
      } catch (error) {
        console.warn(`Failed to process DAO ${daoAddress}:`, error);
        return null;
      }
    });

    const settledDAOs = await Promise.all(daoPromises);
    return settledDAOs.filter(dao => dao !== null) as DAO[];
  }
  
  // *** 4. NEW: 초대 코드 검증 및 가입을 위한 새로운 함수들 추가 ***
  async verifyInviteCode(daoAddress: string, codeToCheck: string): Promise<boolean> {
    try {
      const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.provider);
      const storedHash = await daoContract.inviteCodeHash();
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes(codeToCheck));
      return storedHash === inputHash;
    } catch (error) {
      return false;
    }
  }

  async joinPublicDAO(daoAddress: string) {
    if (!this.signer) throw new Error("Wallet not connected");
    const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.signer);
    const entryFee = await daoContract.entryFee();
    const tx = await daoContract.joinDAO({ value: entryFee });
    return await tx.wait();
  }
  
  async joinPrivateDAO(daoAddress: string, inviteCode: string) {
    if (!this.signer) throw new Error("Wallet not connected");
    const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.signer);
    const entryFee = await daoContract.entryFee();
    const tx = await daoContract.joinDAOWithCode(inviteCode, { value: entryFee });
    return await tx.wait();
  }

    // 기본 DAO 가입 함수 (DaoOverview에서 사용)
  async joinDAO() {
    // 임시로 첫 번째 DAO에 가입하는 로직
    const daos = await this.getAllDAOs();
    if (daos.length === 0) {
      throw new Error("No DAOs available to join");
    }
     
    const firstDAO = daos[0];
    if (firstDAO.collectiveType === 'public') {
      return await this.joinPublicDAO(firstDAO.contractAddress);
    } else {
      throw new Error("Private DAO requires invite code");
    }
  }

  // ETH 잔고 조회 메서드 추가
  async getEthBalance(address: string): Promise<number> {
    try {
      const balance = await this.provider.getBalance(address);
      return Number(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error fetching ETH balance:", error);
      return 0;
    }
  }

  // 로그아웃 메서드 추가
  async logout(): Promise<void> {
    try {
      // MetaMask 연결 해제
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      }
      
      // 내부 상태 초기화
      this.signer = null;
      this.factoryContract = null;
      
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  }

  async getDaoDetails(daoAddress: string): Promise<any> {
    if (!ethers.isAddress(daoAddress)) {
      throw new Error(`Invalid DAO address: ${daoAddress}`);
    }

    // --- 1-A. DAO 생성 이벤트에서 이름, 설명, 카테고리 가져오기 ---
    // 팩토리 컨트랙트에 필터를 걸어 특정 DAO의 생성 이벤트만 찾습니다.
    const readOnlyFactory = new ethers.Contract(DAO_FACTORY_ADDRESS!, DAOFactoryABI.abi, this.provider);
    
    // 첫 번째 인자(daoAddress)를 기준으로 필터링
    const filter = readOnlyFactory.filters.DAOCreated(daoAddress);
    const creationEvents = await readOnlyFactory.queryFilter(filter);
    
    if (creationEvents.length === 0) {
      throw new Error(`Could not find creation event for DAO at ${daoAddress}`);
    }
    
    // 찾은 이벤트에서 이름, 설명, 카테고리를 추출합니다.
    const { name, description, category } = (creationEvents[0] as any).args;

    // --- 1-B. 개별 DAO 컨트랙트에서 동적 정보 가져오기 (기존 로직) ---
    const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.provider);
    const proposalContractAddress = await daoContract.proposalContract();
    const proposalContract = new ethers.Contract(proposalContractAddress, ProposalABI.abi, this.provider);

    const [
      isPrivate,
      members,
      passCriteria,
      votingDuration,
      absentPenalty,
      countToExpel,
      scoreToExpel,
      entryFee,
      vaultAddress
    ] = await Promise.all([
      daoContract.isPrivate(),
      proposalContract.getAllMembers(),
      daoContract.passCriteria(),
      daoContract.votingDuration(),
      daoContract.absentPenalty(),
      daoContract.countToExpel(),
      daoContract.scoreToExpel(),
      daoContract.entryFee(),
      daoContract.vaultContract()
    ]);

    // --- 1-C. Vault 컨트랙트에서 잔액 가져오기 ---
    let treasuryBalance = "0";
    try {
      const vaultContract = new ethers.Contract(vaultAddress, VaultABI.abi, this.provider);
      const balanceInWei = await vaultContract.getBalance();
      treasuryBalance = ethers.formatEther(balanceInWei);
    } catch (error) {
      console.warn("Failed to get vault balance:", error);
      treasuryBalance = "0";
    }

    // --- 1-D. 모든 정보를 취합하여 최종 객체 반환 ---
    return {
      id: daoAddress,
      contractAddress: daoAddress,
      name, // <-- 이제 실제 이벤트 로그에서 가져온 값
      description, // <-- 이제 실제 이벤트 로그에서 가져온 값
      category, // <-- 이제 실제 이벤트 로그에서 가져온 값
      collectiveType: isPrivate ? 'private' : 'public',
      participants: members.length,
      treasuryBalance, // <-- Vault에서 가져온 잔액
      members,
      rules: {
        passCriteria: Number(passCriteria),
        votingDuration: Number(votingDuration),
        absentPenalty: ethers.formatEther(absentPenalty),
        countToExpel: Number(countToExpel),
        scoreToExpel: Number(scoreToExpel),
        entryFee: ethers.formatEther(entryFee),
      }
    };
  }

  // *** NEW: 특정 사용자가 DAO의 멤버인지 확인하는 함수 ***
  async isMember(daoAddress: string, userAddress: string): Promise<boolean> {
    const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.provider);
    const proposalContractAddress = await daoContract.proposalContract();
    const proposalContract = new ethers.Contract(proposalContractAddress, ProposalABI.abi, this.provider);
    return await proposalContract.hasRole(await proposalContract.MEMBER_ROLE(), userAddress);
  }

  async createProposal(data: ProposalCreationData): Promise<any> {
    if (!this.signer) throw new Error("Wallet not connected");
    
    const daoContract = new ethers.Contract(data.daoAddress, DaoABI.abi, this.signer);
    
    // --- *** 2. MODIFIED: 제안 종류에 따른 인자 구성을 더 명확하게 변경 *** ---
    let title = data.title;
    let amountInWei = data.amount ? ethers.parseEther(data.amount) : 0;
    let recipient = data.recipient || ethers.ZeroAddress;
    let newValue = data.newValue || 0;

    // 입금 제안의 경우, recipient는 존재하지 않으며 금액만 필요합니다.
    if (data.proposalType === 'treasury-in') {
      recipient = ethers.ZeroAddress;
    }
    // 규칙 변경 제안의 경우, amount와 recipient는 0, title은 규칙 이름이 됩니다.
    else if (data.proposalType === 'rule-change') {
      title = data.ruleToChange!;
      amountInWei = 0;
      recipient = ethers.ZeroAddress;
    }
    
    const tx = await daoContract.createProposal(
      title,
      data.description,
      amountInWei,
      recipient,
      true, // 모든 제안은 투표 필요
      data.proposalType,
      0, // beforeValue (현재 미사용)
      newValue,
      ethers.ZeroAddress // targetMember (현재 미사용)
    );
    
    return await tx.wait();
  }

  // 특정 DAO의 모든 제안 조회
  async getAllProposals(daoAddress: string): Promise<any[]> {
    const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.provider);
    const proposalContractAddress = await daoContract.proposalContract();
    const proposalContract = new ethers.Contract(proposalContractAddress, ProposalABI.abi, this.provider);
    return await proposalContract.getAllProposals();
  }

  // 특정 제안에 투표하는 트랜잭션션
  async voteOnProposal(daoAddress: string, proposalId: number, choice: 0 | 1 | 2): Promise<any> {
    if (!this.signer) throw new Error("Wallet not connected");
    const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.signer);
    const tx = await daoContract.vote(proposalId, choice);
    return await tx.wait();
  }

  // 투표가 끝난 제안을 최종 처리하는 트랜잭션
  async finalizeProposal(daoAddress: string, proposalId: number): Promise<any> {
    if (!this.signer) throw new Error("Wallet not connected");
    const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.signer);
    const tx = await daoContract.finalizeProposal(proposalId);
    return await tx.wait();
  }

  // 제안의 투표 현황을 확인하는 함수
  async getProposalVoteStatus(daoAddress: string, proposalId: number): Promise<{
    votesFor: number;
    votesAgainst: number;
    votesAbstain: number;
    totalVotes: number;
    memberCount: number;
    canFinalize: boolean;
  }> {
    const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.provider);
    const proposalContractAddress = await daoContract.proposalContract();
    const proposalContract = new ethers.Contract(proposalContractAddress, ProposalABI.abi, this.provider);
    
    const proposal = await proposalContract.getProposal(proposalId);
    const memberCount = await proposalContract.getMemberCount();
    
    // 추가 디버깅: proposalDeadline 확인
    try {
      const proposalDeadline = await daoContract.proposalDeadline(proposalId);
      const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초)
      console.log(`Proposal ${proposalId} deadline info:`, {
        proposalDeadline: Number(proposalDeadline),
        currentTime,
        isDeadlineReached: Number(proposalDeadline) < currentTime
      });
    } catch (error) {
      console.log(`Could not fetch proposal deadline for ${proposalId}:`, error);
    }
    
    const votesFor = Number(proposal.votesFor);
    const votesAgainst = Number(proposal.votesAgainst);
    const votesAbstain = Number(proposal.votesAbstain);
    const totalVotes = votesFor + votesAgainst + votesAbstain;
    
    // 모든 멤버가 투표했는지 확인 (더 정확한 계산)
    const memberCountNum = Number(memberCount);
    const allMembersVoted = totalVotes >= memberCountNum && memberCountNum > 0;
    
    console.log(`Proposal ${proposalId} vote status:`, {
      votesFor,
      votesAgainst,
      votesAbstain,
      totalVotes,
      memberCount: memberCountNum,
      canFinalize: allMembersVoted,
      proposalStatus: proposal.status
    });
    
    return {
      votesFor,
      votesAgainst,
      votesAbstain,
      totalVotes,
      memberCount: memberCountNum,
      canFinalize: allMembersVoted
    };
  }

  // --- *** 1. NEW: 히스토리 페이지를 위한 이벤트 로그 조회 함수 *** ---
  async getDaoHistory(daoAddress: string): Promise<any[]> {
    if (!ethers.isAddress(daoAddress)) {
      throw new Error(`Invalid DAO address: ${daoAddress}`);
    }

    const daoContract = new ethers.Contract(daoAddress, DaoABI.abi, this.provider);
    const proposalContractAddress = await daoContract.proposalContract();
    const proposalContract = new ethers.Contract(proposalContractAddress, ProposalABI.abi, this.provider);

    // --- 1-A. 제안 생성 이벤트(ProposalCreated) 조회 ---
    const proposalFilter = proposalContract.filters.ProposalCreated();
    const proposalEvents = await proposalContract.queryFilter(proposalFilter);

    const proposalHistory = await Promise.all(proposalEvents.map(async (event) => {
      const block = await event.getBlock();
      const proposal = await proposalContract.getProposal(event.args.id);
      return {
        type: 'proposal',
        timestamp: block.timestamp,
        proposalId: Number(event.args.id),
        title: proposal.title,
        proposer: event.args.proposer,
        sanctionType: proposal.sanctionType,
        amount: proposal.amount,
        recipient: proposal.recipient,
        ruleToChange: proposal.title,
        newValue: proposal.afterValue
      };
    }));
    
    // --- 1-B. 멤버 가입 이벤트(RoleGranted) 조회 ---
    const memberRole = await proposalContract.MEMBER_ROLE();
    const joinFilter = proposalContract.filters.RoleGranted(memberRole);
    const joinEvents = await proposalContract.queryFilter(joinFilter);
    
    const joinHistory = await Promise.all(joinEvents.map(async (event) => {
      const block = await event.getBlock();
      return {
        type: 'member_event',
        action: 'join',
        timestamp: block.timestamp,
        actor: event.args.account,
      };
    }));

    // --- 1-C. 멤버 탈퇴 이벤트(RoleRevoked) 조회 (leaveDAO 기능이 있을 경우) ---
    const leaveFilter = proposalContract.filters.RoleRevoked(memberRole);
    const leaveEvents = await proposalContract.queryFilter(leaveFilter);

    const leaveHistory = await Promise.all(leaveEvents.map(async (event) => {
      const block = await event.getBlock();
      return {
        type: 'member_event',
        action: 'leave',
        timestamp: block.timestamp,
        actor: event.args.account,
      };
    }));

    // --- 1-D. 모든 이벤트를 합치고 시간 역순(최신순)으로 정렬 ---
    const allHistory = [...proposalHistory, ...joinHistory, ...leaveHistory];
    allHistory.sort((a, b) => b.timestamp - a.timestamp);
    
    return allHistory;
  }
}

export const contractService = new ContractService();
export default contractService;