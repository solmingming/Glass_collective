const { expect } = require("chai"); // Chai의 expect : 테스트 결과가 예상에 맞는지 쉽게 비교할 수 있는 함수
const { ethers } = require("hardhat"); // Hardhat에서 제공하는 이더리움 라이브러리... 컨트렉트 배포, 계정관리 용이

describe("Proposal", function () {
  let proposal, owner, member, recipient; // 컨트랙트 인스턴스,관리자, 멤버, 수신자 변수 선언

  // 공통적으로 반복되는 준비 작업 : 컨트랙트 새로 배포, 계정세팅, 권한 부여 등등
  beforeEach(async function () { // 각 테스트 실행전에 실행되는 초기화 함수
    [owner, member, recipient] = await ethers.getSigners(); // hardhat이 제공하는 테스트 계정 3개 불러옴
    const Proposal = await ethers.getContractFactory("Proposal"); // Proposal 컨트랙트 팩토리 생성
    proposal = await Proposal.deploy(owner.address); // 컨트랙트 배포
    await proposal.grantRole(await proposal.MEMBER_ROLE(), member.address); // 멤버 권한 부여
  });

  // it : 실제 테스트하고 싶은 기능, 동작을 작성하는 부분
  // 각각의 it은 하나의 독립적인 테스트트
  it("멤버가 제안을 생성할 수 있어야 한다", async function () { // 멤버가 제안을 생성할 수 있는가를 검증하는 테스트 케이스
    await expect(
      proposal.connect(member).createProposal( // member 계정 지갑으로 proposal 컨트랙트에 접근 -> 새 proposal 생성성
        "제목", "설명", ethers.parseEther("1"), recipient.address
      )
    ).to.emit(proposal, "ProposalCreated"); // 위에 트랜잭션을 실행해쓸 때 proposal 컨트랙트에서 "proposalcreated" 이벤트가 발생해야함, 발생X 시 테스트 실패

    const data = await proposal.getProposal(0); // 0번 제안의 정보를 불러옴
    expect(data.title).to.equal("제목"); // 제목이 "제목"인지 확인 (이하 같음음)
    expect(data.amount).to.equal(ethers.parseEther("1"));
    expect(data.recipient).to.equal(recipient.address);
  });

  it("관리자만 제안 상태를 변경할 수 있다", async function () { // 관리자만 제안 상태를 변경할 수 있는가를 검증하는 테스트 케이스
    await proposal.connect(member).createProposal( // 멤버가 제안 생성
      "제목", "설명", ethers.parseEther("1"), recipient.address
    );
    await expect( // 관리자가 제안 상태 변경
      proposal.connect(owner).setProposalStatus(0, 2) // Status.Rejected
    ).to.emit(proposal, "ProposalStatusChanged");
  });
});