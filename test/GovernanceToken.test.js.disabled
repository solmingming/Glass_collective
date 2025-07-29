const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceToken", function () {
  let governanceToken, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy(
      "Glass Collective Token",
      "GLASS",
      owner.address
    );
  });

  describe("기본 기능", function () {
    it("토큰 이름과 심볼이 올바르게 설정되어야 한다", async function () {
      expect(await governanceToken.name()).to.equal("Glass Collective Token");
      expect(await governanceToken.symbol()).to.equal("GLASS");
    });

    it("관리자가 토큰을 민팅할 수 있어야 한다", async function () {
      const mintAmount = ethers.parseEther("1000");
      await governanceToken.mint(user1.address, mintAmount);
      expect(await governanceToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("일반 사용자는 토큰을 민팅할 수 없어야 한다", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        governanceToken.connect(user1).mint(user2.address, mintAmount)
      ).to.be.reverted;
    });
  });

  describe("스테이킹 기능", function () {
    beforeEach(async function () {
      // 사용자에게 토큰 민팅
      await governanceToken.mint(user1.address, ethers.parseEther("1000"));
    });

    it("최소 스테이킹 금액 이상으로 스테이킹할 수 있어야 한다", async function () {
      const stakeAmount = ethers.parseEther("100");
      await governanceToken.connect(user1).stake(stakeAmount);
      expect(await governanceToken.stakedBalanceOf(user1.address)).to.equal(stakeAmount);
    });

    it("최소 스테이킹 금액 미만으로는 스테이킹할 수 없어야 한다", async function () {
      const stakeAmount = ethers.parseEther("50");
      await expect(
        governanceToken.connect(user1).stake(stakeAmount)
      ).to.be.revertedWith("GovernanceToken: insufficient stake amount");
    });

    it("스테이킹된 토큰을 언스테이킹할 수 있어야 한다", async function () {
      const stakeAmount = ethers.parseEther("200");
      await governanceToken.connect(user1).stake(stakeAmount);
      
      const unstakeAmount = ethers.parseEther("100");
      await governanceToken.connect(user1).unstake(unstakeAmount);
      
      expect(await governanceToken.stakedBalanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });
  });

  describe("투표 가중치", function () {
    beforeEach(async function () {
      await governanceToken.mint(user1.address, ethers.parseEther("1000"));
    });

    it("보유 토큰만으로 투표 가중치를 계산할 수 있어야 한다", async function () {
      const votingPower = await governanceToken.getVotingPower(user1.address);
      expect(votingPower).to.equal(ethers.parseEther("1000"));
    });

    it("스테이킹된 토큰은 1.5배 가중치를 가져야 한다", async function () {
      await governanceToken.connect(user1).stake(ethers.parseEther("200"));
      
      const votingPower = await governanceToken.getVotingPower(user1.address);
      // 800 (보유) + 200 * 1.5 (스테이킹) = 800 + 300 = 1100
      expect(votingPower).to.equal(ethers.parseEther("1100"));
    });
  });

  describe("멤버 등급", function () {
    beforeEach(async function () {
      await governanceToken.mint(user1.address, ethers.parseEther("1000"));
    });

    it("토큰 보유량에 따라 올바른 등급을 반환해야 한다", async function () {
      // Bronze (100 토큰)
      await governanceToken.mint(user2.address, ethers.parseEther("100"));
      expect(await governanceToken.getMemberTier(user2.address)).to.equal(1);
      
      // Gold (1000 토큰)
      expect(await governanceToken.getMemberTier(user1.address)).to.equal(3);
    });

    it("토큰이 부족하면 등급이 0이어야 한다", async function () {
      expect(await governanceToken.getMemberTier(user2.address)).to.equal(0);
    });
  });


}); 