const hre = require("hardhat");

async function main() {
  console.log("🚀 Sepolia 테스트넷에 배포 시작...");

  // 계정 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("배포 계정:", deployer.address);
  console.log("계정 잔액:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // 1. GovernanceToken 배포
  console.log("\n📝 GovernanceToken 배포 중...");
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy(
    "Glass Collective Token",
    "GLASS",
    deployer.address
  );
  await governanceToken.waitForDeployment();
  console.log("GovernanceToken 배포됨:", governanceToken.target);

  // 2. EnhancedProposal 배포
  console.log("\n📋 EnhancedProposal 배포 중...");
  const EnhancedProposal = await ethers.getContractFactory("EnhancedProposal");
  const enhancedProposal = await EnhancedProposal.deploy(governanceToken.target);
  await enhancedProposal.waitForDeployment();
  console.log("EnhancedProposal 배포됨:", enhancedProposal.target);

  // 3. Vault 배포
  console.log("\n💰 Vault 배포 중...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(deployer.address);
  await vault.waitForDeployment();
  console.log("Vault 배포됨:", vault.target);

  // 4. Voting 배포
  console.log("\n🗳️ Voting 배포 중...");
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(governanceToken.target, deployer.address);
  await voting.waitForDeployment();
  console.log("Voting 배포됨:", voting.target);

  // 5. Execution 배포
  console.log("\n⚡ Execution 배포 중...");
  const Execution = await ethers.getContractFactory("Execution");
  const execution = await Execution.deploy(enhancedProposal.target, voting.target, vault.target);
  await execution.waitForDeployment();
  console.log("Execution 배포됨:", execution.target);

  // 6. AutoExecution 배포
  console.log("\n🤖 AutoExecution 배포 중...");
  const AutoExecution = await ethers.getContractFactory("AutoExecution");
  const autoExecution = await AutoExecution.deploy(enhancedProposal.target, vault.target, governanceToken.target);
  await autoExecution.waitForDeployment();
  console.log("AutoExecution 배포됨:", autoExecution.target);

  // 7. CorruptionMonitor 배포
  console.log("\n🔍 CorruptionMonitor 배포 중...");
  const CorruptionMonitor = await ethers.getContractFactory("CorruptionMonitor");
  const corruptionMonitor = await CorruptionMonitor.deploy();
  await corruptionMonitor.waitForDeployment();
  console.log("CorruptionMonitor 배포됨:", corruptionMonitor.target);

  // 초기 설정
  console.log("\n⚙️ 초기 설정 중...");
  
  // 역할 부여
  await governanceToken.grantRole(await governanceToken.MINTER_ROLE(), deployer.address);
  await enhancedProposal.grantRole(await enhancedProposal.MEMBER_ROLE(), deployer.address);
  await enhancedProposal.grantRole(await enhancedProposal.EMERGENCY_ROLE(), deployer.address);
  await voting.grantRole(await voting.MEMBER_ROLE(), deployer.address);
  await vault.grantRole(await vault.TREASURER_ROLE(), execution.target);

  // 초기 토큰 민팅
  await governanceToken.mint(deployer.address, ethers.parseEther("10000"));
  console.log("초기 토큰 민팅 완료");

  console.log("\n✅ 모든 컨트랙트 배포 완료!");
  console.log("\n📋 배포된 컨트랙트 주소:");
  console.log("GovernanceToken:", governanceToken.target);
  console.log("EnhancedProposal:", enhancedProposal.target);
  console.log("Vault:", vault.target);
  console.log("Voting:", voting.target);
  console.log("Execution:", execution.target);
  console.log("AutoExecution:", autoExecution.target);
  console.log("CorruptionMonitor:", corruptionMonitor.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 배포 실패:", error);
    process.exit(1);
  }); 