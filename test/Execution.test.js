const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Execution", function () {
  let proposal, voting, vault, execution, owner, member, recipient;

  beforeEach(async function () {
    [owner, member, recipient] = await ethers.getSigners();

    const Proposal = await ethers.getContractFactory("Proposal"); // 팩토리 객체를 만듬 = proposal 컨트랙트를 배포할 준비를 한다 라는 뜻
    proposal = await Proposal.deploy(owner.address); // 위 팩토리 객체를 이용해 실제 proposal 컨트랙트를 블록체인에 배포

    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy(owner.address);

    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(owner.address);

    const Execution = await ethers.getContractFactory("Execution");
    execution = await Execution.deploy(proposal.target, voting.target, vault.target);

    // 반드시 owner(admin) 계정으로 connect해서 grantRole 호출
    await proposal.connect(owner).grantRole(await proposal.DEFAULT_ADMIN_ROLE(), execution.target);
    await proposal.connect(owner).grantRole(await proposal.MEMBER_ROLE(), member.address);
    await voting.connect(owner).grantRole(await voting.MEMBER_ROLE(), member.address);
    await voting.connect(owner).grantRole(await voting.DEFAULT_ADMIN_ROLE(), owner.address);

    await proposal.connect(member).createProposal(
      "test", "desc", ethers.parseEther("1"), recipient.address
    );

    await voting.connect(owner).startVoting(0);
    await voting.connect(member).vote(0, true);

    await owner.sendTransaction({ to: vault.target, value: ethers.parseEther("1") });
    await vault.connect(owner).grantRole(await vault.TREASURER_ROLE(), execution.target);
  });

  it("isExecutable이 투표 결과에 따라 올바르게 동작해야 한다", async function () {
    expect(await execution.isExecutable(0)).to.equal(true);
  });

  it("executeProposal이 성공적으로 실행되어야 한다", async function () {
    await expect(execution.executeProposal(0))
      .to.emit(execution, "ProposalExecuted")
      .withArgs(0);
    // recipient가 이더를 받았는지 확인하려면 잔액 체크 추가 가능
  });
});