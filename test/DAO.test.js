const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO Full Integration Test", function () {
    let owner, user1, user2, user3;
    let proposal, vault, execution, dao;

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();

        const ProposalFactory = await ethers.getContractFactory("Proposal");
        const VaultFactory = await ethers.getContractFactory("Vault");
        const ExecutionFactory = await ethers.getContractFactory("Execution");
        const DAOFactory = await ethers.getContractFactory("DAO");

        vault = await VaultFactory.deploy(owner.address, ethers.ZeroAddress);
        proposal = await ProposalFactory.deploy(owner.address);
        execution = await ExecutionFactory.deploy(await proposal.getAddress(), await vault.getAddress());
        dao = await DAOFactory.deploy(await proposal.getAddress(), await vault.getAddress(), await execution.getAddress());

        // 컨트랙트 간 주소 및 역할 설정
        await proposal.connect(owner).setDaoAddress(await dao.getAddress());
        await execution.connect(owner).setDaoAddress(await dao.getAddress());
        await vault.connect(owner).grantRole(await vault.EXECUTOR_ROLE(), await execution.getAddress());
        await proposal.connect(owner).grantRole(await proposal.DAO_ROLE(), await execution.getAddress());
    });

    async function getProposalIdFromTx(tx) {
        const receipt = await tx.wait();
        const events = await proposal.queryFilter(proposal.filters.ProposalCreated(), receipt.blockNumber);
        if (events.length === 0) throw new Error("ProposalCreated event not found");
        return events[events.length - 1].args.id;
    }

    async function fundDAO() {
        await owner.sendTransaction({ to: await dao.getAddress(), value: ethers.parseEther("1.0") }); // 넉넉하게 보냄
    }

    it("1. 멤버 가입/참가비/GlassScore/멤버 목록", async function () {
        await dao.connect(user1).joinDAO({ value: await dao.entryFee() });
        expect(await proposal.hasRole(await proposal.MEMBER_ROLE(), user1.address)).to.be.true;
        expect(await proposal.glassScore(user1.address)).to.equal(50);
    });

    it("2. proposal 생성/투표/이행여부 투표/점수 변화/집행", async function () {
        await dao.connect(user1).joinDAO({ value: await dao.entryFee() });
        await dao.connect(user2).joinDAO({ value: await dao.entryFee() });

        const tx = await dao.connect(user1).createProposal("Test Out", "Desc", 0, user1.address, true, "treasury-out", 0, 0, ethers.ZeroAddress);
        const proposalId = await getProposalIdFromTx(tx);
        
        await dao.connect(user1).vote(proposalId, 0);
        await dao.connect(user2).vote(proposalId, 0);

        await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");

        await fundDAO();
        const finalizeTx = await dao.finalizeProposal(proposalId);
        const execCheckProposalId = await getProposalIdFromTx(finalizeTx);

        await dao.connect(user1).vote(execCheckProposalId, 0);
        await dao.connect(user2).vote(execCheckProposalId, 0);
        
        await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");

        await fundDAO();
        await dao.finalizeProposal(execCheckProposalId);

        // 점수: 50(가입)+3(제안)+1(투표)+1(이행투표)+4(이행성공) = 59점
        expect(await proposal.glassScore(user1.address)).to.equal(59);
    });

    it("3. 투표 미참여시 페널티, glassScore 감소, Vault 잔고 증가", async function () {
        await dao.connect(user1).joinDAO({ value: await dao.entryFee() }); // 멤버: owner, user1
        await dao.connect(user2).joinDAO({ value: await dao.entryFee() }); // 멤버: owner, user1, user2
        await dao.connect(user3).joinDAO({ value: await dao.entryFee() }); // 멤버: owner, user1, user2, user3

        const tx = await dao.connect(user1).createProposal("Test Rule", "Desc", 0, ethers.ZeroAddress, true, "rule-change", 0, 0, ethers.ZeroAddress);
        const proposalId = await getProposalIdFromTx(tx);

        await dao.connect(user1).vote(proposalId, 0); // user1 투표
        await dao.connect(user2).vote(proposalId, 1); // user2 투표
        // 미참여자: owner, user3 (총 2명)

        await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        
        await fundDAO();
        const vaultBalanceBefore = await vault.getBalance();
        await dao.finalizeProposal(proposalId);
        const vaultBalanceAfter = await vault.getBalance();
        
        const absentPenalty = await dao.absentPenalty();
        
        // [최종 수정] 2명의 미참여자에 대한 페널티 총액을 계산하여 비교합니다.
        const nonVoterCount = 2; // owner, user3
        const expectedPenaltyTotal = absentPenalty * BigInt(nonVoterCount);
        expect(vaultBalanceAfter - vaultBalanceBefore).to.equal(expectedPenaltyTotal);

        expect(await proposal.penaltyCount(user3.address)).to.equal(1);
        expect(await proposal.glassScore(user3.address)).to.equal(47);
    });

    it("4. glassScore가 scoreToExpel 미만이면 자동 추방", async function () {
        await dao.connect(user1).joinDAO({ value: await dao.entryFee() });
        await dao.connect(owner).adminSubGlassScore(user1.address, 31);
        expect(await proposal.isMember(user1.address)).to.be.false;
    });

    it("5. 규칙변경 proposal로 scoreToExpel 변경", async function () {
        await dao.connect(user1).joinDAO({ value: await dao.entryFee() });
        const tx = await dao.connect(user1).createProposal("scoreToExpel", "change", 0, ethers.ZeroAddress, true, "rule-change", 20, 10, ethers.ZeroAddress);
        const proposalId = await getProposalIdFromTx(tx);
        await dao.connect(user1).vote(proposalId, 0); // 미참여자: owner (1명)

        await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        await fundDAO();
        await dao.finalizeProposal(proposalId);
        expect(await dao.scoreToExpel()).to.equal(10);
    });

    it("6. 출금 proposal 집행, Vault 잔고 감소", async function () {
        const joinFee = await dao.entryFee();
        await dao.connect(user1).joinDAO({ value: joinFee });
        const payoutAmount = ethers.parseEther("0.01");
        const tx = await dao.connect(user1).createProposal("Payout", "Desc", payoutAmount, user2.address, true, "treasury-out", 0, 0, ethers.ZeroAddress);
        const proposalId = await getProposalIdFromTx(tx);
        await dao.connect(user1).vote(proposalId, 0); // 미참여자: owner (1명)

        await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        
        const vaultBalanceBefore = await vault.getBalance();
        await fundDAO();
        await dao.finalizeProposal(proposalId);
        const vaultBalanceAfter = await vault.getBalance();

        // [최종 수정] Vault의 순 변화량 (출금액 - 페널티 입금액)을 계산하여 비교합니다.
        const penaltyIn = await dao.absentPenalty(); // 미참여자 1명분
        const expectedNetChange = payoutAmount - penaltyIn;
        expect(vaultBalanceBefore - vaultBalanceAfter).to.equal(expectedNetChange);
    });

    it("7. 입금 proposal 투표/집행", async function () {
        await dao.connect(user1).joinDAO({ value: await dao.entryFee() });
        const tx = await dao.connect(user1).createProposal("Deposit", "Desc", 0, ethers.ZeroAddress, true, "treasury-in", 0, 0, ethers.ZeroAddress);
        const proposalId = await getProposalIdFromTx(tx);
        await dao.connect(user1).vote(proposalId, 0); // 미참여자: owner (1명)

        await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        await fundDAO();
        await dao.finalizeProposal(proposalId);
        const proposalData = await proposal.getProposal(proposalId);
        expect(proposalData.status).to.equal(3); // Executed
    });
});