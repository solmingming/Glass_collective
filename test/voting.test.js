const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let voting, owner, member, user;

  beforeEach(async function () {
    [owner, member, user] = await ethers.getSigners();
    
    // GovernanceToken 배포
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy(
      "Glass Collective Token",
      "GLASS",
      owner.address
    );
    
    // Voting 배포 (거버넌스 토큰 주소 포함)
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy(governanceToken.target, owner.address);
    
    // 사용자에게 토큰 민팅
    await governanceToken.mint(member.address, ethers.parseEther("1000"));
    
    await voting.connect(owner).grantRole(await voting.MEMBER_ROLE(), member.address);
    await voting.connect(owner).grantRole(await voting.DEFAULT_ADMIN_ROLE(), owner.address);
    await voting.connect(owner).startVoting(0);
  });

  it("멤버가 투표할 수 있고, 중복 투표는 막아야 한다", async function () {
    await voting.connect(member).vote(0, true);
    expect(await voting.hasVoted(0, member.address)).to.equal(true);
    await expect(
      voting.connect(member).vote(0, false)
    ).to.be.revertedWith("Voting: already voted");
  });

  it("투표 기간이 끝나면 투표가 불가능해야 한다", async function () {
    await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
    await ethers.provider.send("evm_mine");
    await expect(
      voting.connect(member).vote(0, true)
    ).to.be.revertedWith("Voting: period ended");
  });

  it("투표 결과를 올바르게 반환해야 한다", async function () {
    await voting.connect(member).vote(0, true);
    const [forVotes, againstVotes] = await voting.getVotes(0);
    // 투표 가중치를 고려해야 함 (1000 토큰 = 1000 가중치)
    expect(forVotes).to.equal(ethers.parseEther("1000"));
    expect(againstVotes).to.equal(0);
  });
});