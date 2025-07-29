const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnhancedProposal", function () {
  let enhancedProposal, governanceToken, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // GovernanceToken 배포
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy(
      "Glass Collective Token",
      "GLASS",
      owner.address
    );
    
    // EnhancedProposal 배포
    const EnhancedProposal = await ethers.getContractFactory("EnhancedProposal");
    enhancedProposal = await EnhancedProposal.deploy(
      governanceToken.target,
      owner.address
    );
    
    // 사용자에게 토큰 민팅 및 역할 부여
    await governanceToken.mint(user1.address, ethers.parseEther("1000"));
    await governanceToken.mint(user2.address, ethers.parseEther("500"));
    await enhancedProposal.grantRole(await enhancedProposal.MEMBER_ROLE(), user1.address);
    await enhancedProposal.grantRole(await enhancedProposal.MEMBER_ROLE(), user2.address);
  });

  describe("기본 제안 생성", function () {
    it("멤버가 일반 제안을 생성할 수 있어야 한다", async function () {
      const tx = await enhancedProposal.connect(user1).createProposal(
        "테스트 제안",
        "테스트 설명",
        ethers.parseEther("1"),
        user2.address,
        0 // GENERAL 카테고리
      );
      
      await expect(tx).to.emit(enhancedProposal, "ProposalCreated");
      
      const proposal = await enhancedProposal.getProposal(0);
      expect(proposal.title).to.equal("테스트 제안");
      expect(proposal.category).to.equal(0); // GENERAL
    });

    it("투표 파워가 부족하면 제안을 생성할 수 없어야 한다", async function () {
      // user2는 500 토큰을 가지고 있지만, 더 높은 요구사항을 가진 카테고리로 테스트
      await expect(
        enhancedProposal.connect(user2).createProposal(
          "테스트 제안",
          "테스트 설명",
          ethers.parseEther("1"),
          user1.address,
          3 // TECHNICAL 카테고리 (최소 2000 토큰 필요)
        )
      ).to.be.revertedWith("EnhancedProposal: insufficient voting power");
    });
  });

  describe("긴급 제안", function () {
    it("긴급 권한을 가진 사용자가 긴급 제안을 생성할 수 있어야 한다", async function () {
      await enhancedProposal.grantRole(await enhancedProposal.EMERGENCY_ROLE(), user1.address);
      
      const tx = await enhancedProposal.connect(user1).createEmergencyProposal(
        "긴급 제안",
        "긴급 상황 대응",
        ethers.parseEther("5"),
        user2.address,
        ethers.parseEther("1000")
      );
      
      await expect(tx).to.emit(enhancedProposal, "EmergencyProposalCreated");
      
      const proposal = await enhancedProposal.getProposal(0);
      expect(proposal.isEmergency).to.be.true;
      expect(proposal.category).to.equal(4); // EMERGENCY
    });

    it("긴급 권한이 없으면 긴급 제안을 생성할 수 없어야 한다", async function () {
      await expect(
        enhancedProposal.connect(user2).createEmergencyProposal(
          "긴급 제안",
          "긴급 상황 대응",
          ethers.parseEther("5"),
          user1.address,
          ethers.parseEther("1000")
        )
      ).to.be.reverted;
    });
  });

  describe("제안 수정", function () {
    beforeEach(async function () {
      await enhancedProposal.connect(user1).createProposal(
        "원본 제안",
        "원본 설명",
        ethers.parseEther("1"),
        user2.address,
        0
      );
    });

    it("제안자가 제안을 수정할 수 있어야 한다", async function () {
      const tx = await enhancedProposal.connect(user1).modifyProposal(
        0,
        "수정된 제안",
        "수정된 설명",
        ethers.parseEther("2"),
        user1.address
      );
      
      await expect(tx).to.emit(enhancedProposal, "ProposalModified");
      
      const proposal = await enhancedProposal.getProposal(0);
      expect(proposal.title).to.equal("수정된 제안");
      expect(proposal.version).to.equal(2);
    });

    it("제안자가 아니면 제안을 수정할 수 없어야 한다", async function () {
      await expect(
        enhancedProposal.connect(user2).modifyProposal(
          0,
          "수정된 제안",
          "수정된 설명",
          ethers.parseEther("2"),
          user1.address
        )
      ).to.be.revertedWith("EnhancedProposal: not proposer");
    });
  });

  describe("제안 취소", function () {
    beforeEach(async function () {
      await enhancedProposal.connect(user1).createProposal(
        "취소할 제안",
        "취소할 설명",
        ethers.parseEther("1"),
        user2.address,
        0
      );
    });

    it("제안자가 제안을 취소할 수 있어야 한다", async function () {
      const tx = await enhancedProposal.connect(user1).cancelProposal(0);
      await expect(tx).to.emit(enhancedProposal, "ProposalCancelled");
      
      const proposal = await enhancedProposal.getProposal(0);
      expect(proposal.status).to.equal(5); // CANCELLED
    });

    it("제안자가 아니면 제안을 취소할 수 없어야 한다", async function () {
      await expect(
        enhancedProposal.connect(user2).cancelProposal(0)
      ).to.be.revertedWith("EnhancedProposal: not proposer");
    });
  });

  describe("카테고리별 제안 조회", function () {
    beforeEach(async function () {
      // 여러 카테고리의 제안 생성
      await enhancedProposal.connect(user1).createProposal(
        "일반 제안",
        "일반 설명",
        ethers.parseEther("1"),
        user2.address,
        0 // GENERAL
      );
      
      await enhancedProposal.connect(user1).createProposal(
        "재무 제안",
        "재무 설명",
        ethers.parseEther("5"),
        user2.address,
        1 // FINANCIAL
      );
    });

    it("카테고리별 제안 목록을 조회할 수 있어야 한다", async function () {
      const generalProposals = await enhancedProposal.getProposalsByCategory(0);
      const financialProposals = await enhancedProposal.getProposalsByCategory(1);
      
      expect(generalProposals.length).to.equal(1);
      expect(financialProposals.length).to.equal(1);
    });
  });

  describe("카테고리 설정", function () {
    it("관리자가 카테고리 설정을 업데이트할 수 있어야 한다", async function () {
      const tx = await enhancedProposal.updateCategoryConfig(
        0, // GENERAL
        5 * 24 * 60 * 60, // 5일
        60, // 60% 정족수
        ethers.parseEther("200") // 최소 200 토큰
      );
      
      await expect(tx).to.emit(enhancedProposal, "CategoryConfigUpdated");
      
      const config = await enhancedProposal.getCategoryConfig(0);
      expect(config.quorumPercent).to.equal(60);
    });
  });


}); 