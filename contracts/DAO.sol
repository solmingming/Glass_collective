// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Proposal.sol";
import "./Vault.sol";
import "./Execution.sol";

contract DAO {
    Proposal public proposalContract;
    Vault public vaultContract;
    Execution public executionContract;

    uint256 public voteQuorum = 50;
    uint256 public passCriteria = 50;
    uint256 public votingDuration = 3 days;
    uint256 public absentPenalty = 0.001 ether;
    uint256 public countToExpel = 5;
    uint256 public scoreToExpel = 20;
    uint256 public entryFee = 0.05 ether;

    mapping(uint256 => uint256) public proposalDeadline;
    mapping(uint256 => uint256) public proposalVoters;
    mapping(uint256 => bool) public proposalExecuted;

    event ProposalPassed(uint256 indexed proposalId);
    event ProposalRejected(uint256 indexed proposalId);

    constructor(address _proposal, address _vault, address _execution) {
        proposalContract = Proposal(_proposal);
        vaultContract = Vault(payable(_vault));
        executionContract = Execution(_execution);
    }

    //참가비 납부 및 멤버 가입
    //누구나 외부에서 호출할 수 있고 ETH를 함꼐 보낼 수 있음
    function joinDAO() external payable {
        require(!proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "Already a member");
        require(msg.value == entryFee, "Incorrect join fee");
        //참가비만큼 보내야 통과
        (bool sent, ) = address(vaultContract).call{value: msg.value}("");
        //참가비로 받은 이더를 DAO의 금고(valut 컨트랙트)로 전송
        require(sent, "Failed to send Ether to vault");
        proposalContract.grantRole(proposalContract.MEMBER_ROLE(), msg.sender);
        // 참가비까지 내고 이더 전송하면 해당 주소로 DAO 멤버 권한 부여
    }
    

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
        uint256 pid = proposalContract.createProposal(
            title,
            description,
            amount,
            recipient,
            requireVote,
            sanctionType,
            beforeValue,
            afterValue,
            targetMember
        );
        proposalContract.addGlassScore(msg.sender, 3);
        if (requireVote) {
            proposalDeadline[pid] = block.timestamp + votingDuration;
        } else {
            _executeProposal(pid);
        }
        return pid;
    }

    function vote(uint256 proposalId, uint8 choice) external {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        require(p.requireVote, "This proposal does not require voting");
        require(block.timestamp <= proposalDeadline[proposalId], "Voting period ended");
        require(!proposalContract.hasVotedForProposal(proposalId, msg.sender), "Already voted");

        proposalContract.vote(proposalId, choice);
        proposalContract.addGlassScore(msg.sender, 1);
        proposalVoters[proposalId] += 1;
    }

    function finalizeProposal(uint256 proposalId) external {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        require(p.requireVote, "Not a voting proposal");
        require(block.timestamp > proposalDeadline[proposalId], "Voting period not ended");
        require(!proposalExecuted[proposalId], "Already executed");

        address[] memory members = getAllMembers();
        for (uint256 i = 0; i < members.length; i++) {
            if (!proposalContract.hasVotedForProposal(proposalId, members[i])) {
                proposalContract.addPenaltyAndExpel(members[i]);
                // [추가] 미참여자를 기권표로 처리
                proposalContract.forceAbstain(proposalId, members[i]);
                proposalContract.subGlassScore(members[i], 3);
            }
        }

        // 가결 기준: 찬성/(찬성+반대) >= passCriteria
        uint256 totalEffectiveVotes = p.votesFor + p.votesAgainst;
        uint256 passRate = totalEffectiveVotes == 0 ? 0 : (p.votesFor * 100) / totalEffectiveVotes;

        if (passRate >= passCriteria) {
            proposalContract.setProposalStatus(proposalId, Proposal.Status.Passed);
            emit ProposalPassed(proposalId);
            _executeProposal(proposalId);
        } else {
            proposalContract.setProposalStatus(proposalId, Proposal.Status.Rejected);
            emit ProposalRejected(proposalId);
        }
        proposalExecuted[proposalId] = true;
    }


    function _executeProposal(uint256 proposalId) internal {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);

        if (keccak256(bytes(p.sanctionType)) == keccak256(bytes("treasury-out"))) {
            executionContract.executePayout(proposalId);

        } else if (keccak256(bytes(p.sanctionType)) == keccak256(bytes("rule-change"))) {
            if (keccak256(bytes(p.title)) == keccak256(bytes("voteQuorum"))) {
                voteQuorum = p.afterValue;
            } else if (keccak256(bytes(p.title)) == keccak256(bytes("passCriteria"))) {
                passCriteria = p.afterValue;
            } else if (keccak256(bytes(p.title)) == keccak256(bytes("votingDuration"))) {
                votingDuration = p.afterValue;
            } else if (keccak256(bytes(p.title)) == keccak256(bytes("absentPenalty"))) {
                absentPenalty = p.afterValue;
            } else if (keccak256(bytes(p.title)) == keccak256(bytes("entryFee"))) {
                entryFee = p.afterValue;
            } else if (keccak256(bytes(p.title)) == keccak256(bytes("countToExpel"))) {
                countToExpel = p.afterValue;
            }
            executionContract.executeRuleChange(proposalId);

        } else if (keccak256(bytes(p.sanctionType)) == keccak256(bytes("member-expel"))) {
            proposalContract.revokeRole(proposalContract.MEMBER_ROLE(), p.targetMember);
            executionContract.executeMemberExpel(proposalId);
        } else if (keccak256(bytes(p.sanctionType)) == keccak256(bytes("treasury-in"))) {
            // 입금 proposal: 프론트엔드에서 각 멤버가 Vault에 송금하도록 안내
            // 실제 이더 이동은 각 멤버가 직접 Vault에 송금
            // 필요시 입금 내역은 Vault의 Deposited 이벤트로 추적
        }
    }

    function getTreasuryBalance() external view returns (uint256) {
        return vaultContract.getBalance();
    }

    function getAllMembers() public view returns (address[] memory) {
        return proposalContract.getAllMembers();
    }

    function getMemberCount() public view returns (uint256) {
        return proposalContract.getMemberCount();
    }
}