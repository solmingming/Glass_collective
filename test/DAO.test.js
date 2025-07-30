const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO Full Integration Test Suite", function () {
    // 테스트에 사용할 계정 및 컨트랙트 변수 선언
    let owner, user1, user2, user3;
    let proposal, vault, execution, dao;

    // 각 테스트 케이스 실행 전에 컨트랙트를 배포하고 초기 설정을 완료합니다.
    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();

        // 컨트랙트 팩토리 가져오기
        const ProposalFactory = await ethers.getContractFactory("Proposal");
        const VaultFactory = await ethers.getContractFactory("Vault");
        const ExecutionFactory = await ethers.getContractFactory("Execution");
        const DAOFactory = await ethers.getContractFactory("DAO");

        // 컨트랙트 배포
        vault = await VaultFactory.deploy(owner.address, ethers.ZeroAddress);
        proposal = await ProposalFactory.deploy(owner.address);
        execution = await ExecutionFactory.deploy(await proposal.getAddress(), await vault.getAddress());
        dao = await DAOFactory.deploy(await proposal.getAddress(), await vault.getAddress(), await execution.getAddress());

        // --- 컨트랙트 간 주소 및 역할 설정 ---
        await proposal.connect(owner).setDaoAddress(await dao.getAddress());
        await execution.connect(owner).setDaoAddress(await dao.getAddress());
        await vault.connect(owner).grantRole(await vault.EXECUTOR_ROLE(), await execution.getAddress());
        await proposal.connect(owner).grantRole(await proposal.DAO_ROLE(), await dao.getAddress());
        // Execution 컨트랙트가 Proposal 상태를 변경할 수 있도록 DAO_ROLE 부여
        await proposal.connect(owner).grantRole(await proposal.DAO_ROLE(), await execution.getAddress());
    });

    /**
     * 트랜잭션으로부터 ProposalCreated 이벤트의 ID를 추출하는 헬퍼 함수
     */
    async function getProposalIdFromTx(tx) {
        const receipt = await tx.wait();
        const events = await proposal.queryFilter(proposal.filters.ProposalCreated(), receipt.blockNumber);
        if (events.length === 0) throw new Error("ProposalCreated event not found in transaction");
        return events[events.length - 1].args.id;
    }

    /**
     * finalizeProposal 호출 시 페널티 지급을 위해 DAO 컨트랙트에 충분한 자금을 보내는 헬퍼 함수
     */
    async function fundDAO() {
        await owner.sendTransaction({ to: await dao.getAddress(), value: ethers.parseEther("1.0") });
    }

    describe("Membership and Core Functions", function () {
        
        it("✅ [신규] should correctly report membership status with isMember", async function () {
            // 가입 전: user1은 멤버가 아니어야 함
            expect(await dao.isMember(user1.address)).to.be.false;

            // 가입 후: user1은 멤버여야 함
            await dao.connect(user1).joinDAO({ value: await dao.entryFee() });
            expect(await dao.isMember(user1.address)).to.be.true;

            // 추방 후: user1은 더 이상 멤버가 아니어야 함
            await dao.connect(owner).adminSubGlassScore(user1.address, 31);
            expect(await dao.isMember(user1.address)).to.be.false;
        });

        it("should allow members to join, initialize status, and check member list", async function () {
            await dao.connect(user1).joinDAO({ value: await dao.entryFee() });
            
            // 역할, Glass Score, 멤버 수 확인
            expect(await proposal.hasRole(await proposal.MEMBER_ROLE(), user1.address)).to.be.true;
            expect(await proposal.glassScore(user1.address)).to.equal(50);
            expect(await dao.getMemberCount()).to.equal(2); // owner, user1
        });

        it("should prevent non-members from creating proposals or voting", async function () {
            await expect(
                dao.connect(user1).createProposal("Title", "Desc", 0, user1.address, true, "treasury-out", 0, 0, ethers.ZeroAddress)
            ).to.be.revertedWith("DAO: Caller is not a member");

            // user2가 제안을 생성
            await dao.connect(user2).joinDAO({ value: await dao.entryFee() });
            const tx = await dao.connect(user2).createProposal("Valid Prop", "Desc", 0, user2.address, true, "treasury-out", 0, 0, ethers.ZeroAddress);
            const proposalId = await getProposalIdFromTx(tx);

            // 멤버가 아닌 user1이 투표 시도
            await expect(dao.connect(user1).vote(proposalId, 0)).to.be.revertedWith("DAO: Caller is not a member");
        });
    });

    describe("Full Proposal Lifecycle", function () {
        beforeEach(async function() {
            // 모든 테스트에 필요한 기본 멤버(user1, user2)를 가입시킵니다.
            await dao.connect(user1).joinDAO({ value: await dao.entryFee() });
            await dao.connect(user2).joinDAO({ value: await dao.entryFee() });
        });

        it("should execute a full proposal flow: create, vote, finalize, and run execution check", async function () {
            const tx = await dao.connect(user1).createProposal("Test Payout", "Desc", 0, user1.address, true, "treasury-out", 0, 0, ethers.ZeroAddress);
            const proposalId = await getProposalIdFromTx(tx);
            
            await dao.connect(user1).vote(proposalId, 0); // 찬성
            await dao.connect(user2).vote(proposalId, 0); // 찬성

            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]); // 4일 후로 시간 이동
            await ethers.provider.send("evm_mine");

            await fundDAO();
            const finalizeTx = await dao.finalizeProposal(proposalId);
            
            // 제안이 통과되고 실행되었는지 확인
            const p1 = await proposal.getProposal(proposalId);
            expect(p1.status).to.equal(3); // Executed

            // 이행 여부 검증 제안이 새로 생성되었는지 확인
            const execCheckProposalId = await getProposalIdFromTx(finalizeTx);
            expect(execCheckProposalId).to.not.equal(proposalId);

            // 새 제안에 투표
            await dao.connect(user1).vote(execCheckProposalId, 0); // 찬성 (잘 이행됨)
            await dao.connect(user2).vote(execCheckProposalId, 0); // 찬성
            
            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await fundDAO();
            await dao.finalizeProposal(execCheckProposalId);

            // 최종 점수 계산: 50(가입)+3(제안)+1(투표)+1(이행투표)+4(이행성공) = 59점
            expect(await proposal.glassScore(user1.address)).to.equal(59);
        });

        it("should penalize non-voters, decrease their score, and increase vault balance", async function () {
            await dao.connect(user3).joinDAO({ value: await dao.entryFee() }); // user3 추가 가입
            // 현재 멤버: owner, user1, user2, user3 (4명)

            const tx = await dao.connect(user1).createProposal("Test Penalty", "Desc", 0, ethers.ZeroAddress, true, "rule-change", 0, 0, ethers.ZeroAddress);
            const proposalId = await getProposalIdFromTx(tx);

            await dao.connect(user1).vote(proposalId, 0); // user1 투표
            await dao.connect(user2).vote(proposalId, 1); // user2 투표
            // 미참여자: owner, user3 (2명)

            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");
            
            await fundDAO();
            const vaultBalanceBefore = await vault.getBalance();
            
            await dao.finalizeProposal(proposalId);
            
            const vaultBalanceAfter = await vault.getBalance();
            const absentPenalty = await dao.absentPenalty();
            
            // 2명의 미참여자에 대한 페널티 총액만큼 Vault 잔고가 증가했는지 확인
            const nonVoterCount = 2;
            const expectedPenaltyTotal = absentPenalty * BigInt(nonVoterCount);
            expect(vaultBalanceAfter - vaultBalanceBefore).to.equal(expectedPenaltyTotal);

            // user3의 페널티 카운트와 Glass Score 확인
            expect(await proposal.penaltyCount(user3.address)).to.equal(1);
            expect(await proposal.glassScore(user3.address)).to.equal(47); // 50(가입) - 3(미참여)
        });

        it("should execute a rule-change proposal and update the DAO's state", async function () {
            const tx = await dao.connect(user1).createProposal("scoreToExpel", "Change score to 10", 0, ethers.ZeroAddress, true, "rule-change", 20, 10, ethers.ZeroAddress);
            const proposalId = await getProposalIdFromTx(tx);
            
            await dao.connect(user1).vote(proposalId, 0);
            await dao.connect(user2).vote(proposalId, 0);

            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");
            await fundDAO();
            await dao.finalizeProposal(proposalId);
            
            // scoreToExpel 규칙이 10으로 변경되었는지 확인
            expect(await dao.scoreToExpel()).to.equal(10);
        });

        it("should execute a payout proposal and decrease the vault balance correctly", async function () {
            const payoutAmount = ethers.parseEther("0.01");
            const tx = await dao.connect(user1).createProposal("Payout to User3", "Desc", payoutAmount, user3.address, true, "treasury-out", 0, 0, ethers.ZeroAddress);
            const proposalId = await getProposalIdFromTx(tx);
            
            // [수정] 제안이 통과되도록 user2도 찬성 투표를 합니다.
            await dao.connect(user1).vote(proposalId, 0); 
            await dao.connect(user2).vote(proposalId, 0); // <-- 이 부분이 핵심 수정 사항
            // 이제 미참여자는 owner (1명)뿐입니다.

            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");
            
            await fundDAO();
            const vaultBalanceBefore = await vault.getBalance();
            
            await dao.finalizeProposal(proposalId);
            const vaultBalanceAfter = await vault.getBalance();

            // [수정] 미참여자가 1명이므로, 페널티 계산을 수정합니다.
            const penaltyIn = await dao.absentPenalty();
            const expectedNetChange = payoutAmount - penaltyIn;
            
            // 최종 잔액 변화량을 검증합니다.
            expect(vaultBalanceBefore - vaultBalanceAfter).to.equal(expectedNetChange);
        });
    });
});