/*
Bytecode: 스마트 컨트랙트가 컴파일된 기계어 코드 -> 이더리움 가상머신(EVM)이 이를 실행할 수 있음
ex) 0x608060405234801561001057600080fd5b506101b3806100206000396000f3fe ...

ABI : 스마트 컨트랙트의 함수목록과 데이터 형식 정의 (json 형식)
-> 프론트엔드나 다른 컨트랙트가 이 컨트랙트와 통신할 수 있게해줌

- hardhat은 abi와 바이트코드를 내부적으로 읽음

deploy.js의 기능(목적)
1. 스마트컨트랙트(sol)를 가져온다. (컴파일된 ABI와 바이트코드 기반)
2. 배포할 때 필요한 constructor 인자 준비 (주로 constructor 생성자에 필요한 매개변수 admin)
3. 스마트 컨트랙트를 블록체인에 배포
/// 배포 = 블록체인 내 코드를 실제로 올리는 행위
4. 배포된 컨트랙트 주소를 콘솔에 출력하거나 저장
5. *(선택) 배포 후 초기화 작업 또는 다른 컨트랙트와 연결 작업 수행

  [내 Solidity 코드]
            ↓
  컴파일 ⇒ bytecode + ABI
            ↓
  Vault.deploy("admin 주소")  ← constructor 인자
            ↓
  이더리움 네트워크에 실제로 배포 (블록 생성됨)
            ↓
  vault.address → 0x123...789  ← 콘솔에 출력

+ deploy : 컴파일한 solidity 코드를 블록체인 네트워크에 '올려놓는'과정
          트랜잭션에 바이트코드를 담아서 네트워크에 전송
          네트워크가 이 트랜잭션을 블록에 포함시키면 새로운 컨트렉트 주소가 생기고
          그 주소에 번역된 코드가 저장 -> 이후에는 그 주소를 통해 함수 호출 가능
+ deployer : 컨트랙트를 네트워크에 배포하는 주체
*/

const hre = require("hardhat");

async function main(){
  // hre.ethers.getSigners() : 이더리움 노드에 미리 생성or언락된 여러 계정 배열 반환
  // 그 중 첫번째 요소만 꺼내서 deployer 변수에 할당, 즉 Signers[0]
  // 즉, Hardhat이 제공하는 테스트계정 중 첫번째를 deployer로 사용용
  // Signer : 특정 이더리움 계정(지갑)의 역할을 하는 객체..
  // Signer을 통해 트랜잭션에 서명하고, 네트워크에 전송할 수 있음

  // hardhat/ganache같은 개발형 네트워크는 모두 잠금 해제된 상태로 계정이 제공됨
  // 실제 메인넷에서는 보안을 위해 각 계정은 개인키가 디스크에 암호화되어 저장됨
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. GovernanceToken 배포 (새로 추가)
  const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy(
    "Glass Collective Token",
    "GLASS",
    deployer.address
  );
  await governanceToken.waitForDeployment();
  const governanceTokenAddress = await governanceToken.getAddress();
  console.log("GovernanceToken deployed to:", governanceTokenAddress);

  // 2. Vault 배포
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(deployer.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault deployed to:", vaultAddress);

  // 3. EnhancedProposal 배포 (새로 추가)
  const EnhancedProposal = await hre.ethers.getContractFactory("EnhancedProposal");
  const enhancedProposal = await EnhancedProposal.deploy(
    governanceTokenAddress,
    deployer.address
  );
  await enhancedProposal.waitForDeployment();
  const enhancedProposalAddress = await enhancedProposal.getAddress();
  console.log("EnhancedProposal deployed to:", enhancedProposalAddress);

  // 4. Voting 배포 (거버넌스 토큰 연동)
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(governanceTokenAddress, deployer.address);
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log("Voting deployed to:", votingAddress);

  // 5. AutoExecution 배포 (새로 추가)
  const AutoExecution = await hre.ethers.getContractFactory("AutoExecution");
  const autoExecution = await AutoExecution.deploy(
    enhancedProposalAddress,
    vaultAddress,
    governanceTokenAddress,
    deployer.address
  );
  await autoExecution.waitForDeployment();
  const autoExecutionAddress = await autoExecution.getAddress();
  console.log("AutoExecution deployed to:", autoExecutionAddress);

  // 6. 기존 Proposal 배포 (하위 호환성)
  const Proposal = await hre.ethers.getContractFactory("Proposal");
  const proposal = await Proposal.deploy(deployer.address);
  await proposal.waitForDeployment();
  const proposalAddress = await proposal.getAddress();
  console.log("Proposal deployed to:", proposalAddress);

  // 7. 기존 Execution 배포 (하위 호환성)
  const Execution = await hre.ethers.getContractFactory("Execution");
  const execution = await Execution.deploy(
    proposalAddress,
    votingAddress,
    vaultAddress
  );
  await execution.waitForDeployment();
  const executionAddress = await execution.getAddress();
  console.log("Execution deployed to:", executionAddress);

  // 8. CorruptionMonitor 배포
  const CorruptionMonitor = await hre.ethers.getContractFactory("CorruptionMonitor");
  const corruptionMonitor = await CorruptionMonitor.deploy();
  await corruptionMonitor.waitForDeployment();
  const corruptionAddress = await corruptionMonitor.getAddress();
  console.log("CorruptionMonitor deployed to:", corruptionAddress);

  // 9. 초기 설정
  console.log("\n=== 초기 설정 ===");
  
  // 거버넌스 토큰 초기 민팅
  const initialMint = hre.ethers.parseEther("1000000"); // 100만 토큰
  await governanceToken.mint(deployer.address, initialMint);
  console.log("Initial tokens minted to deployer:", hre.ethers.formatEther(initialMint));

  // 멤버 역할 부여
  await enhancedProposal.grantRole(await enhancedProposal.MEMBER_ROLE(), deployer.address);
  await voting.grantRole(await voting.MEMBER_ROLE(), deployer.address);
  console.log("Member roles granted to deployer");

  // 긴급 역할 부여
  await enhancedProposal.grantRole(await enhancedProposal.EMERGENCY_ROLE(), deployer.address);
  await autoExecution.grantRole(await autoExecution.EMERGENCY_ROLE(), deployer.address);
  console.log("Emergency roles granted to deployer");

  console.log("\n=== 배포 완료 ===");
  console.log("GovernanceToken:", governanceTokenAddress);
  console.log("EnhancedProposal:", enhancedProposalAddress);
  console.log("AutoExecution:", autoExecutionAddress);
  console.log("Vault:", vaultAddress);
  console.log("Voting:", votingAddress);
  console.log("CorruptionMonitor:", corruptionAddress);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });