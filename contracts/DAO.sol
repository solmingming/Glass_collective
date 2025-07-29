// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Proposal.sol";
import "./Vault.sol";
import "./Execution.sol";

/**
 * @title DAO
 * @dev DAO의 핵심 로직을 담당하는 메인 컨트랙트.
 *      사용자는 이 컨트랙트를 통해 멤버십, 제안, 투표 등 모든 활동에 참여합니다.
 */
contract DAO {
    Proposal public proposalContract;
    Vault public vaultContract;
    Execution public executionContract;

    // DAO 운영 규칙
    uint256 public passCriteria = 50;
    uint256 public votingDuration = 3 days;
    uint256 public absentPenalty = 0.001 ether;
    uint256 public countToExpel = 5;
    uint256 public scoreToExpel = 20;
    uint256 public entryFee = 0.05 ether;

    mapping(uint256 => uint256) public proposalDeadline;
    mapping(uint256 => bool) public proposalExecuted;

    event ProposalPassed(uint256 indexed proposalId);
    event ProposalRejected(uint256 indexed proposalId);

    constructor(address _proposal, address _vault, address _execution) {
        proposalContract = Proposal(_proposal);
        vaultContract = Vault(payable(_vault));
        executionContract = Execution(_execution);
    }

    // 페널티 지불용 ETH를 받기 위한 함수
    receive() external payable {}

    // 멤버로 가입
    function joinDAO() external payable {
        require(!proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "Already a member");
        require(msg.value == entryFee, "Incorrect join fee");
        (bool sent, ) = address(vaultContract).call{value: msg.value}("");
        require(sent, "Failed to send Ether to vault");
        proposalContract.grantRole(proposalContract.MEMBER_ROLE(), msg.sender);
    }
    
    // 새로운 제안 생성 (GlassScore +3)
    function createProposal(
        string calldata title, 
        string calldata description, 
        uint256 amount,
        address payable recipient, 
        bool requireVote, 
        string calldata sanctionType,
        uint256 beforeValue, 
        uint256 afterValue, 
        address targetMember
    ) external returns (uint256) {
        require(proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "DAO: Caller is not a member");
        Proposal.ProposalInput memory input = Proposal.ProposalInput({
            title: title, 
            description: description, 
            amount: amount, 
            recipient: recipient,
            requireVote: requireVote, 
            sanctionType: sanctionType, 
            beforeValue: beforeValue,
            afterValue: afterValue, 
            targetMember: targetMember
        });
        uint256 pid = proposalContract.createProposal(input, msg.sender);
        proposalContract.addGlassScore(msg.sender, 3);
        if (requireVote) {
            proposalDeadline[pid] = block.timestamp + votingDuration;
        } else {
            _executeProposal(pid);
        }
        return pid;
    }

    // 제안에 투표 (GlassScore +1)
    function vote(uint256 proposalId, uint8 choice) external {
        require(proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "DAO: Caller is not a member");
        proposalContract.addGlassScore(msg.sender, 1);
        proposalContract.vote(proposalId, choice, msg.sender);
    }

    // 제안 최종 처리
    function finalizeProposal(uint256 proposalId) external {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        require(p.requireVote, "Not a voting proposal");
        require(block.timestamp > proposalDeadline[proposalId], "Voting period not ended");
        require(!proposalExecuted[proposalId], "Proposal already finalized");

        // 1. 투표 미참여자 처리 (페널티, GlassScore -3, 강제 기권)
        address[] memory members = proposalContract.getAllMembers();
        for (uint256 i = 0; i < members.length; i++) {
            if (!proposalContract.hasVotedForProposal(proposalId, members[i])) {
                proposalContract.addPenaltyAndExpel(members[i]);
                proposalContract.forceAbstain(proposalId, members[i]);
                proposalContract.subGlassScore(members[i], 3);
                (bool sent, ) = address(vaultContract).call{value: absentPenalty}("");
                require(sent, "Failed to send penalty to vault");
            }
        }
        p = proposalContract.getProposal(proposalId);

        // 2. 투표 결과 판정
        uint256 totalEffectiveVotes = p.votesFor + p.votesAgainst + p.votesAbstain;
        uint256 passRate = totalEffectiveVotes == 0 ? 0 : (p.votesFor * 100) / totalEffectiveVotes;

        if (passRate >= passCriteria) {
            proposalContract.setProposalStatus(proposalId, Proposal.Status.Passed);
            emit ProposalPassed(proposalId);
            _executeProposal(proposalId);
            
            // 3. 이행 여부 확인 제안 자동 생성
            if (keccak256(bytes(p.sanctionType)) != keccak256(bytes("execution-check"))) {
                string memory newTitle = string(abi.encodePacked("Execution Check: ", p.title));
                string memory newDesc = "Vote YES if the original proposal was executed correctly, NO otherwise.";
                uint256 newPid = proposalContract.createProposal(
                    Proposal.ProposalInput({
                        title: newTitle, description: newDesc, amount: 0, recipient: payable(address(0)),
                        requireVote: true, sanctionType: "execution-check", beforeValue: 0, afterValue: 0,
                        targetMember: p.proposer
                    }), address(this)
                );
                proposalDeadline[newPid] = block.timestamp + votingDuration;
            }
        } else {
            proposalContract.setProposalStatus(proposalId, Proposal.Status.Rejected);
            emit ProposalRejected(proposalId);
        }
        proposalExecuted[proposalId] = true;

        // 4. 이행 여부 확인 투표 결과에 따른 점수 반영 (성공 +4, 실패 -10)
        if (keccak256(bytes(p.sanctionType)) == keccak256(bytes("execution-check"))) {
            if (passRate >= passCriteria) {
                proposalContract.addGlassScore(p.targetMember, 4);
            } else {
                proposalContract.subGlassScore(p.targetMember, 10);
            }
        }
    }

    // 제안 집행 (내부 함수)
    function _executeProposal(uint256 proposalId) internal {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        string memory sType = p.sanctionType;

        if (keccak256(bytes(sType)) == keccak256(bytes("treasury-out"))) { executionContract.executePayout(proposalId); }
        else if (keccak256(bytes(sType)) == keccak256(bytes("treasury-in"))) { executionContract.executeDeposit(proposalId); }
        else if (keccak256(bytes(sType)) == keccak256(bytes("rule-change"))) {
            string memory title = p.title;
            if (keccak256(bytes(title)) == keccak256(bytes("passCriteria"))) { passCriteria = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("votingDuration"))) { votingDuration = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("absentPenalty"))) { absentPenalty = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("entryFee"))) { entryFee = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("countToExpel"))) { countToExpel = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("scoreToExpel"))) { scoreToExpel = p.afterValue; }
            executionContract.executeRuleChange(proposalId);
        }
    }

    // 관리자가 점수 삭감 (테스트용)
    function adminSubGlassScore(address member, uint256 amount) external {
        require(proposalContract.hasRole(proposalContract.DEFAULT_ADMIN_ROLE(), msg.sender), "Not admin");
        proposalContract.subGlassScore(member, amount);
    }

    // 조회 함수들
    function getTreasuryBalance() external view returns (uint256) { return vaultContract.getBalance(); }
    function getAllMembers() public view returns (address[] memory) { return proposalContract.getAllMembers(); }
    function getMemberCount() public view returns (uint256) { return proposalContract.getMemberCount(); }
}