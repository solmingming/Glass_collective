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

async function main() {
  console.log("Deploying contracts with hre.ethers...");

  // 1. 배포자(signer) 정보를 가져옵니다.
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("----------------------------------------------------");

  // 2. 각 컨트랙트 팩토리를 가져옵니다.
  const VaultFactory = await hre.ethers.getContractFactory("Vault");
  const ProposalFactory = await hre.ethers.getContractFactory("Proposal");
  const ExecutionFactory = await hre.ethers.getContractFactory("Execution");
  const DAOFactory = await hre.ethers.getContractFactory("DAO");

  // 3. 모든 컨트랙트를 순서대로 배포하고, 배포가 완전히 완료될 때까지 기다립니다.
  console.log("Deploying Vault...");
  const vault = await VaultFactory.deploy(deployer.address, hre.ethers.ZeroAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ Vault deployed to:", vaultAddress);

  console.log("\nDeploying Proposal...");
  const proposal = await ProposalFactory.deploy(deployer.address);
  await proposal.waitForDeployment();
  const proposalAddress = await proposal.getAddress();
  console.log("✅ Proposal deployed to:", proposalAddress);

  console.log("\nDeploying Execution...");
  const execution = await ExecutionFactory.deploy(proposalAddress, vaultAddress);
  await execution.waitForDeployment();
  const executionAddress = await execution.getAddress();
  console.log("✅ Execution deployed to:", executionAddress);

  // [핵심] DAO 컨트랙트를 배포할 때, 위에서 얻은 주소들이 올바른지 확인합니다.
  console.log("\nDeploying DAO with addresses:");
  console.log("  - Proposal:", proposalAddress);
  console.log("  - Vault:", vaultAddress);
  console.log("  - Execution:", executionAddress);
  const dao = await DAOFactory.deploy(proposalAddress, vaultAddress, executionAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("✅ DAO deployed to:", daoAddress);
  console.log("----------------------------------------------------");

  // 4. 배포 후, 컨트랙트 간의 주소와 역할을 설정합니다.
  console.log("Configuring roles and addresses...\n");

  const tx1 = await proposal.setDaoAddress(daoAddress);
  await tx1.wait();
  console.log(`- Proposal.setDaoAddress(${daoAddress}) [OK]`);

  const tx2 = await execution.setDaoAddress(daoAddress);
  await tx2.wait();
  console.log(`- Execution.setDaoAddress(${daoAddress}) [OK]`);

  const EXECUTOR_ROLE = await vault.EXECUTOR_ROLE();
  const tx3 = await vault.grantRole(EXECUTOR_ROLE, executionAddress);
  await tx3.wait();
  console.log(`- Vault.grantRole(EXECUTOR_ROLE, ${executionAddress}) [OK]`);

  const DAO_ROLE = await proposal.DAO_ROLE();
  const tx4 = await proposal.grantRole(DAO_ROLE, daoAddress);
  await tx4.wait();
  console.log(`- Proposal.grantRole(DAO_ROLE, ${daoAddress}) [OK]`);

  const tx5 = await proposal.grantRole(DAO_ROLE, executionAddress);
  await tx5.wait();
  console.log(`- Proposal.grantRole(DAO_ROLE, ${executionAddress}) [OK]`);

  console.log("\n✅ Deployment and configuration complete!");
  console.log("----------------------------------------------------");
  console.log("Final DAO Address to use in frontend:");
  console.log(daoAddress);
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});