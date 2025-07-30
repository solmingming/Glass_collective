const hre = require("hardhat");

async function main() {
  console.log("🔍 DAO 컨트랙트 테스트 시작...");
  
  const daoAddress = '0x4cF54C3739D072A3c8e7835F21446Bc419a94807';
  
  try {
    // DAO 컨트랙트 인스턴스 생성
    const daoContract = await hre.ethers.getContractAt("DAO", daoAddress);
    console.log("✅ DAO 컨트랙트 인스턴스 생성 완료");
    
    // entryFee 함수 호출
    const entryFee = await daoContract.entryFee();
    console.log("✅ entryFee 조회 성공:", entryFee.toString());
    console.log("💰 가입비:", hre.ethers.formatEther(entryFee), "ETH");
    
    // 다른 함수들도 테스트
    const passCriteria = await daoContract.passCriteria();
    console.log("🎯 통과 기준:", passCriteria.toString(), "%");
    
    const votingDuration = await daoContract.votingDuration();
    console.log("⏰ 투표 기간:", votingDuration.toString(), "초");
    
  } catch (error) {
    console.error("❌ 에러 발생:", error);
    console.error("❌ 에러 상세:", {
      message: error.message,
      code: error.code,
      data: error.data
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 