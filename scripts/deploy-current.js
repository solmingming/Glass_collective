const hre = require("hardhat");

async function main() {
  console.log("🚀 Sepolia 테스트넷에 현재 컨트랙트들 배포 시작...");

  // 계정 가져오기
  const [deployer] = await ethers.getSigners();
  console.log("배포 계정:", deployer.address);
  console.log("계정 잔액:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // 1. Vault 배포
  console.log("\n💰 Vault 배포 중...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(deployer.address, deployer.address); // admin, executor
  await vault.waitForDeployment();
  console.log("Vault 배포됨:", vault.target);

  // 2. Proposal 배포
  console.log("\n📋 Proposal 배포 중...");
  const Proposal = await ethers.getContractFactory("Proposal");
  const proposal = await Proposal.deploy(deployer.address);
  await proposal.waitForDeployment();
  console.log("Proposal 배포됨:", proposal.target);

  // 3. Execution 배포
  console.log("\n⚡ Execution 배포 중...");
  const Execution = await ethers.getContractFactory("Execution");
  const execution = await Execution.deploy(proposal.target, vault.target);
  await execution.waitForDeployment();
  console.log("Execution 배포됨:", execution.target);

  // 4. DAO 배포 (메인 컨트랙트)
  console.log("\n🏛️ DAO 배포 중...");
  const DAO = await ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(
    proposal.target,
    vault.target,
    execution.target
  );
  await dao.waitForDeployment();
  console.log("DAO 배포됨:", dao.target);

                // 초기 설정
              console.log("\n⚙️ 초기 설정 중...");
              
              try {
                // 역할 부여
                await vault.grantRole(await vault.TREASURER_ROLE(), execution.target);
                console.log("✅ Vault TREASURER_ROLE 설정 완료");
                
                await proposal.grantRole(await proposal.MEMBER_ROLE(), deployer.address);
                console.log("✅ Proposal MEMBER_ROLE 설정 완료");
                
                await proposal.grantRole(await proposal.ADMIN_ROLE(), deployer.address);
                console.log("✅ Proposal ADMIN_ROLE 설정 완료");
                
                // DAO 컨트랙트를 Proposal 컨트랙트에 등록
                await proposal.setDaoAddress(dao.target);
                console.log("✅ Proposal DAO_ADDRESS 설정 완료");
                
              } catch (error) {
                console.log("⚠️ 초기 설정 중 일부 오류 발생:", error.message);
              }

  console.log("\n✅ 모든 컨트랙트 배포 완료!");
  console.log("\n📋 배포된 컨트랙트 주소:");
  console.log("Vault:", vault.target);
  console.log("Proposal:", proposal.target);
  console.log("Execution:", execution.target);
  console.log("DAO:", dao.target);
  
  console.log("\n🔗 컨트랙트 연결 정보:");
  console.log("DAO -> Proposal:", proposal.target);
  console.log("DAO -> Execution:", execution.target);
  console.log("DAO -> Vault:", vault.target);
  console.log("Execution -> Proposal:", proposal.target);
  console.log("Execution -> Vault:", vault.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 배포 실패:", error);
    process.exit(1);
  }); 