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

/*
deploy.js의 기능 (수정 후)
1. DAOFactory 스마트 컨트랙트를 가져온다.
2. DAOFactory 컨트랙트를 블록체인에 배포한다.
3. 배포된 DAOFactory 컨트랙트의 주소를 콘솔에 출력한다.
-> 이 주소는 프론트엔드에서 사용해야 하므로 매우 중요합니다.
*/

/*
deploy.js의 기능 (수정 후)
1. DAOFactory 스마트 컨트랙트를 가져온다.
2. DAOFactory 컨트랙트를 블록체인에 배포한다.
3. 배포된 DAOFactory 컨트랙트의 주소를 콘솔에 출력한다.
   -> 이 주소는 프론트엔드 .env 파일에 사용해야 하므로 매우 중요합니다.
*/

// deploy.js

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // *** 1. MODIFIED: 오직 DAOFactory 컨트랙트 하나만 배포합니다. ***
  const DAOFactory = await hre.ethers.getContractFactory("DAOFactory");
  const daoFactory = await DAOFactory.deploy();
  await daoFactory.waitForDeployment();

  const daoFactoryAddress = await daoFactory.getAddress();
  
  console.log("\n==================================================================");
  console.log("✅ DAOFactory Deployed Successfully!");
  console.log("DAOFactory contract address:", daoFactoryAddress);
  console.log("==================================================================");
  console.log("\n-> 이 주소를 복사하여 프론트엔드 .env 파일의 REACT_APP_DAO_FACTORY_ADDRESS 값으로 붙여넣으세요.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });